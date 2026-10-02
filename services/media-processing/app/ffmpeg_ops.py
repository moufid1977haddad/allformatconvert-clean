"""ffmpeg command construction, probing and progress parsing.

Security notes (an uploaded file is untrusted input for ffmpeg):
- the input is always written as a fixed name inside the job directory: the
  visitor's filename never reaches ffmpeg or a log line;
- `-protocol_whitelist file` stops a crafted playlist / concat file inside the
  upload from making ffmpeg read other local files or open network sockets;
- the output name is fixed as well, and every option value below comes from an
  allowlist, never from the request text.
"""
from __future__ import annotations

import re
import subprocess

from . import config

# quality -> H.264 CRF (lower = better/bigger). "high" is visually near-lossless.
CRF = {"high": 20, "medium": 24, "low": 30}
AUDIO_KBPS = {"high": 160, "medium": 128, "low": 96}
# Retuned 2026-09-20 for the x264 "faster" preset (~23 % smaller than "veryfast" at equal VMAF, measured):
# balanced (crf 30) lands about where the old veryfast crf 28 was in size, with clearly higher VMAF.
COMPRESS_CRF = {"light": 27, "balanced": 30, "strong": 34}
# Ladder used when a compressed result is not smaller than its source: the next,
# stronger level is tried once before the service says so honestly.
COMPRESS_LEVELS = ("light", "balanced", "strong")
# P25 (E5): the same three levels in H.265 (x265 veryfast) and AV1 (SVT-AV1), each set to the VMAF of the x264 level
# on camera footage (measured 03/10, docs/audit/RAPPORT-p25-decisions-03-10.md §5): H.265 about 40 % and AV1 about
# 50 % smaller than H.264 at the same VMAF; on animation H.265 is smaller and better, AV1 larger but far better.
COMPRESS_CRF_BY_CODEC = {"h265": {"light": 27, "balanced": 30, "strong": 34}, "av1": {"light": 42, "balanced": 48, "strong": 55}}

# --- size policy (measured 2026-09-20, docs/audit/RAPPORT-video-qualite.md) -----------
# A converted/compressed video must not come out heavier than its source. A bitrate
# ceiling (VBV / maxrate) was tried first and REJECTED by measurement: it starves the
# complex opening seconds of a video (5 % of frames under VMAF 60, minimum VMAF 15 on a
# 3-minute clip, versus none without it). The policy is a re-encode LADDER instead:
# encode at the requested quality; if the result is larger than the source, encode again
# at a higher CRF (+6, then +12); if it is STILL larger, deliver it and say so.
MAX_ATTEMPTS = 3
# A compressed file must be at least this much smaller than the source to count as smaller.
NOT_SMALLER_RATIO = 0.98
# Fraction of size saved by one CRF point, measured 2026-09-20 on the hard 1080p reference (30 s of
# handheld foliage): VP9 good mode 7 %, AV1 (SVT preset 8) 6.4 %, H.265 (x265 veryfast) 13 %, H.264
# (x264 fast) 12 %. Used to jump straight to the CRF that should land just under the source.
SIZE_PER_CRF = {"webm": 0.07, "av1": 0.064, "h265": 0.12}
DEFAULT_SIZE_PER_CRF = 0.12
TARGET_SHARE = 0.95   # aim at 95 % of the source size when a retry is needed
ABORT_SHARE = 1.25    # abandon an attempt early when its projected size is above 125 % of the source
ABORT_AFTER_PCT = 12.0


def next_crf_offset(target: str, offset: int, size: float, source_size: int) -> int:
    """CRF offset for the next attempt, from the size (measured or projected) of this one."""
    import math
    k = SIZE_PER_CRF.get(target, DEFAULT_SIZE_PER_CRF)
    ratio = max(size / (TARGET_SHARE * source_size), 1.0)
    return offset + min(18, max(2, math.ceil(math.log(ratio) / -math.log(1 - k)) + 1))


# Targets whose encoder has a CRF: only these take part in the ladder.
LADDER_TARGETS = {"mp4", "m4v", "mov", "mkv", "flv", "ts", "3gp", "3g2", "f4v", "m2ts", "mts", "h265", "av1", "webm"}
# The bitrate-driven legacy encoders (mpeg4, xvid, mpeg2, theora, wmv2) have no CRF: they get a
# bitrate derived from the source instead (they do not show the starvation problem).
CAP_FRACTION = {"high": 1.0, "medium": 0.7, "low": 0.4}
MIN_VIDEO_KBPS = 150
# Old encoders overshoot their target bitrate and their containers add multiplexing overhead
# (measured on 6 s of 5.7 Mbit/s: +2 % to +8 % over the target), so they aim 15 % under it.
LEGACY_HEADROOM = 0.85

# --- effort policy ---------------------------------------------------------------------
# Effort is spent where it is cheap. "work" = seconds of 1080p-equivalent video. Up to
# GOOD_MAX_WORK the VP9 encoder runs in its slow "good" mode (about 2 VMAF points
# better at equal size, measured), beyond it in real-time mode (about 6x faster). These
# are tunable constants, not a hidden fallback: both modes produce a valid file, the
# choice only trades time for size.
GOOD_MAX_WORK = 90.0
AV1_PRESET_SHORT, AV1_PRESET_LONG, AV1_SHORT_MAX_WORK = 8, 9, 60.0


