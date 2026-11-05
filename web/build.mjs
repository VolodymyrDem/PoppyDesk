// Builds ../assets/glisse.js: the site's glisse controls with Preact standing in for React,
// one small module the page loads with no build step of its own.
import { build } from "esbuild";

await build({
  entryPoints: ["islands.jsx"],
  outfile: "../assets/glisse.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: ["safari16", "chrome110", "firefox115"],
  jsx: "automatic",
  jsxImportSource: "preact",
  alias: {
    react: "preact/compat",
    "react-dom": "preact/compat",
    "react/jsx-runtime": "preact/jsx-runtime",
  },
  loader: { ".svg": "text" },
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "eof",
  logLevel: "info",
});
