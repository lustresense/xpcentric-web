import { spawn } from "node:child_process";
import { loadEnv } from "./loadEnv.mjs";

const isWindows = process.platform === "win32";

loadEnv();

function startProcess(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });
  child.on("error", (err) => {
    console.error(`[${label}] failed:`, err.message);
  });
  return child;
}

const apiCandidates = isWindows
  ? [
      ["python", ["server/main.py"]],
      ["py", ["-3", "server/main.py"]],
    ]
  : [
      ["python3", ["server/main.py"]],
      ["python", ["server/main.py"]],
    ];

let apiProc = null;
for (const [cmd, args] of apiCandidates) {
  apiProc = startProcess(cmd, args, "api");
  if (apiProc.pid) {
    break;
  }
}

if (!apiProc?.pid) {
  console.error("[api] Unable to start local API. Install Python 3 first.");
}

const webProc = startProcess(
  isWindows ? "npm.cmd" : "npm",
  ["run", "dev:web"],
  "web"
);

const shutdown = () => {
  if (webProc && !webProc.killed) {
    webProc.kill("SIGTERM");
  }
  if (apiProc && !apiProc.killed) {
    apiProc.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (apiProc) {
  apiProc.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[api] exited with code ${code}`);
    }
  });
}

webProc.on("exit", (code) => {
  if (apiProc && !apiProc.killed) {
    apiProc.kill("SIGTERM");
  }
  process.exit(code ?? 0);
});
