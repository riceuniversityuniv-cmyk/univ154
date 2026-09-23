-- 2026 state income tax rate/bracket update (single filer).
-- Source: Tax Foundation "State Individual Income Tax Rates and Brackets, 2026",
-- with GA (4.99%, HB 463), SC (1.99%/5.21% over $30,000, SCDOR) and UT (4.45%, SB 60)
-- taken from newer primary sources. NJ (5.525%), WA (no wage tax) unchanged.
-- Keep in sync with src/config/assumptionsDefaults.js.

BEGIN;

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'AR';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'AR', 0, 0, 4600, 0.02),
('state', 'AR', 1, 4600, 1000000000000, 0.039);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'CA';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'CA', 0, 0, 11079, 0.01),
('state', 'CA', 1, 11079, 26264, 0.02),
('state', 'CA', 2, 26264, 41452, 0.04),
('state', 'CA', 3, 41452, 57542, 0.06),
('state', 'CA', 4, 57542, 72724, 0.08),
('state', 'CA', 5, 72724, 371479, 0.093),
('state', 'CA', 6, 371479, 445771, 0.103),
('state', 'CA', 7, 445771, 742953, 0.113),
('state', 'CA', 8, 742953, 1000000, 0.123),
('state', 'CA', 9, 1000000, 1000000000000, 0.133);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'GA';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'GA', 0, 0, 1000000000000, 0.0499);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'ID';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'ID', 0, 4811, 1000000000000, 0.053);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'IN';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'IN', 0, 0, 1000000000000, 0.0295);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'KY';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'KY', 0, 0, 1000000000000, 0.035);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'ME';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'ME', 0, 0, 27399, 0.058),
('state', 'ME', 1, 27399, 64849, 0.0675),
('state', 'ME', 2, 64849, 1000000000000, 0.0715);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'MD';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'MD', 0, 0, 1000, 0.02),
('state', 'MD', 1, 1000, 2000, 0.03),
('state', 'MD', 2, 2000, 3000, 0.04),
('state', 'MD', 3, 3000, 100000, 0.0475),
('state', 'MD', 4, 100000, 125000, 0.05),
('state', 'MD', 5, 125000, 150000, 0.0525),
('state', 'MD', 6, 150000, 250000, 0.055),
('state', 'MD', 7, 250000, 500000, 0.0575),
('state', 'MD', 8, 500000, 1000000, 0.0625),
('state', 'MD', 9, 1000000, 1000000000000, 0.065);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'MN';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'MN', 0, 0, 33310, 0.0535),
('state', 'MN', 1, 33310, 109430, 0.068),
('state', 'MN', 2, 109430, 203150, 0.0785),
('state', 'MN', 3, 203150, 1000000000000, 0.0985);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'MS';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'MS', 0, 10000, 1000000000000, 0.04);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'MO';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'MO', 0, 1348, 2696, 0.02),
('state', 'MO', 1, 2696, 4044, 0.025),
('state', 'MO', 2, 4044, 5392, 0.03),
('state', 'MO', 3, 5392, 6740, 0.035),
('state', 'MO', 4, 6740, 8088, 0.04),
('state', 'MO', 5, 8088, 9436, 0.045),
('state', 'MO', 6, 9436, 1000000000000, 0.047);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'MT';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'MT', 0, 0, 47500, 0.047),
('state', 'MT', 1, 47500, 1000000000000, 0.0565);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'NE';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'NE', 0, 0, 4130, 0.0246),
('state', 'NE', 1, 4130, 24760, 0.0351),
('state', 'NE', 2, 24760, 1000000000000, 0.0455);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'NY';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'NY', 0, 0, 8500, 0.039),
('state', 'NY', 1, 8500, 11700, 0.044),
('state', 'NY', 2, 11700, 13900, 0.0515),
('state', 'NY', 3, 13900, 80650, 0.054),
('state', 'NY', 4, 80650, 215400, 0.059),
('state', 'NY', 5, 215400, 1077550, 0.0685),
('state', 'NY', 6, 1077550, 5000000, 0.0965),
('state', 'NY', 7, 5000000, 25000000, 0.103),
('state', 'NY', 8, 25000000, 1000000000000, 0.109);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'NC';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'NC', 0, 0, 1000000000000, 0.0399);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'OH';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'OH', 0, 26050, 1000000000000, 0.0275);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'OK';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'OK', 0, 3750, 4900, 0.025),
('state', 'OK', 1, 4900, 7200, 0.035),
('state', 'OK', 2, 7200, 1000000000000, 0.045);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'OR';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'OR', 0, 0, 4550, 0.0475),
('state', 'OR', 1, 4550, 11400, 0.0675),
('state', 'OR', 2, 11400, 125000, 0.0875),
('state', 'OR', 3, 125000, 1000000000000, 0.099);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'RI';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'RI', 0, 0, 82050, 0.0375),
('state', 'RI', 1, 82050, 186450, 0.0475),
('state', 'RI', 2, 186450, 1000000000000, 0.0599);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'SC';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'SC', 0, 0, 30000, 0.0199),
('state', 'SC', 1, 30000, 1000000000000, 0.0521);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'UT';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'UT', 0, 0, 1000000000000, 0.0445);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'VT';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'VT', 0, 0, 49400, 0.0335),
('state', 'VT', 1, 49400, 119700, 0.066),
('state', 'VT', 2, 119700, 249700, 0.076),
('state', 'VT', 3, 249700, 1000000000000, 0.0875);

DELETE FROM assumptions_brackets WHERE table_name = 'state' AND group_key = 'WI';
INSERT INTO assumptions_brackets (table_name, group_key, sort_order, lower, upper, rate) VALUES
('state', 'WI', 0, 0, 15110, 0.035),
('state', 'WI', 1, 15110, 51950, 0.044),
('state', 'WI', 2, 51950, 332720, 0.053),
('state', 'WI', 3, 332720, 1000000000000, 0.0765);

COMMIT;