class Ctx:
    """What a target builder may know about the source."""

    def __init__(self, info, input_bytes, crf_offset=0):
        self.info = info
        self.crf_offset = crf_offset  # ladder step: added to the CRF of every CRF-based encoder
        self.work = info.duration * (max(info.width, 1) * max(info.height, 1)) / (1920 * 1080) if info.has_video else 0.0
        total = info.total_kbps
        if not total and info.duration > 0 and input_bytes:
            total = input_bytes * 8 / 1000 / info.duration
        self.total_kbps = total or 0

    def cap(self, fraction, audio_kbps=0):
        """Video bitrate ceiling in kbit/s, or None when the source bitrate is unknown."""
        if not self.total_kbps:
            return None
        return max(MIN_VIDEO_KBPS, int(self.total_kbps * fraction - (audio_kbps if self.info.has_audio else 0)))


def x264_preset(ctx):
    """Slower preset = smaller file at equal quality (measured on the 30 s reference: faster is ~23 % and
    fast ~27 % smaller than veryfast at the same VMAF, for ~2x and ~3x the CPU time). "faster" is the
    chosen trade; very long videos keep veryfast to bound the time."""
    return "faster" if ctx.work <= 300 else "veryfast"


def _rate(cap):
    return ["-maxrate", f"{cap}k", "-bufsize", f"{2 * cap}k"] if cap else []


# target -> (extension, mime, kind, ffmpeg output args builder(quality, ctx))
def _h264(fmt=None, audio="aac"):
    def build(q, ctx):
        a = ["-c:v", "libx264", "-preset", x264_preset(ctx), "-crf", str(CRF[q] + ctx.crf_offset), "-pix_fmt", "yuv420p"]
        a += ["-c:a", audio, "-b:a", f"{AUDIO_KBPS[q]}k"]
        if fmt in ("mp4", "mov", "3gp", "3g2"):
            a += ["-movflags", "+faststart"]
        if fmt == "m2ts":
            a += ["-f", "mpegts", "-mpegts_m2ts_mode", "1"]
        elif fmt:
            a += ["-f", fmt]
        return a
    return build


def _vp9(q, ctx):
    crf = {"high": 28, "medium": 33, "low": 38}[q] + ctx.crf_offset
    a = ["-c:v", "libvpx-vp9", "-crf", str(crf), "-b:v", "0", "-row-mt", "1", "-tile-columns", "2", "-pix_fmt", "yuv420p"]
    # Slow mode for short clips on every attempt: a doomed attempt is abandoned after ~12 % (see jobs.py),
    # so the retry costs little and keeps the better encoder.
    if ctx.work <= GOOD_MAX_WORK:
        a += ["-deadline", "good", "-cpu-used", "5", "-auto-alt-ref", "0", "-lag-in-frames", "0"]
    else:
        a += ["-deadline", "realtime", "-cpu-used", "6"]
    return a + ["-c:a", "libopus", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "webm"]


def _hevc(q, ctx):
    crf = {"high": 24, "medium": 28, "low": 33}[q] + ctx.crf_offset
    # hvc1 tag: required for QuickTime / Safari / iPhone to play HEVC in MP4.
    return ["-c:v", "libx265", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p", "-tag:v", "hvc1", "-x265-params", "log-level=error",
            "-c:a", "aac", "-b:a", f"{AUDIO_KBPS[q]}k", "-movflags", "+faststart", "-f", "mp4"]


def _av1(q, ctx):
    crf = {"high": 30, "medium": 36, "low": 42}[q] + ctx.crf_offset
    preset = AV1_PRESET_SHORT if ctx.work <= AV1_SHORT_MAX_WORK else AV1_PRESET_LONG
    return ["-c:v", "libsvtav1", "-preset", str(preset), "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", f"{AUDIO_KBPS[q]}k", "-movflags", "+faststart", "-f", "mp4"]


_MP3 = ("libmp3lame", lambda q: ["-q:a", str({"high": 2, "medium": 4, "low": 6}[q])])
_MP2 = ("mp2", lambda q: ["-b:a", f"{AUDIO_KBPS[q]}k"])
_WMA = ("wmav2", lambda q: ["-b:a", f"{AUDIO_KBPS[q]}k"])
_AC3 = ("ac3", lambda q: ["-b:a", {"high": "256k", "medium": "192k", "low": "128k"}[q]])
_VORBIS = ("libvorbis", lambda q: ["-q:a", str({"high": 6, "medium": 4, "low": 2}[q])])
_QSCALE = {"high": 3, "medium": 5, "low": 8}
_WMV_KBPS = {"high": 4000, "medium": 2000, "low": 1000}


def _legacy(vcodec, fmt, audio, qscale=None, kbps=None):
    """mpeg4 / mpeg2 / xvid / theora / wmv2 style encoders. These have no CRF mode: a fixed -q:v
    ignores -maxrate (measured: 4.6 MB from a 4.3 MB source), so the bitrate itself is set to the
    size ceiling (or to the format's fixed rate when that is lower). -q:v is only the fallback
    for a source whose bitrate cannot be read."""
    def build(q, ctx):
        a = ["-c:v", vcodec]
        cap = ctx.cap(CAP_FRACTION[q] * LEGACY_HEADROOM, AUDIO_KBPS[q])
        fixed = kbps[q] if kbps else None
        if cap:
            target = min(cap, fixed) if fixed else cap
            a += ["-b:v", f"{target}k", *_rate(target)]
        elif fixed:
            a += ["-b:v", f"{fixed}k"]
        elif qscale:
            a += ["-q:v", str(qscale[q])]
        return a + ["-pix_fmt", "yuv420p", "-c:a", audio[0], *audio[1](q), "-f", fmt]
    return build


