import { spawn } from 'node:child_process';
import net from 'node:net';
import { release, type } from 'node:os';

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const { port } = listener.address();
  await new Promise(resolve => listener.close(resolve));
  return port;
}

// Startup marker and liveness must precede HTTP: an HTTP200 alone proves no ownership.
/** @param {{cwd: string, port?: number, args?: string[], executable?: string, timeoutMs?: number}} options */
export async function startCaptureServer({ cwd, port, args, executable = process.execPath, timeoutMs = 20000 }) {
  port ??= await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(executable, args ?? ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd, env: { ...process.env, DATABASE_URL: '', NEXT_TELEMETRY_DISABLED: '1', CAPTURE_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let output = '', spawnError = false, closed = false;
  child.stdout.on('data', chunk => { output = (output + chunk).slice(-8192); });
  child.stderr.on('data', () => { /* Drain without exposing raw startup output. */ });
  child.once('error', () => { spawnError = true; });
  const exited = new Promise(resolve => child.once('close', () => { closed = true; resolve(); }));
  function assertRunning() {
    if (spawnError || closed || child.killed || child.exitCode !== null || child.signalCode !== null) {
      throw new Error('Owned capture server failed or exited.');
    }
  }
  async function close() {
    if (!child.pid || closed) return;
    child.kill('SIGTERM');
    let timer;
    try {
      await Promise.race([exited, new Promise(resolve => {
        timer = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 1500);
      })]);
    } finally { clearTimeout(timer); }
  }
  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      assertRunning();
      if (output.includes('Ready in')) {
        try {
          const response = await fetch(origin, { signal: AbortSignal.timeout(Math.max(1, Math.min(1000, deadline - Date.now()))), redirect: 'error' });
          await response.body?.cancel();
          assertRunning();
          if (response.status === 200) return { origin, child, assertRunning, close };
        } catch { assertRunning(); }
      }
      await new Promise(resolve => setTimeout(resolve, Math.min(50, Math.max(0, deadline - Date.now()))));
    }
    throw new Error('Owned capture server readiness timed out.');
  } catch (error) { await close(); throw error; }
}

export function captureDevice(browserVersion, userAgent) {
  return { platform: process.platform, architecture: process.arch, osType: type(), osRelease: release(), browserVersion, userAgent, deviceScaleFactor: 1, cpuThrottling: 'none', networkThrottling: 'none', requestProfile: 'sequential warm requests' };
}
