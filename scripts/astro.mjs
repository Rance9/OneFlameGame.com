// Runs the Astro command line with its anonymous usage reporting switched off,
// so no usage data is sent and no settings are written outside this project.
process.env.ASTRO_TELEMETRY_DISABLED = '1';
await import('../node_modules/astro/bin/astro.mjs');