TARGETS = {
    # containers with H.264 + AAC (universal playback)
    "mp4": ("mp4", "video/mp4", "video", _h264("mp4")),
    "m4v": ("m4v", "video/x-m4v", "video", _h264("mp4")),
    "mov": ("mov", "video/quicktime", "video", _h264("mov")),
    "mkv": ("mkv", "video/x-matroska", "video", _h264("matroska")),
    "flv": ("flv", "video/x-flv", "video", _h264("flv")),
    "ts": ("ts", "video/mp2t", "video", _h264("mpegts")),
    "3gp": ("3gp", "video/3gpp", "video", _h264("3gp")),
    "3g2": ("3g2", "video/3gpp2", "video", _h264("3g2")),
    "f4v": ("f4v", "video/x-f4v", "video", _h264("f4v")),
    # AVCHD / Blu-ray style transport streams (H.264 + AC-3)
    "m2ts": ("m2ts", "video/mp2t", "video", _h264("m2ts", audio="ac3")),
    "mts": ("mts", "video/mp2t", "video", _h264("m2ts", audio="ac3")),
    # next-generation codecs, MP4 container
    "h265": ("mp4", "video/mp4", "video", _hevc),
    "av1": ("mp4", "video/mp4", "video", _av1),
    # open / legacy codecs
    "webm": ("webm", "video/webm", "video", _vp9),
    "avi": ("avi", "video/x-msvideo", "video", _legacy("mpeg4", "avi", _MP3, qscale=_QSCALE)),
    "xvid": ("avi", "video/x-msvideo", "video", _legacy("libxvid", "avi", _MP3, qscale=_QSCALE)),
    "wmv": ("wmv", "video/x-ms-wmv", "video", _legacy("wmv2", "asf", _WMA, kbps=_WMV_KBPS)),
    "asf": ("asf", "video/x-ms-asf", "video", _legacy("wmv2", "asf", _WMA, kbps=_WMV_KBPS)),
    "ogv": ("ogv", "video/ogg", "video", _legacy("libtheora", "ogg", _VORBIS, qscale={"high": 8, "medium": 6, "low": 4})),
    "mpg": ("mpg", "video/mpeg", "video", _legacy("mpeg2video", "mpeg", _MP2, qscale=_QSCALE)),
    "mpeg": ("mpeg", "video/mpeg", "video", _legacy("mpeg2video", "mpeg", _MP2, qscale=_QSCALE)),
    "vob": ("vob", "video/x-ms-vob", "video", _legacy("mpeg2video", "vob", _AC3, qscale=_QSCALE)),
    "gif": ("gif", "image/gif", "gif", lambda q, ctx: [
        "-an", "-vf", "fps=12,scale='min(640,iw)':-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
        "-loop", "0", "-f", "gif"]),
    # audio extraction
    "mp3": ("mp3", "audio/mpeg", "audio", lambda q, ctx: ["-vn", "-c:a", "libmp3lame", "-q:a", str({"high": 0, "medium": 2, "low": 5}[q]), "-f", "mp3"]),
    "m4a": ("m4a", "audio/mp4", "audio", lambda q, ctx: ["-vn", "-c:a", "aac", "-b:a", f"{AUDIO_KBPS[q] + 32}k", "-movflags", "+faststart", "-f", "ipod"]),
    "aac": ("aac", "audio/aac", "audio", lambda q, ctx: ["-vn", "-c:a", "aac", "-b:a", f"{AUDIO_KBPS[q] + 32}k", "-f", "adts"]),
    "wav": ("wav", "audio/wav", "audio", lambda q, ctx: ["-vn", "-c:a", "pcm_s16le", "-f", "wav"]),
    "aiff": ("aiff", "audio/aiff", "audio", lambda q, ctx: ["-vn", "-c:a", "pcm_s16be", "-f", "aiff"]),
    "ogg": ("ogg", "audio/ogg", "audio", lambda q, ctx: ["-vn", "-c:a", "libvorbis", "-q:a", str({"high": 7, "medium": 5, "low": 3}[q]), "-f", "ogg"]),
    "opus": ("opus", "audio/ogg", "audio", lambda q, ctx: ["-vn", "-c:a", "libopus", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "ogg"]),
    "flac": ("flac", "audio/flac", "audio", lambda q, ctx: ["-vn", "-c:a", "flac", "-f", "flac"]),
    "wma": ("wma", "audio/x-ms-wma", "audio", lambda q, ctx: ["-vn", "-c:a", "wmav2", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "asf"]),
    "ac3": ("ac3", "audio/ac3", "audio", lambda q, ctx: ["-vn", "-c:a", "ac3", "-b:a", {"high": "256k", "medium": "192k", "low": "128k"}[q], "-f", "ac3"]),
    # AMR-NB is telephony audio: 8 kHz mono by definition of the format
    "amr": ("amr", "audio/amr", "audio", lambda q, ctx: ["-vn", "-ar", "8000", "-ac", "1", "-c:a", "libopencore_amrnb", "-b:a", "12.2k", "-f", "amr"]),
}

OPS = ("convert", "compress")

