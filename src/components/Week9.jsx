import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { calculateLTCGTax } from '../utils/taxEngine';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Helpers for input handling (Retirement-style: allow empty, decimals where needed)
const sanitizeAge = (v) => v.replace(/\D/g, '').slice(0, 3); // digits only, 22-100

// Only allow values in 22–100 or valid prefixes while typing (reject 0–21, 101+ in onChange)
const isAllowedAgeValue = (v) => {
  if (v === '') return true;
  const num = parseInt(v, 10);
  if (isNaN(num)) return false;
  if (num > 100) return false;
  if (v === '1' || v === '10') return true; // only valid prefix for 100
  if (v.length === 1 && v >= '2' && v <= '9') return true; // prefix for 22–99 (must be before num < 22)
  if (num < 22) return false; // reject 0, 10–21 (20, 21, 11–19, 10)
  if (num >= 22 && num <= 100) return true;
  if (v.length === 2 && v >= '22' && v <= '99') return true;
  return false;
};
const sanitizeCurrency = (v) => {
  const clean = v.replace(/[^0-9.]/g, '');
  const idx = clean.indexOf('.');
  if (idx === -1) return clean;
  return clean.slice(0, idx + 1) + clean.slice(idx + 1).replace(/\./g, '').slice(0, 2);
};
const sanitizePct = (v) => {
  const clean = v.replace(/[^0-9.]/g, '');
  const idx = clean.indexOf('.');
  if (idx === -1) return clean;
  return clean.slice(0, idx + 1) + clean.slice(idx + 1).replace(/\./g, '').slice(0, 2);
};

