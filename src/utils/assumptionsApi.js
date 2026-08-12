// Supabase calls for the assumptions_scalars / assumptions_brackets /
// assumptions_rmd_divisors tables -- the single source of truth for every
// legislative/financial constant used across the tax/FICA/retirement
// calculators (see src/utils/taxEngine.js and docs/univ154-migration.md).
// Centralized here the same way adminApi.js centralizes `admins` calls and
// WeekAccessContext.jsx centralizes `global_week_settings` calls.
import { supabase } from '../lib/supabaseClient';

// Fetch all three tables in parallel and shape them into one object the
// rest of the app consumes via AssumptionsContext:
//   {
//     scalars: { ss_rate, ss_wage_base, medicare_rate, ... },
//     federalOrdinaryBrackets: [{ lower, upper, rate }, ...],
//     federalLtcgBrackets: [{ lower, upper, rate }, ...],
//     nycBrackets: [{ lower, upper, rate }, ...],
//     stateBrackets: { AL: [{ lower, upper, rate }, ...], CA: [...], ... },
//     rmdDivisors: { 72: 27.4, 73: 26.5, ... },
//   }
export const fetchAssumptions = async () => {
  const [scalarsRes, bracketsRes, rmdRes] = await Promise.all([
    supabase.from('assumptions_scalars').select('key, value, label, category'),
    supabase
      .from('assumptions_brackets')
      .select('table_name, group_key, sort_order, lower, upper, rate')
      .order('sort_order', { ascending: true }),
    supabase.from('assumptions_rmd_divisors').select('age, divisor'),
  ]);

  if (scalarsRes.error) throw scalarsRes.error;
  if (bracketsRes.error) throw bracketsRes.error;
  if (rmdRes.error) throw rmdRes.error;

  const scalars = {};
  (scalarsRes.data ?? []).forEach((row) => {
    scalars[row.key] = Number(row.value);
  });

  const federalOrdinaryBrackets = [];
  const federalLtcgBrackets = [];
  const nycBrackets = [];
  const stateBrackets = {};

  (bracketsRes.data ?? []).forEach((row) => {
    const bracket = { lower: Number(row.lower), upper: Number(row.upper), rate: Number(row.rate) };
    if (row.table_name === 'federal_ordinary') {
      federalOrdinaryBrackets.push(bracket);
    } else if (row.table_name === 'federal_ltcg') {
      federalLtcgBrackets.push(bracket);
    } else if (row.table_name === 'nyc') {
      nycBrackets.push(bracket);
    } else if (row.table_name === 'state') {
      if (!stateBrackets[row.group_key]) stateBrackets[row.group_key] = [];
      stateBrackets[row.group_key].push(bracket);
    }
  });

  const rmdDivisors = {};
  (rmdRes.data ?? []).forEach((row) => {
    rmdDivisors[row.age] = Number(row.divisor);
  });

  return { scalars, federalOrdinaryBrackets, federalLtcgBrackets, nycBrackets, stateBrackets, rmdDivisors };
};

export const updateScalar = async (key, value, updatedBy) => {
  const { error } = await supabase
    .from('assumptions_scalars')
    .update({ value, updated_at: new Date().toISOString(), updated_by: updatedBy ?? null })
    .eq('key', key);
  if (error) throw error;
};

export const bulkUpdateScalars = async (updates, updatedBy) => {
  // updates: { key: value, ... }
  const rows = Object.entries(updates).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
  }));
  // Upsert on the key column only touches value/updated_at/updated_by for
  // existing rows; label/category are omitted from the payload so Postgres
  // keeps their current values instead of nulling them out.
  for (const row of rows) {
    // Sequential, not Promise.all: keeps error handling simple (first
    // failure surfaces immediately) and this only ever runs for a handful
    // of scalar rows from the admin panel, not a hot path.
    // eslint-disable-next-line no-await-in-loop
    await updateScalar(row.key, row.value, updatedBy);
  }
};

// Replaces an entire bracket set (e.g. "Federal Ordinary Brackets" or one
// state's brackets) atomically-ish: delete the existing rows for this
// (table_name, group_key) pair, then insert the new set with fresh
// sort_order values. rows: [{ lower, upper, rate }, ...] in display order.
export const replaceBracketSet = async (tableName, groupKey, rows, updatedBy) => {
  let deleteQuery = supabase.from('assumptions_brackets').delete().eq('table_name', tableName);
  deleteQuery = groupKey === null ? deleteQuery.is('group_key', null) : deleteQuery.eq('group_key', groupKey);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;

  if (rows.length === 0) return;

  const insertRows = rows.map((row, index) => ({
    table_name: tableName,
    group_key: groupKey,
    sort_order: index,
    lower: row.lower,
    upper: row.upper,
    rate: row.rate,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
  }));
  const { error: insertError } = await supabase.from('assumptions_brackets').insert(insertRows);
  if (insertError) throw insertError;
};

// Replaces the entire RMD divisor table (age -> divisor rows).
export const replaceRmdDivisors = async (rows, updatedBy) => {
  const { error: deleteError } = await supabase.from('assumptions_rmd_divisors').delete().gte('age', 0);
  if (deleteError) throw deleteError;

  if (rows.length === 0) return;

  const insertRows = rows.map((row) => ({
    age: row.age,
    divisor: row.divisor,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
  }));
  const { error: insertError } = await supabase.from('assumptions_rmd_divisors').insert(insertRows);
  if (insertError) throw insertError;
};