_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")
_DEMUXER_RE = re.compile(r"Input #0, ([\w,]+),")
# Demuxers that make ffmpeg open OTHER files or sockets named inside the upload
# (playlists, concat lists, network streams). A media upload never needs them.
BLOCKED_DEMUXERS = {"hls", "applehttp", "concat", "ffconcat", "dash", "sdp", "rtsp", "rtp", "tee", "lavfi", "avisynth"}
_VIDEO_RE = re.compile(r"Stream #\d+:\d+.*?: Video: (\w+).*?, (\d{2,5})x(\d{2,5})")
_AUDIO_RE = re.compile(r"Stream #\d+:\d+.*?: Audio:")
_BITRATE_RE = re.compile(r"bitrate:\s*(\d+)\s*kb/s")
_FPS_RE = re.compile(r"Stream #\d+:\d+.*?: Video: .*?, (\d+(?:\.\d+)?) fps")


class ProbeResult:
    def __init__(self, duration, has_video, has_audio, width, height, total_kbps=0, fps=0.0):
        self.duration, self.has_video, self.has_audio, self.width, self.height = duration, has_video, has_audio, width, height
        self.total_kbps = total_kbps
        self.fps = fps  # 0 when unknown (P25: keeps a sped-up video at its own frame rate)


_OUT_TIME_RE = re.compile(r"out_time_us=(\d+)")


def _measure_duration(path: str) -> float:
    """Duration of a file whose header has none: the last timestamp of a stream copy to nowhere (no decoding)."""
    try:
        p = subprocess.run(
            [config.FFMPEG_PATH, "-hide_banner", "-nostdin", "-v", "error", "-protocol_whitelist", "file", "-i", path,
             "-map", "0", "-c", "copy", "-f", "null", "-", "-progress", "pipe:1"],
            capture_output=True, timeout=45,  # runs inside the /start request: kept short (security review 30/09)
        )
    except subprocess.TimeoutExpired:
        return 0.0
    times = _OUT_TIME_RE.findall(p.stdout.decode("utf-8", "replace"))
    return int(times[-1]) / 1e6 if times else 0.0


def probe(path: str):
    """Reads container info with `ffmpeg -i` (no ffprobe binary needed).

    Returns a ProbeResult, or None when ffmpeg cannot read the file as media.
    """
    try:
        p = subprocess.run(
            [config.FFMPEG_PATH, "-hide_banner", "-protocol_whitelist", "file", "-i", path],
            capture_output=True, timeout=60,
        )
    except subprocess.TimeoutExpired:
        return None
    err = p.stderr.decode("utf-8", "replace")
    dm = _DEMUXER_RE.search(err)
    if dm and BLOCKED_DEMUXERS & set(dm.group(1).split(",")):
        return None
    m = _DURATION_RE.search(err)
    if m:
        duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    elif "Duration: N/A" in err:
        # A browser recording (MediaRecorder WebM: Chrome, Edge, Firefox) has no duration in its header (30/09, found
        # with Screen Recorder's "Make an MP4"): measured by reading the file once without decoding it.
        duration = _measure_duration(path)
        if not duration:
            return None
    else:
        return None
    v = _VIDEO_RE.search(err)
    has_audio = bool(_AUDIO_RE.search(err))
    if not v and not has_audio:
        return None
    br = _BITRATE_RE.search(err)
    fr = _FPS_RE.search(err)
    return ProbeResult(duration, bool(v), has_audio, int(v.group(2)) if v else 0, int(v.group(3)) if v else 0, int(br.group(1)) if br else 0,
                       float(fr.group(1)) if fr else 0.0)


# GIF options (video-to-gif, mp4-to-gif pages; video-converter sends none and keeps the defaults below).
# The reference site (ezgif) offers start/end, a dozen output widths and a frame-rate choice.
GIF_WIDTHS = (160, 240, 320, 360, 400, 480, 540, 600, 640, 720, 800, 960, 1080)
GIF_FPS = (5, 8, 10, 12, 15, 20, 25, 30)
GIF_MAX_SECONDS = 60
GIF_DEFAULT_FPS = 12
GIF_DEFAULT_MAX_WIDTH = 640


def gif_options(params: dict, info: ProbeResult):
    """Validated (start, duration or None, width expr, fps). Raises ValueError with a user-safe message."""
    start = params.get("gifStart", 0)
    dur = params.get("gifDuration")
    width = params.get("gifWidth")
    fps = params.get("gifFps", GIF_DEFAULT_FPS)
    if not isinstance(start, (int, float)) or isinstance(start, bool) or start < 0 or (info.duration and start >= info.duration):
        raise ValueError("The start time is outside the video.")
    if dur is not None and (not isinstance(dur, (int, float)) or isinstance(dur, bool) or not 0.2 <= dur <= GIF_MAX_SECONDS):
        raise ValueError(f"A GIF can last up to {GIF_MAX_SECONDS} seconds.")
    if fps not in GIF_FPS:
        raise ValueError("Unsupported frame rate.")
    if width is None:
        wexpr = f"'min({GIF_DEFAULT_MAX_WIDTH},iw)'"
    elif width in GIF_WIDTHS:
        wexpr = f"'min({width},iw)'"  # never upscaled: a GIF wider than its source only gets heavier
    else:
        raise ValueError("Unsupported width.")
    return float(start), (float(dur) if dur is not None else None), wexpr, fps


