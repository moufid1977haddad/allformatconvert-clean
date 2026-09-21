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
COMPRESS_CRF = {"light": 26, "balanced": 28, "strong": 32}
# Ladder used when a compressed result is not smaller than its source: the next,
# stronger level is tried once before the service says so honestly.
COMPRESS_LEVELS = ("light", "balanced", "strong")

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
# Fraction of size saved by one CRF point (measured 2026-09-20 on hard 1080p footage, indicative):
# H.264 / H.265 about 11 %, AV1 about 6 %, VP9 about 4.5 %. Used to jump straight to the CRF
# that should land just under the source instead of stepping blindly.
SIZE_PER_CRF = {"webm": 0.045, "av1": 0.06}
DEFAULT_SIZE_PER_CRF = 0.11
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
GOOD_MAX_WORK = 60.0
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


def _rate(cap):
    return ["-maxrate", f"{cap}k", "-bufsize", f"{2 * cap}k"] if cap else []


# target -> (extension, mime, kind, ffmpeg output args builder(quality, ctx))
def _h264(fmt=None, audio="aac"):
    def build(q, ctx):
        a = ["-c:v", "libx264", "-preset", "veryfast", "-crf", str(CRF[q] + ctx.crf_offset), "-pix_fmt", "yuv420p"]
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
    # Slow mode only for the first attempt: the size-ladder retries (crf_offset > 0) run in the fast mode.
    if ctx.work <= GOOD_MAX_WORK and ctx.crf_offset == 0:
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


class ProbeResult:
    def __init__(self, duration, has_video, has_audio, width, height, total_kbps=0):
        self.duration, self.has_video, self.has_audio, self.width, self.height = duration, has_video, has_audio, width, height
        self.total_kbps = total_kbps


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
    if not m:
        return None
    duration = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    v = _VIDEO_RE.search(err)
    has_audio = bool(_AUDIO_RE.search(err))
    if not v and not has_audio:
        return None
    br = _BITRATE_RE.search(err)
    return ProbeResult(duration, bool(v), has_audio, int(v.group(2)) if v else 0, int(v.group(3)) if v else 0, int(br.group(1)) if br else 0)


def build_command(op: str, params: dict, info: ProbeResult, in_path: str, out_path: str, input_bytes: int = 0, crf_offset: int = 0):
    """Returns (ffmpeg argv, extension, mime). Raises ValueError with a user-safe message."""
    quality = params.get("quality", "medium")
    if quality not in CRF:
        raise ValueError("Unknown quality level.")
    max_h = params.get("maxHeight")
    if max_h is not None and (not isinstance(max_h, int) or not 144 <= max_h <= 4320):
        raise ValueError("Unsupported maximum height.")

    base = [config.FFMPEG_PATH, "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
            "-protocol_whitelist", "file", "-i", in_path, "-map_metadata", "-1"]
    ctx = Ctx(info, input_bytes, crf_offset)

    if op == "compress":
        if not info.has_video:
            raise ValueError("This file has no video track to compress.")
        level = params.get("level", "balanced")
        if level not in COMPRESS_CRF:
            raise ValueError("Unknown compression level.")
        vf = []
        if max_h:
            vf = ["-vf", f"scale=-2:'min({max_h},ih)'"]
        args = base + ["-map", "0:v:0", "-map", "0:a:0?"] + vf + [
            "-c:v", "libx264", "-preset", "veryfast", "-crf", str(COMPRESS_CRF[level]), "-pix_fmt", "yuv420p",
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
        args = base + maps + vf + builder(quality, ctx) + [out_path]
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
