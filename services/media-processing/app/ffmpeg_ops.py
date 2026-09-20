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

# target -> (extension, mime, kind, ffmpeg output args builder)
def _h264(fmt=None):
    def build(q):
        a = ["-c:v", "libx264", "-preset", "veryfast", "-crf", str(CRF[q]), "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", f"{AUDIO_KBPS[q]}k"]
        if fmt in ("mp4", "mov", "3gp"):
            a += ["-movflags", "+faststart"]
        if fmt:
            a += ["-f", fmt]
        return a
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
    # open / legacy codecs
    "webm": ("webm", "video/webm", "video", lambda q: [
        "-c:v", "libvpx-vp9", "-crf", str({"high": 28, "medium": 33, "low": 38}[q]), "-b:v", "0",
        "-deadline", "realtime", "-cpu-used", "6", "-row-mt", "1", "-tile-columns", "2", "-pix_fmt", "yuv420p",
        "-c:a", "libopus", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "webm"]),
    "avi": ("avi", "video/x-msvideo", "video", lambda q: [
        "-c:v", "mpeg4", "-q:v", str({"high": 3, "medium": 5, "low": 8}[q]), "-pix_fmt", "yuv420p",
        "-c:a", "libmp3lame", "-q:a", str({"high": 2, "medium": 4, "low": 6}[q]), "-f", "avi"]),
    "wmv": ("wmv", "video/x-ms-wmv", "video", lambda q: [
        "-c:v", "wmv2", "-b:v", {"high": "4M", "medium": "2M", "low": "1M"}[q], "-pix_fmt", "yuv420p",
        "-c:a", "wmav2", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "asf"]),
    "ogv": ("ogv", "video/ogg", "video", lambda q: [
        "-c:v", "libtheora", "-q:v", str({"high": 8, "medium": 6, "low": 4}[q]),
        "-c:a", "libvorbis", "-q:a", str({"high": 6, "medium": 4, "low": 2}[q]), "-f", "ogg"]),
    "mpg": ("mpg", "video/mpeg", "video", lambda q: [
        "-c:v", "mpeg2video", "-q:v", str({"high": 3, "medium": 5, "low": 8}[q]), "-pix_fmt", "yuv420p",
        "-c:a", "mp2", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "mpeg"]),
    "gif": ("gif", "image/gif", "gif", lambda q: [
        "-an", "-vf", "fps=12,scale='min(640,iw)':-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
        "-loop", "0", "-f", "gif"]),
    # audio extraction
    "mp3": ("mp3", "audio/mpeg", "audio", lambda q: ["-vn", "-c:a", "libmp3lame", "-q:a", str({"high": 0, "medium": 2, "low": 5}[q]), "-f", "mp3"]),
    "m4a": ("m4a", "audio/mp4", "audio", lambda q: ["-vn", "-c:a", "aac", "-b:a", f"{AUDIO_KBPS[q] + 32}k", "-movflags", "+faststart", "-f", "ipod"]),
    "wav": ("wav", "audio/wav", "audio", lambda q: ["-vn", "-c:a", "pcm_s16le", "-f", "wav"]),
    "ogg": ("ogg", "audio/ogg", "audio", lambda q: ["-vn", "-c:a", "libvorbis", "-q:a", str({"high": 7, "medium": 5, "low": 3}[q]), "-f", "ogg"]),
    "opus": ("opus", "audio/ogg", "audio", lambda q: ["-vn", "-c:a", "libopus", "-b:a", f"{AUDIO_KBPS[q]}k", "-f", "ogg"]),
    "flac": ("flac", "audio/flac", "audio", lambda q: ["-vn", "-c:a", "flac", "-f", "flac"]),
}

OPS = ("convert", "compress")

_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")
_DEMUXER_RE = re.compile(r"Input #0, ([\w,]+),")
# Demuxers that make ffmpeg open OTHER files or sockets named inside the upload
# (playlists, concat lists, network streams). A media upload never needs them.
BLOCKED_DEMUXERS = {"hls", "applehttp", "concat", "ffconcat", "dash", "sdp", "rtsp", "rtp", "tee", "lavfi", "avisynth"}
_VIDEO_RE = re.compile(r"Stream #\d+:\d+.*?: Video: (\w+).*?, (\d{2,5})x(\d{2,5})")
_AUDIO_RE = re.compile(r"Stream #\d+:\d+.*?: Audio:")


class ProbeResult:
    def __init__(self, duration, has_video, has_audio, width, height):
        self.duration, self.has_video, self.has_audio, self.width, self.height = duration, has_video, has_audio, width, height


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
    return ProbeResult(duration, bool(v), has_audio, int(v.group(2)) if v else 0, int(v.group(3)) if v else 0)


def build_command(op: str, params: dict, info: ProbeResult, in_path: str, out_path: str):
    """Returns (ffmpeg argv, extension, mime). Raises ValueError with a user-safe message."""
    quality = params.get("quality", "medium")
    if quality not in CRF:
        raise ValueError("Unknown quality level.")
    max_h = params.get("maxHeight")
    if max_h is not None and (not isinstance(max_h, int) or not 144 <= max_h <= 4320):
        raise ValueError("Unsupported maximum height.")

    base = [config.FFMPEG_PATH, "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
            "-protocol_whitelist", "file", "-i", in_path, "-map_metadata", "-1"]

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
        args = base + maps + vf + builder(quality) + [out_path]
        return args, ext, mime

    raise ValueError("Unknown operation.")


def run(args, duration: float, on_progress, should_cancel, timeout: int):
    """Runs ffmpeg with `-progress pipe:1`, reporting a real 0-100 progress.

    Returns (returncode, cancelled, timed_out). stderr is never logged with
    content: only the return code leaves this function.
    """
    import time

    cmd = args[:1] + ["-progress", "pipe:1", "-nostats"] + args[1:]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
    start = time.monotonic()
    cancelled = timed_out = False
    try:
        for line in proc.stdout:
            if line.startswith("out_time_us=") or line.startswith("out_time_ms="):
                try:
                    us = int(line.split("=", 1)[1])
                    if duration > 0 and us >= 0:
                        on_progress(min(99.0, us / 1_000_000 / duration * 100.0))
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
    return proc.returncode, cancelled, timed_out