# Precise cut (Video Trimmer, 28/09): an optional clip of a video/audio conversion, to the frame. The browser
# sends a piece it already cut WITHOUT re-encoding (fast, it starts on the keyframe before the wanted start),
# and here "-ss clipStart" before "-i" + re-encoding lands on the exact frame; "-t clipDuration" ends it.
# Absent = the whole file, as before (additive).
def clip_options(params: dict, info: ProbeResult):
    """Validated (start, duration) or None. Raises ValueError with a user-safe message."""
    start, dur = params.get("clipStart"), params.get("clipDuration")
    if start is None and dur is None:
        return None
    for v in (start, dur):
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            raise ValueError("Invalid cut points.")
    if start < 0 or (info.duration and start >= info.duration):
        raise ValueError("The start time is outside the video.")
    if not dur > 0:
        raise ValueError("The clip must last more than zero seconds.")
    return float(start), float(dur)


# Video edits (30/09, owner's iPhone): Video Rotator, Resizer, Filter and Merger used to replay the video in a
# <canvas> and record it with MediaRecorder -- in real time, with the source playing full screen on iPhone, and a
# WebM that Photos cannot open. Here, as the reference sites do (Clideo, Kapwing, VEED: on a server), the edit is a
# filter of an MP4 (H.264 + AAC) conversion. All optional and absent by default (additive): the old requests are
# unchanged. Every value comes from an allowlist or a bounded number, never from the request text.
_SAT = 3.0  # CSS saturate(300%), the tool's "Saturate": the matrix of the CSS Filter Effects spec
_S = [0.213 + 0.787 * _SAT, 0.715 - 0.715 * _SAT, 0.072 - 0.072 * _SAT,
      0.213 - 0.213 * _SAT, 0.715 + 0.285 * _SAT, 0.072 - 0.072 * _SAT,
      0.213 - 0.213 * _SAT, 0.715 - 0.715 * _SAT, 0.072 + 0.928 * _SAT]
VIDEO_FILTERS = {
    # the CSS filters the page previews, with the same matrices (Filter Effects Module Level 1)
    "grayscale": "colorchannelmixer=.2126:.7152:.0722:0:.2126:.7152:.0722:0:.2126:.7152:.0722:0",
    "sepia": "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131:0",
    "invert": "negate",
    "blur": "gblur=sigma=3",
    "brightness": "lutrgb=r='clip(val*1.5,0,255)':g='clip(val*1.5,0,255)':b='clip(val*1.5,0,255)'",
    "contrast": "lutrgb=r='clip((val-127.5)*2+127.5,0,255)':g='clip((val-127.5)*2+127.5,0,255)':b='clip((val-127.5)*2+127.5,0,255)'",
    "saturate": "colorchannelmixer=" + ":".join(f"{v:.4f}" for v in (_S[0], _S[1], _S[2], 0, _S[3], _S[4], _S[5], 0, _S[6], _S[7], _S[8], 0)),
}
ROTATIONS = {90: "transpose=clock", 180: "hflip,vflip", 270: "transpose=cclock"}
EDIT_TARGETS = ("mp4", "mov", "m4v")

# P25 (03/10, owner's decision E5): the edits 123apps, Clideo, Kapwing and FreeConvert offer and the service did not --
# mirror, free crop, speed, volume and fades, the codec (H.265 / AV1) and an exact CRF. All optional and absent by
# default (additive): a request without them builds the same command as before, byte for byte.
FLIPS = {"h": "hflip", "v": "vflip", "hv": "hflip,vflip"}
# 123apps / Clideo speed steps; the sound follows without changing pitch (atempo takes 0.5-2 per stage).
SPEEDS = {0.25: ["atempo=0.5", "atempo=0.5"], 0.5: ["atempo=0.5"], 0.75: ["atempo=0.75"], 1.25: ["atempo=1.25"],
          1.5: ["atempo=1.5"], 2: ["atempo=2"], 3: ["atempo=2", "atempo=1.5"], 4: ["atempo=2", "atempo=2"]}
MAX_VOLUME = 3.0   # 300 %, FreeConvert's ceiling is 200 %; 0 = silent
MAX_FADE_SECONDS = 10.0
CODECS = ("h264", "h265", "av1")
CRF_RANGE = {"h264": (0, 51), "h265": (0, 51), "av1": (0, 63)}


class Edit:
    """A validated edit: video filters, audio filters and the speed (which changes the output's length)."""

    def __init__(self, vf, for_concat, af=None, speed=1.0, fade=None):
        self.vf, self.for_concat, self.af, self.speed, self.fade = vf, for_concat, af or [], speed, fade

    def __iter__(self):  # (vf, for_concat), as the edit was returned before P25
        return iter((self.vf, self.for_concat))


