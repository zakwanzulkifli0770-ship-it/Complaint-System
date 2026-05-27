// server.js — production entry point
// Used by `npm start` / `node server.js` for platforms that expect a root-level start script.
// Delegates to the pre-built API server bundle (compiled by esbuild).
// Run `npm run build` (or `pnpm run build`) first.

import('./artifacts/api-server/dist/index.mjs').catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
