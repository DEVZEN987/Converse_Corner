import { spawn, exec as execCb } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execCb);

const PORT = Number(process.env.PORT || 5000);

async function pidsOnPortWindows(port) {
  // netstat output example:
  // TCP    0.0.0.0:5000   0.0.0.0:0   LISTENING   12345
  const { stdout } = await exec(`netstat -ano | findstr :${port}`);
  const pids = new Set();
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) pids.add(pid);
  }
  return [...pids];
}

async function pidsOnPortUnix(port) {
  // Try lsof first, then fuser.
  try {
    const { stdout } = await exec(`lsof -ti tcp:${port}`);
    return stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {}

  try {
    const { stdout } = await exec(`fuser ${port}/tcp`);
    return stdout
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));
  } catch {}

  return [];
}

async function killPortProcess(port) {
  const isWin = process.platform === "win32";

  let pids = [];
  try {
    pids = isWin ? await pidsOnPortWindows(port) : await pidsOnPortUnix(port);
  } catch {
    pids = [];
  }

  if (pids.length === 0) return false;

  if (isWin) {
    for (const pid of pids) {
      try {
        await exec(`taskkill /PID ${pid} /F`);
      } catch {}
    }
    return true;
  }

  for (const pid of pids) {
    try {
      await exec(`kill -9 ${pid}`);
    } catch {}
  }
  return true;
}

async function main() {
  // On Windows it's possible to bind IPv4+IPv6 separately; netstat-based PID lookup is the most reliable.
  const hadToKill = await killPortProcess(PORT);
  if (hadToKill) {
    console.log(`⚠️  Port ${PORT} was in use. Stopped the old process.`);
  }

  console.log(`🚀 Starting server (watch) on port ${PORT}...`);
  const child = spawn(process.execPath, ["--watch", "index.js"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("dev launcher error:", err);
  process.exit(1);
});

