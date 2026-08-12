import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  fetchAssumptions,
  updateScalar,
  bulkUpdateScalars,
  replaceBracketSet,
  replaceRmdDivisors,
} from '../utils/assumptionsApi';
import { ASSUMPTIONS_DEFAULTS } from '../config/assumptionsDefaults';

// Single source of truth for every legislative/financial constant used by
// the tax/FICA/retirement calculators (src/utils/taxEngine.js). Mirrors
// WeekAccessContext.jsx's pattern: fetch on mount, expose the data plus
// admin-gated mutators, fall back to a bundled default snapshot if the
// fetch hasn't resolved yet or fails outright so the app never fully
// breaks if Supabase is unreachable -- see
// src/config/assumptionsDefaults.js.
const AssumptionsContext = createContext();

export const useAssumptions = () => {
  return useContext(AssumptionsContext);
};

export const AssumptionsProvider = ({ children, isAdmin, userEmail }) => {
  const [assumptions, setAssumptions] = useState(ASSUMPTIONS_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAssumptions();
      setAssumptions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assumptions, falling back to bundled defaults:', err);
      setAssumptions(ASSUMPTIONS_DEFAULTS);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const guardAdmin = () => {
    if (!isAdmin) {
      throw new Error('Only admins can update assumptions');
    }
  };

  const handleUpdateScalar = async (key, value) => {
    guardAdmin();
    await updateScalar(key, value, userEmail);
    setAssumptions((prev) => ({
      ...prev,
      scalars: { ...prev.scalars, [key]: value },
    }));
  };

  const handleBulkUpdateScalars = async (updates) => {
    guardAdmin();
    await bulkUpdateScalars(updates, userEmail);
    setAssumptions((prev) => ({
      ...prev,
      scalars: { ...prev.scalars, ...updates },
    }));
  };

  // tableName: 'federal_ordinary' | 'federal_ltcg' | 'nyc' | 'state'
  // groupKey: state code for 'state', null otherwise
  const handleReplaceBracketSet = async (tableName, groupKey, rows) => {
    guardAdmin();
    await replaceBracketSet(tableName, groupKey, rows, userEmail);
    setAssumptions((prev) => {
      const next = { ...prev };
      if (tableName === 'federal_ordinary') next.federalOrdinaryBrackets = rows;
      else if (tableName === 'federal_ltcg') next.federalLtcgBrackets = rows;
      else if (tableName === 'nyc') next.nycBrackets = rows;
      else if (tableName === 'state') {
        next.stateBrackets = { ...prev.stateBrackets, [groupKey]: rows };
      }
      return next;
    });
  };

  const handleReplaceRmdDivisors = async (rows) => {
    guardAdmin();
    await replaceRmdDivisors(rows, userEmail);
    const rmdDivisors = {};
    rows.forEach((row) => {
      rmdDivisors[row.age] = row.divisor;
    });
    setAssumptions((prev) => ({ ...prev, rmdDivisors }));
  };

  const value = {
    assumptions,
    isLoading,
    error,
    isAdmin,
    refresh,
    updateScalar: handleUpdateScalar,
    bulkUpdateScalars: handleBulkUpdateScalars,
    replaceBracketSet: handleReplaceBracketSet,
    replaceRmdDivisors: handleReplaceRmdDivisors,
  };

  return <AssumptionsContext.Provider value={value}>{children}</AssumptionsContext.Provider>;
};