const Week9 = () => {
  const { assumptions } = useAssumptions();

  // Contributions (string state: allow empty, decimals for currency)
  const [contribStartAge, setContribStartAge] = useState('22');
  const [contribEndAge, setContribEndAge] = useState('65');
  const [monthlyContribution, setMonthlyContribution] = useState('100');

  // Withdrawals
  const [withdrawStartAge, setWithdrawStartAge] = useState('45');
  const [withdrawEndAge, setWithdrawEndAge] = useState('100');
  const [yearlyWithdrawalPct, setYearlyWithdrawalPct] = useState('4');

  // Age 22–100 validation: show red message and clamp on blur
  const [ageError, setAgeError] = useState('');
  const validateAge = (v, setter) => {
    if (v === '') return;
    if (v === '1' || v === '10') {
      setter('100');
      setAgeError('');
      return;
    }
    const num = parseInt(v, 10);
    if (num < minAge) {
      setter(String(minAge));
      setAgeError('Age must be less than or equal to 100.');
    } else if (num > maxAge) {
      setter(String(maxAge));
      setAgeError('Age must be less than or equal to 100.');
    } else {
      setAgeError('');
    }
  };

  // Portfolio allocation: Annual Return + Scenario 1/2/3 Weights (percent, string)
  const [equities, setEquities] = useState({ returnPct: '8', scenario1Weight: '90', scenario2Weight: '70', scenario3Weight: '60' });
  const [fixedIncome, setFixedIncome] = useState({ returnPct: '5', scenario1Weight: '0', scenario2Weight: '25', scenario3Weight: '20' });
  const [cash, setCash] = useState({ returnPct: '0.5', scenario1Weight: '10', scenario2Weight: '5', scenario3Weight: '10' });
  const [alternatives, setAlternatives] = useState({ returnPct: '6', scenario1Weight: '0', scenario2Weight: '0', scenario3Weight: '10' });

  const assets = [equities, fixedIncome, cash, alternatives];

  const pct = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return typeof n === 'number' && !isNaN(n) ? n : 0;
  };

  // Blended Annual Return per scenario: sum(Annual Return * Scenario Weight) / 100
  const blendedReturn1 = useMemo(() => {
    const sumProduct = assets.reduce((sum, row) => sum + pct(row.returnPct) * pct(row.scenario1Weight), 0);
    return sumProduct / 100;
  }, [equities, fixedIncome, cash, alternatives]);
  const blendedReturn2 = useMemo(() => {
    const sumProduct = assets.reduce((sum, row) => sum + pct(row.returnPct) * pct(row.scenario2Weight), 0);
    return sumProduct / 100;
  }, [equities, fixedIncome, cash, alternatives]);
  const blendedReturn3 = useMemo(() => {
    const sumProduct = assets.reduce((sum, row) => sum + pct(row.returnPct) * pct(row.scenario3Weight), 0);
    return sumProduct / 100;
  }, [equities, fixedIncome, cash, alternatives]);

  // Age range 22–102 (worksheet horizon)
  const minAge = 22;
  const maxAge = 102;

  const startAge = Math.max(minAge, Number(contribStartAge) || minAge);
  const endContribAge = Number(contribEndAge) || 65;
  const d15 = Number(withdrawStartAge) || 45;
  const firstWithdrawAge = Math.min(Math.max(d15, minAge), maxAge);
  const wEndAge = Math.min(Math.max(Number(withdrawEndAge) || maxAge, minAge), maxAge);
  const wPct = (Number(yearlyWithdrawalPct) || 0) / 100;
  const P = Number(monthlyContribution) || 0;
  const annualContributionAmount = P * 12;

  // --- Summary metric formulas ---
  // 1) Future Value Account Balance: max yearly ending balance up to withdrawal end age.
  // 2) Value of Account in Today's Dollars: FV / (1 + inflation)^n.
  // 3) Total Gross Withdrawals: sum of all yearly withdrawals in withdrawal window.
  // 4) Total Taxes: Total Gross Withdrawals × effective tax rate.
  // 5) Total Net Withdrawals (post-taxes): Total Gross Withdrawals − Total Taxes.
  //
  // Note: inflation now comes from the admin-editable Assumptions table
  // instead of being hardcoded here (was 0.035). Capital gains are taxed
  // via the real bracket-stacked federal LTCG table (taxEngine.js) instead
  // of a flat 15% -- see docs/financial-audit-2026-08-11.md finding #26.
  // Each year's realized gain is stacked from $0 (this projection has no
  // other-income context to stack on top of -- a retiree living off
  // portfolio withdrawals with no other ordinary income is the intended
  // scenario here).
  const inflationRate = assumptions.scalars.cpi_inflation;
  const currentAgeForPV = minAge;

  // Build full scenario projection (single source of truth for chart + summary)
  const buildScenarioProjection = (blendedReturnPct) => {
    const annualReturn = (typeof blendedReturnPct === 'number' && !isNaN(blendedReturnPct) ? blendedReturnPct : 0) / 100;

    const endingByAge = {};
    let prevEndingMarketValue = 0;
    let prevEndingCostBasis = 0;
    let maxEndingBalance = 0;
    let maxEndingBalanceAge = currentAgeForPV;
    let totalGrossWithdrawals = 0;
    let totalTaxes = 0;

    for (let age = minAge; age <= maxAge; age++) {
      if (age < startAge) {
        endingByAge[age] = 0;
        continue;
      }

      // Excel table logic: contribution stops when withdrawal start age begins.
      const annualContribution =
        age >= startAge && age < endContribAge
          ? annualContributionAmount
          : 0;

      const beginningMarketValue = prevEndingMarketValue;
      const beginningCostBasis = prevEndingCostBasis;

      const investmentGrowth = (beginningMarketValue + annualContribution) * annualReturn;
      const preWithdrawalValue = beginningMarketValue + annualContribution + investmentGrowth;
      const requestedWithdrawal =
        age >= firstWithdrawAge && age <= wEndAge
          ? preWithdrawalValue * wPct
          : 0;
      const actualWithdrawal = Math.min(requestedWithdrawal, preWithdrawalValue);

      const basisBeforeWithdrawal = beginningCostBasis + annualContribution;
      const gainRatio =
        preWithdrawalValue > 0
          ? Math.max((preWithdrawalValue - basisBeforeWithdrawal) / preWithdrawalValue, 0)
          : 0;
      const realizedCapitalGain = actualWithdrawal * gainRatio;
      const capitalGainsTax = calculateLTCGTax(realizedCapitalGain, 0, assumptions);

      const endingMarketValue = preWithdrawalValue - actualWithdrawal;
      const principalWithdrawn = actualWithdrawal - realizedCapitalGain;
      const endingCostBasis = Math.max(basisBeforeWithdrawal - principalWithdrawn, 0);

      endingByAge[age] = endingMarketValue;
      prevEndingMarketValue = endingMarketValue;
      prevEndingCostBasis = endingCostBasis;

      if (endingMarketValue > maxEndingBalance) {
        maxEndingBalance = endingMarketValue;
        maxEndingBalanceAge = age;
      }
      totalGrossWithdrawals += actualWithdrawal;
      totalTaxes += capitalGainsTax;
    }

    const netByAge = [];
    for (let age = minAge; age <= maxAge; age++) {
      netByAge.push(Math.round(endingByAge[age] ?? 0));
    }

    // Discount by the number of years until the peak balance actually
    // occurred, not a fixed full-span horizon (maxAge - currentAgeForPV,
    // which was always 80 regardless of when the peak happened -- default
    // inputs peak around age 45, so the old code over-discounted by
    // roughly a factor of 7). See docs/financial-audit-2026-08-11.md
    // finding #7.
    const nper = Math.max(0, maxEndingBalanceAge - currentAgeForPV);
    const valueTodayDollars = maxEndingBalance / Math.pow(1 + inflationRate, nper);
    const totalNetWithdrawals = totalGrossWithdrawals - totalTaxes;

    return {
      metrics: {
        futureValueAccountBalance: maxEndingBalance,
        valueInTodaysDollars: valueTodayDollars,
        totalGrossWithdrawals,
        totalTaxes,
        totalNetWithdrawals,
      },
      netByAge,
    };
  };

  // Scenario projections (single source for summary + chart)
  const scenario1Projection = useMemo(
    () => buildScenarioProjection(blendedReturn1),
    [blendedReturn1, startAge, endContribAge, firstWithdrawAge, wEndAge, wPct, P, assumptions]
  );
  const scenario2Projection = useMemo(
    () => buildScenarioProjection(blendedReturn2),
    [blendedReturn2, startAge, endContribAge, firstWithdrawAge, wEndAge, wPct, P, assumptions]
  );
  const scenario3Projection = useMemo(
    () => buildScenarioProjection(blendedReturn3),
    [blendedReturn3, startAge, endContribAge, firstWithdrawAge, wEndAge, wPct, P, assumptions]
  );

  const scenario1Metrics = scenario1Projection.metrics;
  const scenario2Metrics = scenario2Projection.metrics;
  const scenario3Metrics = scenario3Projection.metrics;

  // Chart: dynamic labels (age range)
  const chartLabels = useMemo(() => {
    const ages = [];
    for (let a = minAge; a <= maxAge; a++) ages.push(a);
    return ages;
  }, []);

  // Three scenario series for chart (updates when inputs or portfolio weights change)
  const chartSeries1 = scenario1Projection.netByAge;
  const chartSeries2 = scenario2Projection.netByAge;
  const chartSeries3 = scenario3Projection.netByAge;

  // Y-axis max: dynamic from all three series, rounded to nice step (e.g. 200K)
  const chartMaxY = useMemo(() => {
    const max = Math.max(
      0,
      ...chartSeries1,
      ...chartSeries2,
      ...chartSeries3
    );
    if (max <= 0) return 200000;
    const step = 200000;
    return Math.ceil(max / step) * step;
  }, [chartSeries1, chartSeries2, chartSeries3]);

  const chartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [
      {
        label: 'Scenario 1',
        data: chartSeries1,
        borderColor: '#d8dee9',
        backgroundColor: 'rgba(216,222,233,0.45)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Scenario 2',
        data: chartSeries2,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.3)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Scenario 3',
        data: chartSeries3,
        borderColor: '#1e293b',
        backgroundColor: 'rgba(30,41,59,0.3)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  }), [chartLabels, chartSeries1, chartSeries2, chartSeries3]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 8, right: 24, bottom: 8, left: 8 },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'end',
        labels: {
          boxWidth: 16,
          padding: 18,
          font: { size: 14 },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Brokerage Account Balance',
        font: { size: 16, weight: '600' },
        padding: { bottom: 16 },
      },
      tooltip: {
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          title: (ctx) => (ctx[0] ? `Age ${ctx[0].label}` : ''),
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency((ctx.raw ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Age', font: { size: 14 } },
        min: minAge,
        max: maxAge,
        grid: { display: false },
        ticks: {
          font: { size: 13 },
          stepSize: 1,
          callback: function(value) {
            const age = Number(this.getLabelForValue(value));
            if (age === minAge || age === maxAge) return age;
            if ((age - minAge) % 5 === 0) return age;
            return '';
          },
        },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Ending Account Balance', font: { size: 14 } },
        min: 0,
        max: chartMaxY,
        grid: { display: false },
        ticks: {
          font: { size: 13 },
          stepSize: chartMaxY / 5,
          callback: (v) =>
            v >= 1000000 ? `$${v / 1000000}M` : v >= 1000 ? `$${v / 1000}K` : `$${v}`,
        },
      },
    },
  }), [chartMaxY]);

  // Auto-save function (no alert)
  const autoSaveWeek9 = () => {
    try {
      const week9Data = {
        week: 9,
        contribStartAge,
        contribEndAge,
        monthlyContribution,
        withdrawStartAge,
        withdrawEndAge,
        yearlyWithdrawalPct,
        equities,
        fixedIncome,
        cash,
        alternatives,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('week9_data', JSON.stringify(week9Data));
    } catch (error) {
      console.error('Error auto-saving Week 9 data:', error);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    const savedData = localStorage.getItem('week9_data');
    if (savedData) {
      try {
        const d = JSON.parse(savedData);
        if (d.contribStartAge != null) setContribStartAge(String(d.contribStartAge));
        if (d.contribEndAge != null) setContribEndAge(String(d.contribEndAge));
        if (d.monthlyContribution != null) setMonthlyContribution(String(d.monthlyContribution));
        if (d.withdrawStartAge != null) setWithdrawStartAge(String(d.withdrawStartAge));
        if (d.withdrawEndAge != null) setWithdrawEndAge(String(d.withdrawEndAge));
        if (d.yearlyWithdrawalPct != null) setYearlyWithdrawalPct(String(d.yearlyWithdrawalPct));
        if (d.equities) setEquities({
          returnPct: String(d.equities.returnPct ?? '8'),
          scenario1Weight: String(d.equities.scenario1Weight ?? d.equities.allocationPct ?? '90'),
          scenario2Weight: String(d.equities.scenario2Weight ?? '70'),
          scenario3Weight: String(d.equities.scenario3Weight ?? '60'),
        });
        if (d.fixedIncome) setFixedIncome({
          returnPct: String(d.fixedIncome.returnPct ?? '5'),
          scenario1Weight: String(d.fixedIncome.scenario1Weight ?? d.fixedIncome.allocationPct ?? '0'),
          scenario2Weight: String(d.fixedIncome.scenario2Weight ?? '25'),
          scenario3Weight: String(d.fixedIncome.scenario3Weight ?? '20'),
        });
        if (d.cash) setCash({
          returnPct: String(d.cash.returnPct ?? '0.5'),
          scenario1Weight: String(d.cash.scenario1Weight ?? d.cash.allocationPct ?? '10'),
          scenario2Weight: String(d.cash.scenario2Weight ?? '5'),
          scenario3Weight: String(d.cash.scenario3Weight ?? '10'),
        });
        if (d.alternatives) setAlternatives({
          returnPct: String(d.alternatives.returnPct ?? '6'),
          scenario1Weight: String(d.alternatives.scenario1Weight ?? d.alternatives.allocationPct ?? '0'),
          scenario2Weight: String(d.alternatives.scenario2Weight ?? '0'),
          scenario3Weight: String(d.alternatives.scenario3Weight ?? '10'),
        });
      } catch (error) {
        console.error('Error loading Week 9 data:', error);
      }
    }
  }, []);

  // Auto-save with debounce (500ms)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      autoSaveWeek9();
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [
    contribStartAge,
    contribEndAge,
    monthlyContribution,
    withdrawStartAge,
    withdrawEndAge,
    yearlyWithdrawalPct,
    equities,
    fixedIncome,
    cash,
    alternatives,
  ]);

  // Styling matching Week 6 Retirement Planning
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(255, 253, 231, 0.27) 0%, rgb(255, 252, 240) 50%, rgb(255, 255, 255) 100%)',
      padding: '32px 24px 16px 24px',
      width: '100%',
      fontSize: '14px',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
    },
    sectionContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '40px',
      marginBottom: '32px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      maxWidth: '1200px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    enhancedHeader: {
      background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: 'white',
      padding: '28px 32px',
      borderRadius: '16px',
      fontWeight: '600',
      fontSize: '22px',
      textAlign: 'center',
      marginBottom: '32px',
      boxShadow: '0 8px 32px 0 rgba(13, 26, 75, 0.3), 0 4px 16px 0 rgba(13, 26, 75, 0.2)',
      letterSpacing: '-0.01em',
      lineHeight: '1.3',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    sectionDivider: {
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(229, 231, 235, 0.6), transparent)',
      margin: '0',
      borderRadius: '1px',
    },
    infoBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      backgroundColor: 'rgba(13, 26, 75, 0.05)',
      borderRadius: '8px',
      color: '#0d1a4b',
      fontSize: '13px',
      marginBottom: '30px',
      border: '1px solid rgba(13, 26, 75, 0.15)',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      marginTop: 18,
      marginBottom: 30,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
    },
    th: {
      background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: 'white',
      padding: '16px 18px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      fontSize: '15px',
    },
    td: {
      border: '1px solid rgba(229, 231, 235, 0.5)',
      padding: '16px 18px',
      verticalAlign: 'middle',
      textAlign: 'center',
      backgroundColor: 'white',
      transition: 'background-color 0.15s ease',
    },
    inputYellow: {
      width: '120px',
      border: '2px solid #d1d5db',
      padding: '10px 14px',
      textAlign: 'right',
      backgroundColor: '#fffde7',
      borderRadius: '8px',
      boxSizing: 'border-box',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    },
    readOnly: {
      textAlign: 'right',
      paddingRight: '12px',
      color: '#6b7280',
      backgroundColor: 'rgba(249, 250, 251, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: '8px',
      fontWeight: '600',
      border: '1px solid rgba(229, 231, 235, 0.6)',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    },
    subHeader: {
      fontSize: '17px',
      fontWeight: 600,
      color: 'rgba(13, 26, 75, 0.9)',
      margin: '28px 0 0 0',
      letterSpacing: '-0.02em',
    },
    titleUnderline: {
      height: '1px',
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      margin: '10px 0 20px 0',
      borderRadius: '1px',
      maxWidth: '510px',
      width: '100%',
    },
    subCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
      marginBottom: '24px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    minimalBlock: {
      padding: '0 2px',
    },
    rowLabel: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      width: '100%',
    },
    rowLabelText: {
      fontWeight: 500,
      color: 'rgba(13, 26, 75, 0.85)',
      fontSize: '14px',
      width: '260px',
      minWidth: '260px',
      flexShrink: 0,
    },
    rowLabelInputGap: '100px',
    chartWrapper: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(229, 231, 235, 0.8)',
      borderRadius: '14px',
      padding: '40px',
      marginBottom: '30px',
      minHeight: '560px',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    chartTitle: {
      fontSize: '16px',
      fontWeight: 700,
      marginBottom: '30px',
      textAlign: 'center',
      color: '#111827',
      letterSpacing: '-0.02em',
    },
  };

  // formatCurrency/formatPercent now come from src/utils/formatters.js (module import above).

  return (
    <>
      <style>{`
        .week9-no-spinner::-webkit-inner-spin-button,
        .week9-no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .week9-no-spinner {
          -moz-appearance: textfield;
        }
        .week9-markets-page input,
        .week9-lift-surface,
        .week9-info-surface,
        .week9-data-table tbody tr {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .week9-markets-page input {
          transform: scale(1);
          will-change: transform, box-shadow, border-color, background-color;
        }
        .week9-markets-page input:hover:not(:focus) {
          border-color: #9ca3af !important;
          background-color: #ffffff !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
          transform: translateY(-2px) scale(1.01) !important;
        }
        .week9-markets-page input:focus {
          border-color: #0d1a4b !important;
          background-color: #fffef0 !important;
          box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
          transform: translateY(-1px) scale(1.01) !important;
          outline: none;
        }
        .week9-lift-surface:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
          border-color: rgba(148, 163, 184, 0.45) !important;
        }
        .week9-info-surface:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 26, 75, 0.12);
          border-color: rgba(13, 26, 75, 0.25) !important;
          background-color: rgba(13, 26, 75, 0.08) !important;
        }
        .week9-data-table tbody tr:hover {
          transform: translateY(-1px);
        }
        .week9-data-table tbody tr:hover td {
          background-color: rgba(248, 250, 252, 0.95) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .week9-markets-page input,
          .week9-lift-surface,
          .week9-info-surface,
          .week9-data-table tbody tr {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '32px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(2px)',
        border: '1px solid rgba(13, 26, 75, 0.15)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        borderRadius: '14px',
        padding: '12px 20px',
        color: '#0d1a4b',
        fontWeight: 500,
        fontSize: 12,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d1a4b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
        You can only enter data in the open (yellow) fields.
      </div>

      <div style={styles.container}>
        <div style={styles.sectionContainer} className="week9-markets-page week9-lift-surface">
          <div style={styles.enhancedHeader}>
            <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Brokerage Account</span>
          </div>

          <div style={styles.infoBox} className="week9-info-surface">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d1a4b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>How it works:</strong> Enter contribution and withdrawal ages, monthly contribution, and portfolio allocation. The chart shows brokerage account value over time; summary shows ending balance and total withdrawals in future and today&apos;s dollars.
            </div>
          </div>

          {/* Sub-card: Contributions, Withdrawals & Portfolio Allocation */}
          <div style={styles.subCard} className="week9-lift-surface">
          {/* Top row: Contributions and Withdrawals side by side */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '100px', alignItems: 'flex-start', marginBottom: 30 }}>
              {/* Contributions column */}
              <div style={{ flex: '1 1 300px', minWidth: 260 }}>
                <div style={{ ...styles.subHeader, marginTop: '8px' }}>Contributions</div>
                <div style={styles.titleUnderline} />
                <div style={styles.minimalBlock}>
                  <div style={styles.rowLabel}>
                    <span style={styles.rowLabelText}>Start Age</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="22"
                      value={contribStartAge}
                      onChange={(e) => {
                        const v = sanitizeAge(e.target.value);
                        if (isAllowedAgeValue(v)) {
                          setContribStartAge(v);
                          setAgeError('');
                        } else {
                          setAgeError('Age must be less than or equal to 100.');
                        }
                      }}
                      onBlur={() => validateAge(contribStartAge, setContribStartAge)}
                      style={{ ...styles.inputYellow, marginLeft: styles.rowLabelInputGap }}
                    />
                  </div>
                  <div style={styles.rowLabel}>
                    <span style={styles.rowLabelText}>End Age</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="65"
                      value={contribEndAge}
                      onChange={(e) => {
                        const v = sanitizeAge(e.target.value);
                        if (isAllowedAgeValue(v)) {
                          setContribEndAge(v);
                          setAgeError('');
                        } else {
                          setAgeError('Age must be less than or equal to 100.');
                        }
                      }}
                      onBlur={() => validateAge(contribEndAge, setContribEndAge)}
                      style={{ ...styles.inputYellow, marginLeft: styles.rowLabelInputGap }}
                    />
                  </div>
                  <div style={styles.rowLabel}>
                    <span style={styles.rowLabelText}>Monthly Contribution</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="$0"
                      value={monthlyContribution === '' ? '' : `$${monthlyContribution}`}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[$,\s]/g, '');
                        const v = sanitizeCurrency(raw);
                        setMonthlyContribution(v);
                      }}
                      style={{ ...styles.inputYellow, marginLeft: styles.rowLabelInputGap }}
                    />
                  </div>
                </div>
                {ageError ? (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>{ageError}</div>
                ) : null}
              </div>

              {/* Withdrawals column */}
              <div style={{ flex: '1 1 280px', minWidth: 260 }}>
                <div style={{ ...styles.subHeader, marginTop: '8px' }}>Withdrawals</div>
                <div style={styles.titleUnderline} />
                <div style={styles.minimalBlock}>
                  <div style={styles.rowLabel}>
                    <span style={styles.rowLabelText}>Start Age</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="45"
                      value={withdrawStartAge}
                      onChange={(e) => {
                        const v = sanitizeAge(e.target.value);
                        if (isAllowedAgeValue(v)) {
                          setWithdrawStartAge(v);
                          setAgeError('');
                        } else {
                          setAgeError('Age must be less than or equal to 100.');
                        }
                      }}
                      onBlur={() => validateAge(withdrawStartAge, setWithdrawStartAge)}
                      style={{ ...styles.inputYellow, marginLeft: styles.rowLabelInputGap }}
                    />
                  </div>
                  <div style={styles.rowLabel}>
                    <span style={styles.rowLabelText}>End Age</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="100"
                      value={withdrawEndAge}
                      onChange={(e) => {
                        const v = sanitizeAge(e.target.value);
                        if (isAllowedAgeValue(v)) {
                          setWithdrawEndAge(v);
                          setAgeError('');
                        } else {
                          setAgeError('Age must be less than or equal to 100.');
                        }
                      }}
                      onBlur={() => validateAge(withdrawEndAge, setWithdrawEndAge)}
                      style={{ ...styles.inputYellow, marginLeft: styles.rowLabelInputGap }}
                    />
                  </div>
                  <div style={styles.rowLabel}>
                    <span style={styles.rowLabelText}>Yearly Withdrawal (% of Portfolio)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="%"
                      value={yearlyWithdrawalPct === '' ? '' : `${yearlyWithdrawalPct}%`}
                      onChange={(e) => {
                        const v = sanitizePct(e.target.value.replace(/%/g, ''));
                        setYearlyWithdrawalPct(v);
                      }}
                      style={{ ...styles.inputYellow, marginLeft: styles.rowLabelInputGap }}
                    />
                  </div>
                </div>
                {ageError ? (
                  <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '8px', fontWeight: '500' }}>{ageError}</div>
                ) : null}
              </div>
            </div>

            {/* Portfolio Allocation table - full width below Contributions & Withdrawals */}
            <div style={{ width: '100%' }}>
                <div style={{ ...styles.subHeader, marginTop: '8px' }}>Portfolio Allocation</div>
                <div style={styles.titleUnderline} />
                <table style={styles.table} className="week9-data-table">
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, textAlign: 'left' }}>Asset</th>
                      <th style={styles.th}>Annual Return</th>
                      <th style={styles.th}>Scenario 1 Weight</th>
                      <th style={styles.th}>Scenario 2 Weight</th>
                      <th style={styles.th}>Scenario 3 Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ ...styles.td, textAlign: 'left' }}>Equities</td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={equities.returnPct === '' ? '' : `${equities.returnPct}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setEquities((p) => ({ ...p, returnPct: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={equities.scenario1Weight === '' ? '' : `${equities.scenario1Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setEquities((p) => ({ ...p, scenario1Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={equities.scenario2Weight === '' ? '' : `${equities.scenario2Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setEquities((p) => ({ ...p, scenario2Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={equities.scenario3Weight === '' ? '' : `${equities.scenario3Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setEquities((p) => ({ ...p, scenario3Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, textAlign: 'left' }}>Fixed Income</td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={fixedIncome.returnPct === '' ? '' : `${fixedIncome.returnPct}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setFixedIncome((p) => ({ ...p, returnPct: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={fixedIncome.scenario1Weight === '' ? '' : `${fixedIncome.scenario1Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setFixedIncome((p) => ({ ...p, scenario1Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={fixedIncome.scenario2Weight === '' ? '' : `${fixedIncome.scenario2Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setFixedIncome((p) => ({ ...p, scenario2Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={fixedIncome.scenario3Weight === '' ? '' : `${fixedIncome.scenario3Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setFixedIncome((p) => ({ ...p, scenario3Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, textAlign: 'left' }}>Cash</td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={cash.returnPct === '' ? '' : `${cash.returnPct}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setCash((p) => ({ ...p, returnPct: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={cash.scenario1Weight === '' ? '' : `${cash.scenario1Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setCash((p) => ({ ...p, scenario1Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={cash.scenario2Weight === '' ? '' : `${cash.scenario2Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setCash((p) => ({ ...p, scenario2Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={cash.scenario3Weight === '' ? '' : `${cash.scenario3Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setCash((p) => ({ ...p, scenario3Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, textAlign: 'left' }}>Alternatives</td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={alternatives.returnPct === '' ? '' : `${alternatives.returnPct}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setAlternatives((p) => ({ ...p, returnPct: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={alternatives.scenario1Weight === '' ? '' : `${alternatives.scenario1Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setAlternatives((p) => ({ ...p, scenario1Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={alternatives.scenario2Weight === '' ? '' : `${alternatives.scenario2Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setAlternatives((p) => ({ ...p, scenario2Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="week9-no-spinner"
                          value={alternatives.scenario3Weight === '' ? '' : `${alternatives.scenario3Weight}%`}
                          onChange={(e) => { const v = sanitizePct(e.target.value.replace(/%/g, '')); setAlternatives((p) => ({ ...p, scenario3Weight: v })); }}
                          style={styles.inputYellow}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          padding: '16px 18px',
                          verticalAlign: 'middle',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#0d1a4b',
                          backgroundColor: 'white',
                          border: 'none',
                          borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                          borderLeft: '1px solid rgba(229, 231, 235, 0.5)',
                          borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                        }}
                      >
                        Blended Annual Return
                      </td>
                      <td
                        style={{
                          padding: '16px 18px',
                          verticalAlign: 'middle',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#0d1a4b',
                          backgroundColor: 'rgba(249, 250, 251, 0.8)',
                          border: '1px solid rgba(229, 231, 235, 0.5)',
                          borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                          borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                        }}
                      >
                        {formatPercent(blendedReturn1, { alreadyPercent: true })}
                      </td>
                      <td
                        style={{
                          padding: '16px 18px',
                          verticalAlign: 'middle',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#0d1a4b',
                          backgroundColor: 'rgba(249, 250, 251, 0.8)',
                          border: '1px solid rgba(229, 231, 235, 0.5)',
                          borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                          borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                        }}
                      >
                        {formatPercent(blendedReturn2, { alreadyPercent: true })}
                      </td>
                      <td
                        style={{
                          padding: '16px 18px',
                          verticalAlign: 'middle',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#0d1a4b',
                          backgroundColor: 'rgba(249, 250, 251, 0.8)',
                          border: 'none',
                          borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                          borderRight: '1px solid rgba(229, 231, 235, 0.5)',
                          borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                        }}
                      >
                        {formatPercent(blendedReturn3, { alreadyPercent: true })}
                      </td>
                    </tr>
                  </tbody>
                </table>
            </div>
          </div>

          {/* Sub-card: Brokerage Account Balance chart - overflow hidden so graph stays inside */}
          <div style={{ ...styles.subCard, padding: '36px', minHeight: '560px', overflow: 'hidden', boxSizing: 'border-box' }} className="week9-lift-surface">
            <div style={{ ...styles.chartWrapper, marginTop: 0, marginBottom: 0 }}>
              <div style={{ height: 420, width: '100%', maxWidth: '100%', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Sub-card: Account Summary */}
          <div style={styles.subCard} className="week9-lift-surface">
            <div style={{ ...styles.subHeader, marginTop: 0, marginBottom: 20, textAlign: 'center' }}>Account Summary</div>
            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
              <table style={{ ...styles.table, minWidth: 560, width: 'auto', margin: '0 auto' }} className="week9-data-table">
                <thead>
                  <tr>
                    <th style={{ ...styles.th, textAlign: 'left', width: 240, maxWidth: 240 }}>Metric</th>
                    <th style={{ ...styles.th, width: 150, maxWidth: 150 }}>Scenario 1</th>
                    <th style={{ ...styles.th, width: 150, maxWidth: 150 }}>Scenario 2</th>
                    <th style={{ ...styles.th, width: 150, maxWidth: 150 }}>Scenario 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 600, textAlign: 'left', color: '#0d1a4b', width: 240, maxWidth: 240 }}>Future Value Account Balance</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario1Metrics.futureValueAccountBalance))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario2Metrics.futureValueAccountBalance))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario3Metrics.futureValueAccountBalance))}</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 600, textAlign: 'left', color: '#0d1a4b', width: 240, maxWidth: 240 }}>Value of Account in Today&apos;s Dollars</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario1Metrics.valueInTodaysDollars))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario2Metrics.valueInTodaysDollars))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario3Metrics.valueInTodaysDollars))}</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 600, textAlign: 'left', color: '#0d1a4b', width: 240, maxWidth: 240 }}>Total Gross Withdrawals</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario1Metrics.totalGrossWithdrawals))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario2Metrics.totalGrossWithdrawals))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario3Metrics.totalGrossWithdrawals))}</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 600, textAlign: 'left', color: '#0d1a4b', width: 240, maxWidth: 240 }}>Total Taxes</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario1Metrics.totalTaxes))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario2Metrics.totalTaxes))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario3Metrics.totalTaxes))}</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 600, textAlign: 'left', color: '#0d1a4b', width: 240, maxWidth: 240 }}>Total Net Withdrawals (post-taxes)</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario1Metrics.totalNetWithdrawals))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario2Metrics.totalNetWithdrawals))}</td>
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: 'rgba(249, 250, 251, 0.8)', width: 150, maxWidth: 150 }}>{formatCurrency(Math.round(scenario3Metrics.totalNetWithdrawals))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Week9;
