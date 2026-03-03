import { spawn, exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCb);

const PORTS = [5000, 5173];

async function pidsOnPortWindows(port) {
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

async function killPort(port) {
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
  } else {
    for (const pid of pids) {
      try {
        await exec(`kill -9 ${pid}`);
      } catch {}
    }
  }

  return true;
}

function npmCmd() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function run(label, args) {
  const child = spawn(npmCmd(), args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`\n❌ ${label} exited with code ${code}\n`);
      process.exit(code);
    }
  });

  return child;
}

async function main() {
  // Prevent "EADDRINUSE" by freeing common dev ports.
  for (const port of PORTS) {
    const killed = await killPort(port);
    if (killed) {
      console.log(`⚠️  Freed port ${port} (stopped previous process).`);
    }
  }

  console.log("🚀 Starting server + client...");
  const server = run("server", ["run", "server"]);
  const client = run("client", ["run", "client"]);

  const shutdown = () => {
    try {
      server.kill("SIGTERM");
    } catch {}
    try {
      client.kill("SIGTERM");
    } catch {}
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("dev launcher error:", err);
  process.exit(1);
});

