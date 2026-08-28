const { spawn } = require('child_process');

// Runs a CLI tool (qpdf, gs, verapdf) and collects its output. Supports an
// AbortSignal so the request-level timeout (see server.js) can kill a stuck
// child process instead of leaving it running after we've already responded
// (or after temp files it's holding open get deleted out from under it).
function runProcess(bin, args, { cwd, signal } = {}) {
  return new Promise((resolve, reject) => {
    // Windows can't CreateProcess a .bat/.cmd directly (spawn throws
    // EINVAL) -- only relevant for local Windows testing against veraPDF's
    // verapdf.bat launcher; the Linux container's launcher is a plain shell
    // script and never hits this branch.
    const needsShell = process.platform === 'win32' && /\.(bat|cmd)$/i.test(bin);
    const child = spawn(bin, args, { cwd, windowsHide: true, shell: needsShell });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const onAbort = () => {
      if (settled) return;
      child.kill('SIGKILL');
    };
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }

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