def _num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def edit_options(params: dict):
    """Validated video edit: (filters for -vf, for_concat) or None. Raises ValueError (user-safe message).
    rotate: 90|180|270 clockwise, applied after the source's own rotation (ffmpeg's autorotate);
    fit: {w, h, mode: fit|fill|stretch} -- fit = letterbox, fill = crop, as Video Resizer offers;
    filter: one of VIDEO_FILTERS; fps: 1-120 (constant frame rate);
    forConcat: every clip of a merge normalised so the browser can join them WITHOUT re-encoding: 48 kHz stereo
    audio always present (silence added when the clip has none) and x264 "stitchable" headers."""
    rotate, fit, flt, fps, concat = (params.get(k) for k in ("rotate", "fit", "filter", "fps", "forConcat"))
    flip, crop, speed, volume, fade_in, fade_out, fade_video = (params.get(k) for k in ("flip", "crop", "speed", "volume", "fadeIn", "fadeOut", "fadeVideo"))
    if all(v is None for v in (rotate, fit, flt, fps, concat, flip, crop, speed, volume, fade_in, fade_out, fade_video)):
        return None
    vf, af = [], []
    if crop is not None:
        # in the picture as it is shown (after the source's own rotation), before the mirror, the rotation and the size;
        # clamped by ffmpeg to the picture, so a box drawn on a preview a few pixels off never fails the job
        if not isinstance(crop, dict):
            raise ValueError("Invalid crop.")
        x, y, w, h = (crop.get(k) for k in ("x", "y", "w", "h"))
        for v in (x, y, w, h):
            if isinstance(v, bool) or not isinstance(v, int) or not 0 <= v <= 7680:
                raise ValueError("Invalid crop.")
        if w < 16 or h < 16 or w % 2 or h % 2:
            raise ValueError("The cropped area must be at least 16 x 16 pixels, with even sides.")
        vf.append(f"crop=w='min({w},iw)':h='min({h},ih)':x='min({x},iw-ow)':y='min({y},ih-oh)'")
    if flip is not None:
        if not isinstance(flip, str) or flip not in FLIPS:
            raise ValueError("Unsupported mirror.")
        vf.append(FLIPS[flip])
    if rotate is not None:
        if isinstance(rotate, bool) or not isinstance(rotate, int) or rotate not in ROTATIONS:
            raise ValueError("Unsupported rotation.")
        vf.append(ROTATIONS[rotate])
    if fit is not None:
        if not isinstance(fit, dict):
            raise ValueError("Invalid size.")
        w, h, mode = fit.get("w"), fit.get("h"), fit.get("mode", "fit")
        if not isinstance(mode, str):
            raise ValueError("Unsupported resize mode.")
        for v in (w, h):
            if isinstance(v, bool) or not isinstance(v, int) or not 16 <= v <= 7680 or v % 2:
                raise ValueError("Unsupported size: width and height must be even numbers from 16 to 7680.")
        if mode == "fit":
            vf.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1")
        elif mode == "fill":
            vf.append(f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h},setsar=1")
        elif mode == "stretch":
            vf.append(f"scale={w}:{h}:flags=lanczos,setsar=1")
        else:
            raise ValueError("Unsupported resize mode.")
    if flt is not None:
        if not isinstance(flt, str) or flt not in VIDEO_FILTERS:
            raise ValueError("Unsupported filter.")
        vf.append(VIDEO_FILTERS[flt])
    if fps is not None:
        if isinstance(fps, bool) or not isinstance(fps, (int, float)) or not 1 <= fps <= 120:
            raise ValueError("Unsupported frame rate.")
        vf.append(f"fps={round(float(fps), 3)}")
    if concat is not None and not isinstance(concat, bool):
        raise ValueError("Invalid option.")
    rate = 1.0
    if speed is not None:
        if not _num(speed) or float(speed) not in SPEEDS:
            raise ValueError("Unsupported speed.")
        rate = float(speed)
        vf.append(f"setpts=PTS/{rate}")
        af += SPEEDS[rate]
    if volume is not None:
        if not _num(volume) or not 0 <= volume <= MAX_VOLUME:
            raise ValueError("Unsupported volume.")
        af.append(f"volume={round(float(volume), 3)}")
    fade = None
    if fade_in is not None or fade_out is not None or fade_video is not None:
        for v in (fade_in, fade_out):
            if v is not None and (not _num(v) or not 0 <= v <= MAX_FADE_SECONDS):
                raise ValueError(f"A fade lasts up to {int(MAX_FADE_SECONDS)} seconds.")
        if fade_video is not None and not isinstance(fade_video, bool):
            raise ValueError("Invalid option.")
        fade = (float(fade_in or 0), float(fade_out or 0), bool(fade_video))
    if concat and (rate != 1.0 or af or fade):
        raise ValueError("Speed, volume and fades are not available when joining videos.")
    return Edit(vf, bool(concat), af, rate, fade)


def _speed(params: dict) -> float:
    s = params.get("speed")
    return float(s) if _num(s) and float(s) in SPEEDS else 1.0


def effective_duration(op: str, params: dict, info: ProbeResult) -> float:
    """Length of what ffmpeg will actually encode -- the progress bar's 100 %."""
    if op == "convert" and params.get("target") != "gif" and _speed(params) != 1.0:
        return _effective_unsped(op, params, info) / _speed(params)
    return _effective_unsped(op, params, info)


def _effective_unsped(op: str, params: dict, info: ProbeResult) -> float:
    if op == "convert" and params.get("target") != "gif":
        try:
            clip = clip_options(params, info)
        except ValueError:
            clip = None
        if clip:
            remaining = max(0.0, info.duration - clip[0]) if info.duration else clip[1]
            return min(clip[1], remaining) if remaining else clip[1]
    if op == "convert" and params.get("target") == "gif":
        try:
            start, dur, _, _ = gif_options(params, info)
        except ValueError:
            return info.duration
        remaining = max(0.0, info.duration - start) if info.duration else 0.0
        return min(dur, remaining) if dur is not None and remaining else (dur or remaining or info.duration)
    return info.duration


