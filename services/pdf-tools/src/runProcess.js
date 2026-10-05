const { spawn } = require('child_process');

// Runs a CLI tool (qpdf, gs, verapdf) and collects its output. Supports an
// AbortSignal so the request-level timeout (see server.js) can kill a stuck
// child process instead of leaving it running after we've already responded
// (or after temp files it's holding open get deleted out from under it).
// killGroup (P26, LibreOffice): start the tool in its own process group and kill the whole group on abort --
// soffice is a launcher that forks soffice.bin, which a kill of the launcher alone would leave running.
// env (P33): the child's environment (Tesseract on one thread); the service's own by default.
function runProcess(bin, args, { cwd, signal, killGroup = false, env } = {}) {
  return new Promise((resolve, reject) => {
    // Already aborted (e.g. a request that waited its whole time for a slot): never start the tool. Before P26
    // this case returned before any listener was attached, so the promise never settled.
    if (signal?.aborted) return resolve({ code: null, stdout: '', stderr: '', aborted: true });
    // Windows can't CreateProcess a .bat/.cmd directly (spawn throws
    // EINVAL) -- only relevant for local Windows testing against veraPDF's
    // verapdf.bat launcher; the Linux container's launcher is a plain shell
    // script and never hits this branch.
    const needsShell = process.platform === 'win32' && /\.(bat|cmd)$/i.test(bin);
    const group = killGroup && process.platform !== 'win32';
    const child = spawn(bin, args, { cwd, windowsHide: true, shell: needsShell, detached: group, ...(env ? { env } : {}) });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const onAbort = () => {
      if (settled) return;
      if (group) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
      } else {
        child.kill('SIGKILL');
      }
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      if (signal) signal.removeEventListener('abort', onAbort);
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve({ code, stdout, stderr, aborted: signal?.aborted === true });
    });
  });
}

module.exports = { runProcess };
