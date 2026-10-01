// Removes declaration files that crash Next.js 16 (Turbopack) production
// builds. `@chroma-core/default-embed@0.1.9` ships
// `dist/cjs/default-embed.d.cts` containing ESM `import` syntax inside a
// CommonJS-scoped package. Turbopack's externals-tracing follows the package
// `exports.require.types` condition into that file and aborts the build with:
//   "Specified module format (CommonJs) is not matching the module format
//    of the source code (EcmaScript Modules)"
// These are types-only files, never needed at runtime (the app always passes
// embeddings explicitly), so deleting them is safe. Runs on every
// `npm install` via the `postinstall` hook.
const fs = require("fs");
const path = require("path");

const targets = [
  ["@chroma-core", "default-embed", "dist", "cjs", "default-embed.d.cts"],
];

let removed = 0;
for (const parts of targets) {
  const file = path.join(__dirname, "..", "node_modules", ...parts);
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      removed += 1;
      console.log(`[fixChromaPackaging] removed ${path.relative(process.cwd(), file)}`);
    }
  } catch (err) {
    console.warn(`[fixChromaPackaging] could not remove ${file}: ${err.message}`);
  }
}
if (removed === 0) {
  console.log("[fixChromaPackaging] nothing to remove (already clean).");
}
