-- Social Security wage base: 2025 figure ($176,100) was still seeded; the 2026
-- figure announced by SSA is $184,500. All other 2026 scalars were already current.
UPDATE assumptions_scalars SET value = 184500, updated_at = now() WHERE key = 'ss_wage_base';
