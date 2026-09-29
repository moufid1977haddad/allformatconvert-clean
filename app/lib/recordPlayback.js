// Canvas + MediaRecorder video tools (Video Rotator, Filter, Resizer): recording the WHOLE playback (audit 2, 29/09).
// Before, the recorder was stopped by a timer set to the video's duration from the moment playback started. When
// playback stalled (a large file still loading) or the visitor paused the visible player during processing, the timer
// fired before the video's end: the last seconds were silently missing; and while paused, the drawing loop stopped
// for good, so the rest of the recording showed one frozen frame. Now the recording follows the video: paused with
// it, resumed with it (drawing restarted), stopped on 'ended' only.

// video: the playing <video>; recorder: a MediaRecorder on the canvas stream; draw(): draws one frame on the canvas.
export function recordWholePlayback(video, recorder, draw) {
  let running = true;
  const loop = () => {
    if (!running) return;
    draw();
    if (!video.paused && !video.ended) requestAnimationFrame(loop);
  };
  const onPause = () => { if (!video.ended && recorder.state === 'recording') recorder.pause(); };
  const onPlay = () => { if (recorder.state === 'paused') recorder.resume(); requestAnimationFrame(loop); };
  const onEnded = () => {
    running = false;
    video.removeEventListener('pause', onPause);
    video.removeEventListener('play', onPlay);
    draw(); // the last frame
    if (recorder.state !== 'inactive') recorder.stop();
  };
  video.addEventListener('pause', onPause);
  video.addEventListener('play', onPlay);
  video.addEventListener('ended', onEnded, { once: true });
  recorder.start();
  loop();
}
