import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cloudflareEnvPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "cloudflare-env.d.ts",
);

const patchAmbientReExports = (source) => {
  const patchedEmailModule = source.replace(
    /let _EmailMessage: \{[\s\S]*?\};\s*export \{ _EmailMessage as EmailMessage \};/,
    `export const EmailMessage: {
        prototype: EmailMessage;
        new (from: string, to: string, raw: ReadableStream | string): EmailMessage;
    };`,
  );

  return patchedEmailModule.replace(
    /function _connect\(([^)]*)\): Socket;\s*export \{ _connect as connect \};/,
    "export function connect($1): Socket;",
  );
};

const source = readFileSync(cloudflareEnvPath, "utf8");
const patchedSource = patchAmbientReExports(source);

if (patchedSource === source) {
  const hasPatchedEmailExport = source.includes(
    "export const EmailMessage: {",
  );
  const hasPatchedConnectExport = source.includes(
    "export function connect(address: string | SocketAddress",
  );

  if (hasPatchedEmailExport && hasPatchedConnectExport) {
    process.exit(0);
  }

  throw new Error(
    "Failed to patch cloudflare-env.d.ts: expected wrangler ambient re-exports were not found",
  );
}

writeFileSync(cloudflareEnvPath, patchedSource);