def build_command(op: str, params: dict, info: ProbeResult, in_path: str, out_path: str, input_bytes: int = 0, crf_offset: int = 0):
    """Returns (ffmpeg argv, extension, mime). Raises ValueError with a user-safe message."""
    quality = params.get("quality", "medium")
    if not isinstance(quality, str) or quality not in CRF:
        raise ValueError("Unknown quality level.")
    max_h = params.get("maxHeight")
    if max_h is not None and (not isinstance(max_h, int) or not 144 <= max_h <= 4320):
        raise ValueError("Unsupported maximum height.")

    base = [config.FFMPEG_PATH, "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
            "-protocol_whitelist", "file", "-i", in_path, "-map_metadata", "-1"]
    ctx = Ctx(info, input_bytes, crf_offset)

    codec, crf = params.get("codec"), params.get("crf")
    if codec is not None and (not isinstance(codec, str) or codec not in CODECS):
        raise ValueError("Unsupported codec.")
    if crf is not None:
        lo, hi = CRF_RANGE[codec or "h264"]
        if isinstance(crf, bool) or not isinstance(crf, int) or not lo <= crf <= hi:
            raise ValueError(f"The quality value (CRF) must be a whole number from {lo} to {hi}.")

    if op == "compress":
        if not info.has_video:
            raise ValueError("This file has no video track to compress.")
        level = params.get("level", "balanced")
        if level not in COMPRESS_CRF:
            raise ValueError("Unknown compression level.")
        vf = []
        if max_h:
            vf = ["-vf", f"scale=-2:'min({max_h},ih)'"]
        if codec in ("h265", "av1"):
            # P25 (E5): H.265 / AV1 compression, same three levels, CRF of the same visual step (COMPRESS_CRF_BY_CODEC)
            value = crf if crf is not None else COMPRESS_CRF_BY_CODEC[codec][level]
            venc = (["-c:v", "libx265", "-preset", "veryfast", "-crf", str(value), "-tag:v", "hvc1", "-x265-params", "log-level=error"] if codec == "h265"
                    else ["-c:v", "libsvtav1", "-preset", str(AV1_PRESET_SHORT if ctx.work <= AV1_SHORT_MAX_WORK else AV1_PRESET_LONG), "-crf", str(value)])
            args = base + ["-map", "0:v:0", "-map", "0:a:0?"] + vf + venc + [
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-f", "mp4", out_path]
            return args, "mp4", "video/mp4"
        args = base + ["-map", "0:v:0", "-map", "0:a:0?"] + vf + [
            "-c:v", "libx264", "-preset", x264_preset(ctx), "-crf", str(crf if crf is not None else COMPRESS_CRF[level]), "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-f", "mp4", out_path]
        return args, "mp4", "video/mp4"

    if op == "convert":
        target = params.get("target")
        if target not in TARGETS:
            raise ValueError("Unsupported output format.")
        ext, mime, kind, builder = TARGETS[target]
        if kind in ("video", "gif") and not info.has_video:
            raise ValueError("This file has no video track; choose an audio format instead.")
        if kind == "audio" and not info.has_audio:
            raise ValueError("This file has no audio track to extract.")
        vf = []
        if target == "ogv":
            max_h = min(max_h or 720, 720)  # Theora encodes on one thread: capped so it stays practical
        if max_h and kind == "video":
            vf = ["-vf", f"scale=-2:'min({max_h},ih)'"]
        maps = ["-map", "0:v:0", "-map", "0:a:0?"] if kind == "video" else (["-map", "0:v:0"] if kind == "gif" else ["-map", "0:a:0"])
        if kind == "gif":
            start, dur, wexpr, fps = gif_options(params, info)
            # -ss before -i: fast seek, still frame-accurate because the frames are re-encoded.
            gif_base = base[:base.index("-i")] + (["-ss", f"{start:.3f}"] if start else []) + base[base.index("-i"):]
            clip = ["-t", f"{dur:.3f}"] if dur is not None else []
            gif = ["-an", "-vf", f"fps={fps},scale={wexpr}:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
                   "-loop", "0", "-f", "gif"]
            return gif_base + maps + clip + gif + [out_path], ext, mime
        clip = clip_options(params, info)
        clip_v, clip_a = [], []
        if clip:
            # 30/09 (real Safari 17.6): a 1 s -> 5 s cut of a 30 fps video came back with 118 frames (3.933 s), sound
            # 3.99 s. Cause, reproduced: "-ss" before "-i" is shifted by the container's start time -- in the piece the
            # browser sends, the sound starts at 0.046 s and the video at 0.067 s (B-frames) -- so the seek landed 1-2
            # frames late, the video then started after the sound, and "-t" cut the last frames. Now the cut is made
            # on the file's own clock ("-copyts"): a coarse seek a few seconds before (speed only), then trim/atrim at
            # the exact start and length. Video and sound both last exactly the length asked; the first frame is the
            # first one at or after the start (2.5 ms of tolerance for millisecond-rounded timestamps).
            s, d = clip
            coarse = max(0.0, s - 5.0)
            base = base[:base.index("-i")] + ["-copyts", "-ss", f"{coarse:.3f}"] + base[base.index("-i"):]
            lo, hi = max(0.0, s - 0.0025), s + d - 0.0025
            clip_v = [f"trim=start={lo:.4f}:end={hi:.4f}", "setpts=PTS-STARTPTS"]
            if info.has_audio:
                clip_a = ["-af", f"atrim=start={s:.4f}:end={s + d:.4f},asetpts=PTS-STARTPTS"]
        edit = edit_options(params)
        if (codec is not None or crf is not None) and target not in EDIT_TARGETS:
            raise ValueError("The codec and the quality value are chosen for MP4 or MOV only.")
        if codec == "av1" and target == "mov":
            raise ValueError("AV1 is written in MP4 only.")
        extra = []
        if edit:
            if target not in EDIT_TARGETS:
                raise ValueError("Video edits are made in MP4 or MOV only.")
            filters, for_concat = edit
            if filters and max_h:
                raise ValueError("Choose either a size or a maximum height.")
            if filters:
                vf = ["-vf", ",".join(filters)]
            if for_concat:
                extra = ["-x264-params", "stitchable=1", "-ar", "48000", "-ac", "2", "-video_track_timescale", "90000"]
                if not info.has_audio:
                    # silence as long as the video, so every clip of the merge has the same streams
                    at = base.index(in_path) + 1  # a second INPUT: before the output options (-map_metadata)
                    base = base[:at] + ["-f", "lavfi", "-t", f"{max(info.duration, 0.1):.3f}", "-i", "anullsrc=r=48000:cl=stereo"] + base[at:]
                    maps = ["-map", "0:v:0", "-map", "1:a:0"] + maps[4:]
                # 30/09: the browser joins these clips by copy (concat demuxer), which starts each clip at the end of
                # the previous one's LONGEST stream. The AAC sound ran a few ms past the picture, so each join left a
                # gap in the video (8.019 s for 8 s, frame rate read as 60). Picture and sound now last exactly the
                # same whole number of frames: both padded (last frame held, silence) then cut at that length.
                rate = params.get("fps")
                length = round(info.duration * rate) / rate if rate and info.duration else info.duration
                if length:
                    vf = ["-vf", ",".join(([vf[1]] if vf else []) + ["tpad=stop_mode=clone:stop=-1"])]
                    extra += ["-af", "apad", "-t", f"{length:.6f}"]
        if clip_v:
            vf = ["-vf", ",".join(clip_v + ([vf[1]] if vf else []))]
        if edit and (edit.af or edit.fade):
            # Speed, volume and fades (P25): appended after the cut, on the OUTPUT's own timeline.
            length = effective_duration(op, params, info)
            if edit.fade:
                fi, fo, fv = edit.fade
                if fi + fo > length > 0:
                    raise ValueError("The fades are longer than the video.")
                a_f = ([f"afade=t=in:st=0:d={fi:.3f}"] if fi else []) + ([f"afade=t=out:st={max(0.0, length - fo):.3f}:d={fo:.3f}"] if fo else [])
                v_f = (([f"fade=t=in:st=0:d={fi:.3f}"] if fi else []) + ([f"fade=t=out:st={max(0.0, length - fo):.3f}:d={fo:.3f}"] if fo else [])) if fv else []
            else:
                a_f, v_f = [], []
            if edit.speed != 1 and info.fps:
                # the source's frame rate is kept: a 4x video does not carry 4x the frames, a slow-motion one is not
                # left at a half rate that some players stutter on (frames repeated, as 123apps and Clideo deliver)
                v_f = [f"fps={round(min(info.fps, 120.0), 3)}"] + v_f
            if v_f:
                vf = ["-vf", ",".join(([vf[1]] if vf else []) + v_f)]
            if info.has_audio and (edit.af or a_f):
                chain = ([clip_a[1]] if clip_a else []) + edit.af + a_f
                clip_a = ["-af", ",".join(chain)]
        if codec in ("h265", "av1"):
            builder = _hevc if codec == "h265" else _av1
        if codec == "av1" and vf and "vflip" in vf[1]:
            # SVT-AV1 refuses the frames ffmpeg's vflip hands over (negative line stride: "Invalid argument", measured
            # 03/10 on the live service); a same-size scale copies them into an ordinary buffer first.
            vf = ["-vf", vf[1] + ",scale=iw:ih"]
        args = base + maps + vf + clip_a + builder(quality, ctx) + extra + [out_path]
        if codec == "h265" and target == "mov":
            args[args.index("-f", len(base)) + 1] = "mov"
        if crf is not None:
            args[args.index("-crf") + 1] = str(crf)
        # Optional exact bitrate (Audio Compressor sends the one its visitor picked, 64-320 kbit/s). Opus only,
        # the one target that tool sends here; absent = the quality level's bitrate, as before (additive).
        kbps = params.get("kbps")
        if kbps is not None:
            if target != "opus" or isinstance(kbps, bool) or not isinstance(kbps, int) or not 6 <= kbps <= 510:
                raise ValueError("Unsupported bitrate.")
            args[args.index("-b:a") + 1] = f"{kbps}k"
        return args, ext, mime

    raise ValueError("Unknown operation.")


def run(args, duration: float, on_progress, should_cancel, timeout: int, abort_check=None):
    """Runs ffmpeg with `-progress pipe:1`, reporting a real 0-100 progress.

    Returns (returncode, cancelled, timed_out, aborted). `abort_check(progress_pct)` may stop the run
    early (the size ladder uses it when a projection says the result will be far too large).
    stderr is never logged with content: only the return code leaves this function.
    """
    import time

    cmd = args[:1] + ["-progress", "pipe:1", "-nostats"] + args[1:]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
    start = time.monotonic()
    cancelled = timed_out = aborted = False
    try:
        for line in proc.stdout:
            if line.startswith("out_time_us=") or line.startswith("out_time_ms="):
                try:
                    us = int(line.split("=", 1)[1])
                    if duration > 0 and us >= 0:
                        pct = min(99.0, us / 1_000_000 / duration * 100.0)
                        on_progress(pct)
                        if abort_check and abort_check(pct):
                            aborted = True
                            proc.kill()
                            break
                except ValueError:
                    pass
            if should_cancel():
                cancelled = True
                proc.kill()
                break
            if time.monotonic() - start > timeout:
                timed_out = True
                proc.kill()
                break
    finally:
        proc.wait()
    return proc.returncode, cancelled, timed_out, aborted
