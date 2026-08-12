-- Legislative/financial "Assumptions" config, replacing the ~8 independently
-- hand-transcribed copies of federal/state/FICA constants scattered across
-- taxCalculator.js, BudgetContext.jsx, Week1FederalTax.jsx, Week1StateTax.jsx,
-- Week4.jsx, Week6Retirement.jsx, Week9.jsx, and Week12.jsx (see
-- docs/financial-audit-2026-08-11.md). Values below were extracted directly
-- from the live master Excel workbook's "Assumptions" tab (openpyxl, not
-- re-typed) so the web app launches in sync with the source-of-truth
-- spreadsheet. See docs/univ154-migration.md for the full write-up.
--
-- Same RLS shape as global_week_settings: everyone can read (every
-- calculator, including anon/pre-login rendering, needs these values);
-- only is_admin() can write, via the roles table/helper functions created in
-- 20260811000001_create_admin_roles.sql.

CREATE TABLE IF NOT EXISTS assumptions_scalars (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL,   -- 'fica' | 'federal' | 'retirement' | 'modeling'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS assumptions_brackets (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,   -- 'federal_ordinary' | 'federal_ltcg' | 'state' | 'nyc'
    group_key TEXT,             -- state code for table_name='state'; NULL otherwise
    sort_order INT NOT NULL,
    lower NUMERIC NOT NULL,
    upper NUMERIC NOT NULL,     -- 1000000000000 represents "no upper bound", matching Excel/Week12.jsx's LARGE_NUMBER convention
    rate NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS assumptions_rmd_divisors (
    age INT PRIMARY KEY,
    divisor NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_assumptions_brackets_table_group
    ON assumptions_brackets (table_name, group_key, sort_order);

ALTER TABLE assumptions_scalars ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions_rmd_divisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view assumptions_scalars" ON assumptions_scalars
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage assumptions_scalars" ON assumptions_scalars
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Everyone can view assumptions_brackets" ON assumptions_brackets
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage assumptions_brackets" ON assumptions_brackets
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Everyone can view assumptions_rmd_divisors" ON assumptions_rmd_divisors
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage assumptions_rmd_divisors" ON assumptions_rmd_divisors
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

-- Seed: scalars (extracted from Assumptions!D3:D87)
INSERT INTO assumptions_scalars (key, value, label, category) VALUES
    ('ss_rate', 0.062, 'Social Security tax rate (employee)', 'fica'),
    ('ss_wage_base', 176100, 'Social Security wage base', 'fica'),
    ('medicare_rate', 0.0145, 'Medicare tax rate (employee)', 'fica'),
    ('addl_medicare_rate', 0.009, 'Additional Medicare tax rate', 'fica'),
    ('addl_medicare_threshold', 200000, 'Additional Medicare tax threshold (single)', 'fica'),
    ('std_deduction_single', 16100, 'Standard deduction (single filer)', 'federal'),
    ('limit_401k', 24500, '401(k) annual employee contribution limit', 'retirement'),
    ('limit_ira', 7500, 'IRA annual contribution limit', 'retirement'),
    ('rmd_start_age', 73, 'RMD required start age', 'retirement'),
    ('penalty_free_withdrawal_age', 59.5, 'Penalty-free withdrawal age', 'retirement'),
    ('cpi_inflation', 0.03, 'CPI / inflation assumption', 'modeling'),
    ('portfolio_return', 0.07, 'Portfolio annual nominal return assumption', 'modeling')
ON CONFLICT (key) DO NOTHING;

-- Seed: bracket tables (federal ordinary, federal LTCG, NYC, and all 50
-- states + DC), extracted from Assumptions!C13:E19, C24:E26, C255:F258,
-- C91:F251.
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('federal_ordinary', NULL, 0, 0, 12400, 0.1),
('federal_ordinary', NULL, 1, 12400, 50400, 0.12),
('federal_ordinary', NULL, 2, 50400, 105700, 0.22),
('federal_ordinary', NULL, 3, 105700, 201775, 0.24),
('federal_ordinary', NULL, 4, 201775, 256225, 0.32),
('federal_ordinary', NULL, 5, 256225, 640600, 0.35),
('federal_ordinary', NULL, 6, 640600, 1000000000000, 0.37),
('federal_ltcg', NULL, 0, 0, 49450, 0),
('federal_ltcg', NULL, 1, 49450, 545500, 0.15),
('federal_ltcg', NULL, 2, 545500, 1000000000000, 0.2),
('nyc', NULL, 0, 0, 12000, 0.03078),
('nyc', NULL, 1, 12000, 25000, 0.03762),
('nyc', NULL, 2, 25000, 50000, 0.03819),
('nyc', NULL, 3, 50000, 1000000000000, 0.03876),
('state', 'AL', 0, 0, 500, 0.02),
('state', 'AL', 1, 500, 3000, 0.04),
('state', 'AL', 2, 3000, 1000000000000, 0.05),
('state', 'AK', 0, 0, 1000000000000, 0),
('state', 'AZ', 0, 0, 1000000000000, 0.025),
('state', 'AR', 0, 0, 4500, 0.02),
('state', 'AR', 1, 4500, 1000000000000, 0.039),
('state', 'CA', 0, 0, 10756, 0.01),
('state', 'CA', 1, 10756, 25499, 0.02),
('state', 'CA', 2, 25499, 40245, 0.04),
('state', 'CA', 3, 40245, 55866, 0.06),
('state', 'CA', 4, 55866, 70606, 0.08),
('state', 'CA', 5, 70606, 360659, 0.093),
('state', 'CA', 6, 360659, 432787, 0.103),
('state', 'CA', 7, 432787, 721314, 0.113),
('state', 'CA', 8, 721314, 1000000, 0.123),
('state', 'CA', 9, 1000000, 1000000000000, 0.133),
('state', 'CO', 0, 0, 1000000000000, 0.044),
('state', 'CT', 0, 0, 10000, 0.02),
('state', 'CT', 1, 10000, 50000, 0.045),
('state', 'CT', 2, 50000, 100000, 0.055),
('state', 'CT', 3, 100000, 200000, 0.06),
('state', 'CT', 4, 200000, 250000, 0.065),
('state', 'CT', 5, 250000, 500000, 0.069),
('state', 'CT', 6, 500000, 1000000000000, 0.0699),
('state', 'DE', 0, 2000, 5000, 0.022),
('state', 'DE', 1, 5000, 10000, 0.039),
('state', 'DE', 2, 10000, 20000, 0.048),
('state', 'DE', 3, 20000, 25000, 0.052),
('state', 'DE', 4, 25000, 60000, 0.0555),
('state', 'DE', 5, 60000, 1000000000000, 0.066),
('state', 'FL', 0, 0, 1000000000000, 0),
('state', 'GA', 0, 0, 1000000000000, 0.0539),
('state', 'HI', 0, 0, 9600, 0.014),
('state', 'HI', 1, 9600, 14400, 0.032),
('state', 'HI', 2, 14400, 19200, 0.055),
('state', 'HI', 3, 19200, 24000, 0.064),
('state', 'HI', 4, 24000, 36000, 0.068),
('state', 'HI', 5, 36000, 48000, 0.072),
('state', 'HI', 6, 48000, 125000, 0.076),
('state', 'HI', 7, 125000, 175000, 0.079),
('state', 'HI', 8, 175000, 225000, 0.0825),
('state', 'HI', 9, 225000, 275000, 0.09),
('state', 'HI', 10, 275000, 325000, 0.1),
('state', 'HI', 11, 325000, 1000000000000, 0.11),
('state', 'ID', 0, 4673, 1000000000000, 0.05695),
('state', 'IL', 0, 0, 1000000000000, 0.0495),
('state', 'IN', 0, 0, 1000000000000, 0.03),
('state', 'IA', 0, 0, 1000000000000, 0.038),
('state', 'KS', 0, 0, 23000, 0.052),
('state', 'KS', 1, 23000, 1000000000000, 0.0558),
('state', 'KY', 0, 0, 1000000000000, 0.04),
('state', 'LA', 0, 0, 1000000000000, 0.03),
('state', 'ME', 0, 0, 26800, 0.058),
('state', 'ME', 1, 26800, 63450, 0.0675),
('state', 'ME', 2, 63450, 1000000000000, 0.0715),
('state', 'MD', 0, 0, 1000, 0.02),
('state', 'MD', 1, 1000, 2000, 0.03),
('state', 'MD', 2, 2000, 3000, 0.04),
('state', 'MD', 3, 3000, 100000, 0.0475),
('state', 'MD', 4, 100000, 125000, 0.05),
('state', 'MD', 5, 125000, 150000, 0.0525),
('state', 'MD', 6, 150000, 250000, 0.055),
('state', 'MD', 7, 250000, 1000000000000, 0.0575),
('state', 'MA', 0, 0, 1083150, 0.05),
('state', 'MA', 1, 1083150, 1000000000000, 0.09),
('state', 'MI', 0, 0, 1000000000000, 0.0425),
('state', 'MN', 0, 0, 32570, 0.0535),
('state', 'MN', 1, 32570, 106990, 0.068),
('state', 'MN', 2, 106990, 198630, 0.0785),
('state', 'MN', 3, 198630, 1000000000000, 0.0985),
('state', 'MS', 0, 10000, 1000000000000, 0.044),
('state', 'MO', 0, 1313, 2626, 0.02),
('state', 'MO', 1, 2626, 3939, 0.025),
('state', 'MO', 2, 3939, 5252, 0.03),
('state', 'MO', 3, 5252, 6565, 0.035),
('state', 'MO', 4, 6565, 7878, 0.04),
('state', 'MO', 5, 7878, 9191, 0.045),
('state', 'MO', 6, 9191, 1000000000000, 0.047),
('state', 'MT', 0, 0, 21100, 0.047),
('state', 'MT', 1, 21100, 1000000000000, 0.059),
('state', 'NE', 0, 0, 4030, 0.0246),
('state', 'NE', 1, 4030, 24120, 0.0351),
('state', 'NE', 2, 24120, 38870, 0.0501),
('state', 'NE', 3, 38870, 1000000000000, 0.052),
('state', 'NV', 0, 0, 1000000000000, 0),
('state', 'NH', 0, 0, 1000000000000, 0),
('state', 'NJ', 0, 0, 20000, 0.014),
('state', 'NJ', 1, 20000, 35000, 0.0175),
('state', 'NJ', 2, 35000, 40000, 0.035),
('state', 'NJ', 3, 40000, 75000, 0.05525),
('state', 'NJ', 4, 75000, 500000, 0.0637),
('state', 'NJ', 5, 500000, 1000000, 0.0897),
('state', 'NJ', 6, 1000000, 1000000000000, 0.1075),
('state', 'NM', 0, 0, 5500, 0.015),
('state', 'NM', 1, 5500, 16500, 0.032),
('state', 'NM', 2, 16500, 33500, 0.043),
('state', 'NM', 3, 33500, 66500, 0.047),
('state', 'NM', 4, 66500, 210000, 0.049),
('state', 'NM', 5, 210000, 1000000000000, 0.059),
('state', 'NY', 0, 0, 8500, 0.04),
('state', 'NY', 1, 8500, 11700, 0.045),
('state', 'NY', 2, 11700, 13900, 0.0525),
('state', 'NY', 3, 13900, 80650, 0.055),
('state', 'NY', 4, 80650, 215400, 0.06),
('state', 'NY', 5, 215400, 1077550, 0.0685),
('state', 'NY', 6, 1077550, 5000000, 0.0965),
('state', 'NY', 7, 5000000, 25000000, 0.103),
('state', 'NY', 8, 25000000, 1000000000000, 0.109),
('state', 'NC', 0, 0, 1000000000000, 0.0425),
('state', 'ND', 0, 48475, 244825, 0.0195),
('state', 'ND', 1, 244825, 1000000000000, 0.025),
('state', 'OH', 0, 26050, 100000, 0.0275),
('state', 'OH', 1, 100000, 1000000000000, 0.035),
('state', 'OK', 0, 0, 1000, 0.0025),
('state', 'OK', 1, 1000, 2500, 0.0075),
('state', 'OK', 2, 2500, 3750, 0.0175),
('state', 'OK', 3, 3750, 4900, 0.0275),
('state', 'OK', 4, 4900, 7200, 0.0375),
('state', 'OK', 5, 7200, 1000000000000, 0.0475),
('state', 'OR', 0, 0, 4400, 0.0475),
('state', 'OR', 1, 4400, 11050, 0.0675),
('state', 'OR', 2, 11050, 125000, 0.0875),
('state', 'OR', 3, 125000, 1000000000000, 0.099),
('state', 'PA', 0, 0, 1000000000000, 0.0307),
('state', 'RI', 0, 0, 79900, 0.0375),
('state', 'RI', 1, 79900, 181650, 0.0475),
('state', 'RI', 2, 181650, 1000000000000, 0.0599),
('state', 'SC', 0, 0, 3560, 0),
('state', 'SC', 1, 3560, 17830, 0.03),
('state', 'SC', 2, 17830, 1000000000000, 0.062),
('state', 'SD', 0, 0, 1000000000000, 0),
('state', 'TN', 0, 0, 1000000000000, 0),
('state', 'TX', 0, 0, 1000000000000, 0),
('state', 'UT', 0, 0, 1000000000000, 0.0455),
('state', 'VT', 0, 0, 47900, 0.0335),
('state', 'VT', 1, 47900, 116000, 0.066),
('state', 'VT', 2, 116000, 242000, 0.076),
('state', 'VT', 3, 242000, 1000000000000, 0.0875),
('state', 'VA', 0, 0, 3000, 0.02),
('state', 'VA', 1, 3000, 5000, 0.03),
('state', 'VA', 2, 5000, 17000, 0.05),
('state', 'VA', 3, 17000, 1000000000000, 0.0575),
('state', 'WA', 0, 0, 1000000000000, 0),
('state', 'WV', 0, 0, 10000, 0.0222),
('state', 'WV', 1, 10000, 25000, 0.0296),
('state', 'WV', 2, 25000, 40000, 0.0333),
('state', 'WV', 3, 40000, 60000, 0.0444),
('state', 'WV', 4, 60000, 1000000000000, 0.0482),
('state', 'WI', 0, 0, 14680, 0.035),
('state', 'WI', 1, 14680, 29370, 0.044),
('state', 'WI', 2, 29370, 323290, 0.053),
('state', 'WI', 3, 323290, 1000000000000, 0.0765),
('state', 'WY', 0, 0, 1000000000000, 0),
('state', 'DC', 0, 0, 10000, 0.04),
('state', 'DC', 1, 10000, 40000, 0.06),
('state', 'DC', 2, 40000, 60000, 0.065),
('state', 'DC', 3, 60000, 250000, 0.085),
('state', 'DC', 4, 250000, 500000, 0.0925),
('state', 'DC', 5, 500000, 1000000, 0.0975),
('state', 'DC', 6, 1000000, 1000000000000, 0.1075);

-- Seed: RMD divisor table (extracted from Assumptions!C35:D83), full 72-120
-- range -- fixes the prior 73-90-only hardcoded table (Week12.jsx's
-- RMD_DIVISOR_BY_AGE) silently returning $0 RMD past age 90.
INSERT INTO assumptions_rmd_divisors (age, divisor) VALUES
(72, 27.4), (73, 26.5), (74, 25.5), (75, 24.6), (76, 23.7), (77, 22.9),
(78, 22), (79, 21.1), (80, 20.2), (81, 19.4), (82, 18.5), (83, 17.7),
(84, 16.8), (85, 16), (86, 15.2), (87, 14.4), (88, 13.7), (89, 12.9),
(90, 12.2), (91, 11.5), (92, 10.8), (93, 10.1), (94, 9.5), (95, 8.9),
(96, 8.4), (97, 7.8), (98, 7.3), (99, 6.8), (100, 6.4), (101, 6),
(102, 5.6), (103, 5.2), (104, 4.9), (105, 4.6), (106, 4.3), (107, 4.1),
(108, 3.9), (109, 3.7), (110, 3.5), (111, 3.4), (112, 3.3), (113, 3.1),
(114, 3), (115, 2.9), (116, 2.8), (117, 2.7), (118, 2.5), (119, 2.3),
(120, 2);
