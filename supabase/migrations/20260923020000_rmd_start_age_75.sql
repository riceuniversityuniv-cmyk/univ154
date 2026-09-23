-- RMD start age: 73 -> 75. SECURE 2.0 sets the required beginning age at 75 for
-- anyone born in 1960 or later, which covers every student using this tool.
-- Keep in sync with src/config/assumptionsDefaults.js.
UPDATE assumptions_scalars SET value = 75, updated_at = now() WHERE key = 'rmd_start_age';
