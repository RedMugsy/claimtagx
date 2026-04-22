import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const claimtagxDir = path.join(repoRoot, "artifacts", "claimtagx");
const claimtagxDistDir = path.join(claimtagxDir, "dist", "public");
const handlerDistDir = path.join(repoRoot, "artifacts", "handler-app", "dist", "public");
const handlerTargetDir = path.join(claimtagxDistDir, "handler");
const redirectsPath = path.join(claimtagxDistDir, "_redirects");

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error("npm_execpath is not set. This script must be run via pnpm scripts.");
  process.exit(1);
}

console.log("==> Building marketing site...");
run(process.execPath, [npmExecPath, "exec", "vite", "build", "--config", "artifacts/claimtagx/vite.config.ts"]);

console.log("==> Building handler app (BASE_PATH=/handler/)...");
run(process.execPath, [npmExecPath, "--filter", "@workspace/handler-app", "run", "build"], {
  env: {
    ...process.env,
    BASE_PATH: "/handler/",
  },
});

console.log("==> Copying handler output into marketing dist...");
mkdirSync(handlerTargetDir, { recursive: true });
cpSync(handlerDistDir, handlerTargetDir, { recursive: true });

console.log("==> Writing Cloudflare SPA rewrites...");
writeFileSync(
  redirectsPath,
  [
    "/handler /handler/ 301",
    "/handler/* /handler/index.html 200",
    "/* /index.html 200",
    "",
  ].join("\n"),
  "utf8",
);

console.log("==> Done. Output available at artifacts/claimtagx/dist/public");
