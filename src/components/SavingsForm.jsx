import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

// Number counting animation hook
const useCountUp = (end, duration = 1000, decimals = 0) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (end === 0 || end === null || end === undefined) {
      setCount(0);
      return;
    }

    setIsAnimating(true);
    setCount(0);
    startTimeRef.current = null;

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = end * easeOut;
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration]);

  return { count, isAnimating };
};

// Success checkmark component
const SuccessCheckmark = ({ show, size = 20 }) => {
  if (!show) return null;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '8px',
      animation: 'checkmarkPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#10b981" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
};

// Loading skeleton component
const SkeletonLoader = ({ width = '100%', height = '20px', borderRadius = '8px' }) => {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonLoading 1.5s ease-in-out infinite',
    }}></div>
  );
};


// Savings-specific configuration with individual sections
const savingsConfig = {
  title: "Savings Plan",
  sections: [
    {
      id: 'down_payment_1',
      title: 'Down Payment',
      sectionName: 'down_payment_1_name',
      goalAmount: 'down_payment_1',
      monthlySavings: 'down_payment_1_monthly',
      timeToGoal: 'down_payment_1_time',
      annualRate: 'down_payment_1_rate',
      calculationMode: 'time' // Calculate time from goal + monthly savings
    },
    {
      id: 'down_payment_2', 
      title: 'Down Payment',
      sectionName: 'down_payment_2_name',
      goalAmount: 'down_payment_2',
      monthlySavings: 'down_payment_2_monthly',
      timeToGoal: 'down_payment_2_time',
      annualRate: 'down_payment_2_rate',
      calculationMode: 'monthly' // Calculate monthly savings from goal + time
    },
    {
      id: 'car_1',
      title: 'Car',
      sectionName: 'car_1_name',
      goalAmount: 'car_1',
      monthlySavings: 'car_1_monthly',
      timeToGoal: 'car_1_time',
      annualRate: 'car_1_rate',
      calculationMode: 'time'
    },
    {
      id: 'car_2',
      title: 'Car', 
      sectionName: 'car_2_name',
      goalAmount: 'car_2',
      monthlySavings: 'car_2_monthly',
      timeToGoal: 'car_2_time',
      annualRate: 'car_2_rate',
      calculationMode: 'monthly'
    },
    {
      id: 'wedding_1',
      title: 'Wedding',
      sectionName: 'wedding_1_name',
      goalAmount: 'wedding_1',
      monthlySavings: 'wedding_1_monthly',
      timeToGoal: 'wedding_1_time',
      annualRate: 'wedding_1_rate',
      calculationMode: 'time'
    },
    {
      id: 'wedding_2',
      title: 'Wedding',
      sectionName: 'wedding_2_name',
      goalAmount: 'wedding_2', 
      monthlySavings: 'wedding_2_monthly',
      timeToGoal: 'wedding_2_time',
      annualRate: 'wedding_2_rate',
      calculationMode: 'monthly'
    },
    {
      id: 'advanced_degree_1',
      title: 'Advanced Degree',
      sectionName: 'advanced_degree_1_name',
      goalAmount: 'advanced_degree_1',
      monthlySavings: 'advanced_degree_1_monthly',
      timeToGoal: 'advanced_degree_1_time',
      annualRate: 'advanced_degree_1_rate',
      calculationMode: 'time'
    },
    {
      id: 'advanced_degree_2',
      title: 'Advanced Degree',
      sectionName: 'advanced_degree_2_name',
      goalAmount: 'advanced_degree_2',
      monthlySavings: 'advanced_degree_2_monthly', 
      timeToGoal: 'advanced_degree_2_time',
      annualRate: 'advanced_degree_2_rate',
      calculationMode: 'monthly'
    },
    {
      id: 'vacation_1',
      title: 'Vacation',
      sectionName: 'vacation_1_name',
      goalAmount: 'vacation_1',
      monthlySavings: 'vacation_1_monthly',
      timeToGoal: 'vacation_1_time',
      annualRate: 'vacation_1_rate',
      calculationMode: 'time'
    },
    {
      id: 'vacation_2',
      title: 'Vacation',
      sectionName: 'vacation_2_name',
      goalAmount: 'vacation_2',
      monthlySavings: 'vacation_2_monthly',
      timeToGoal: 'vacation_2_time',
      annualRate: 'vacation_2_rate',
      calculationMode: 'monthly'
    },
    {
      id: 'miscellaneous_1',
      title: 'Miscellaneous',
      sectionName: 'miscellaneous_1_name',
      goalAmount: 'miscellaneous_1',
      monthlySavings: 'miscellaneous_1_monthly',
      timeToGoal: 'miscellaneous_1_time',
      annualRate: 'miscellaneous_1_rate',
      calculationMode: 'time'
    },
    {
      id: 'miscellaneous_2',
      title: 'Miscellaneous',
      sectionName: 'miscellaneous_2_name',
      goalAmount: 'miscellaneous_2',
      monthlySavings: 'miscellaneous_2_monthly',
      timeToGoal: 'miscellaneous_2_time',
      annualRate: 'miscellaneous_2_rate',
      calculationMode: 'monthly'
    }
  ]
};

const styles = {
  // Main container - Modern Shadcn/ui + Glassmorphism hybrid (matching Week 1)
  container: { 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(255, 253, 231, 0.27) 0%, rgb(255, 252, 240) 50%, rgb(255, 255, 255) 100%)', // Light yellow to white gradient
    padding: '32px 24px',
    width: '100%',
    fontSize: '14px',
    color: '#111827',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    position: 'relative',
  },
  sectionDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(229, 231, 235, 0.6), transparent)',
    margin: '0',
    borderRadius: '1px',
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
  
  // Header styling - matching Week 1
  header: { 
    fontSize: '18px', 
    fontWeight: '600',
    margin: '24px 0 16px 0', 
    color: '#111827',
    letterSpacing: '-0.01em',
    lineHeight: '1.4',
  },
  
  // Monthly After-Tax Income display - matching Week 1 green styling
  afterTaxRow: { 
    background: 'rgba(240, 253, 244, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '16px 20px', 
    border: '2px solid rgba(134, 239, 172, 0.5)',
    width: '100%', 
    maxWidth: '600px',
    marginTop: '20px',
    marginBottom: '50px',
    borderRadius: '12px',
    fontWeight: '600',
    color: '#166534',
    boxShadow: '0 4px 16px 0 rgba(22, 101, 52, 0.15)',
    fontSize: '15px',
  },

  // Input fields - Professional business styling
  input: { 
    width: '100%', 
    border: '1px solid #e5e7eb', 
    padding: '12px 16px', 
    textAlign: 'right', 
    backgroundColor: '#fffde7', // Matching Week 1 - sarımsı beyaz
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#111827',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    transform: 'scale(1)',
  },
  inputHover: {
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    transform: 'translateY(-2px) scale(1.01)',
  },
  inputFocus: {
    borderColor: '#0d1a4b',
    boxShadow: '0 0 0 3px rgba(13, 26, 75, 0.15), 0 0 0 1px rgba(13, 26, 75, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.08), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    backgroundColor: '#fffef0', // Matching Week 1 - biraz daha açık sarımsı beyaz
  },
  
  // Read-only fields - Professional styling
  readOnly: { 
    textAlign: 'right', 
    padding: '12px 16px',
    color: '#374151',
    fontWeight: '600',
    fontSize: '14px',
    lineHeight: '1.5',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(229, 231, 235, 0.6)',
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '48px', // Match input field height (12px top + 24px line-height + 12px bottom = 48px)
  },
  
  // Input container - matching Week 1
  inputCellContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  // Months field: input + "months" yan yana; baseline + hafif aşağı düzeltme ile görsel hiza
  monthsFieldWrap: {
    display: 'flex',
    alignItems: 'baseline',
    minHeight: '48px',
    padding: '0 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fffde7',
    boxSizing: 'border-box',
  },
  monthsInputInline: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    padding: '14px 8px 14px 0',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.25',
    textAlign: 'right',
    outline: 'none',
  },
  monthsSuffix: {
    marginLeft: '8px',
    marginTop: '3px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#111827',
    flexShrink: 0,
    lineHeight: 1,
  },
  
  // Currency symbol - matching Week 1
  currencySymbol: {
    marginLeft: '8px',
    color: '#6b7280',
  },
  
  // Section headers - matching Week 1 blue styling
  sectionHeader: { 
    fontWeight: '700',
    background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#111827',
    fontSize: '15px',
    letterSpacing: '-0.015em',
    lineHeight: '1.5',
    padding: '18px 24px',
    borderBottom: '1px solid rgba(229, 231, 235, 0.3)',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  },
  
  // Summary section - matching Week 1 styling
  summaryContainer: {
    width: '100%',
    maxWidth: '1200px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '24px',
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
  },
  
  // Summary cards - matching Week 1 color scheme
  summaryCard: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.05)',
  },
  
  // Summary values - matching Week 1 styling
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#111827',
  },
  
  // Summary labels - matching Week 1 styling
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  
  // Info box - matching Week 1
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    backgroundColor: 'rgba(13, 26, 75, 0.05)', // Darker blue background
    borderRadius: '8px',
    color: '#0d1a4b', // Darker blue text
    fontSize: '13px',
    marginBottom: '24px',
    border: '1px solid rgba(13, 26, 75, 0.15)', // Darker blue border
  },
  
  // Small percentage info - Professional styling
  percentageInfo: {
    fontSize: '11px',
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: '8px',
    textAlign: 'right',
    fontWeight: '400',
    letterSpacing: '0.01em',
    lineHeight: '1.5',
  },
  
  // Label styling - Improved typography
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#111827',
    letterSpacing: '-0.01em',
    lineHeight: '1.5',
  },
  
  // Card hover effect style
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(229, 231, 235, 0.8)',
  },
  
  // Input focus glow
  inputFocusGlow: {
    boxShadow: '0 0 0 3px rgba(13, 26, 75, 0.15), 0 0 0 1px rgba(13, 26, 75, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.08), inset 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
  },
  
  // Section name input - Different color to distinguish from number inputs
  sectionNameInput: {
    width: '100%', 
    border: '1px solid rgba(13, 26, 75, 0.2)', // Blue border matching site theme
    padding: '12px 16px', 
    textAlign: 'left', 
    background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(30, 58, 138, 0.15) 50%, rgba(13, 26, 75, 0.2) 100%)', // Gradient from light blue to dark blue
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontWeight: '600',
    fontSize: '15px',
    lineHeight: '1.5',
    color: '#0d1a4b', // Dark blue text color
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxShadow: '0 1px 2px 0 rgba(13, 26, 75, 0.1), inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)',
  },
};

const InfoIcon = () => (
    <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#0d1a4b" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
    >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export default function SavingsForm() {
    const budgetContext = useBudget();
    const { assumptions } = useAssumptions();
    
    // Add debugging
    console.log('SavingsForm: budgetContext', budgetContext);
    
    // Add fallback in case context is not available
    if (!budgetContext) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading...</h2>
                <p>Please wait while the savings form loads.</p>
            </div>
        );
    }

    const { 
        topInputs, 
        setTopInputs, 
        financialCalculations,
        summaryCalculations,
        savingsInputs,
        setSavingsInputs,
        savingsCalculations,
        saveBudgetData,
        loadBudgetData
    } = budgetContext;
    
    // Debug: Check summaryCalculations immediately after extraction
    console.log('=== IMMEDIATE CHECK AFTER EXTRACTION ===');
    console.log('summaryCalculations:', summaryCalculations);
    console.log('summaryCalculations?.userAfterTaxIncome:', summaryCalculations?.userAfterTaxIncome);
    console.log('typeof summaryCalculations:', typeof summaryCalculations);
    console.log('=== END IMMEDIATE CHECK ===');

    // Handler functions for save/load
    // Auto-save function (without alert)
    const autoSaveSavings = () => {
        try {
            const savingsData = {
                // IMPORTANT: Do NOT save topInputs here
                // topInputs should only be saved in Week 1 (BudgetForm)
                // Saving topInputs here would cause Week 2 to override Week 1's values
                userInputs,
                customExpenseNames,
                expandedSections,
                timestamp: new Date().toISOString()
            };
            
            // Save to localStorage silently
            localStorage.setItem('week2_data', JSON.stringify(savingsData));
        } catch (error) {
            console.error('Error auto-saving Week 2 data:', error);
        }
    };

    // Use context values instead of local state
    const userInputs = savingsInputs;
    const setUserInputs = setSavingsInputs;
    
    // Force re-render when inputs change
    const [, forceUpdate] = useState({});
    const triggerUpdate = () => forceUpdate({});

    // Set default values when page loads
    useEffect(() => {
        // Only set defaults if no meaningful values exist (first time loading)
        // Check only the goal amounts, monthly savings, and rates (not section names)
        const meaningfulKeys = [
            'down_payment_1', 'down_payment_1_monthly', 'down_payment_1_rate', 'down_payment_1_time',
            'down_payment_2', 'down_payment_2_monthly', 'down_payment_2_rate', 'down_payment_2_time',
            'car_1', 'car_1_monthly', 'car_1_rate', 'car_1_time',
            'car_2', 'car_2_monthly', 'car_2_rate', 'car_2_time',
            'wedding_1', 'wedding_1_monthly', 'wedding_1_rate', 'wedding_1_time',
            'wedding_2', 'wedding_2_monthly', 'wedding_2_rate', 'wedding_2_time',
            'advanced_degree_1', 'advanced_degree_1_monthly', 'advanced_degree_1_rate', 'advanced_degree_1_time',
            'advanced_degree_2', 'advanced_degree_2_monthly', 'advanced_degree_2_rate', 'advanced_degree_2_time',
            'vacation_1', 'vacation_1_monthly', 'vacation_1_rate', 'vacation_1_time',
            'vacation_2', 'vacation_2_monthly', 'vacation_2_rate', 'vacation_2_time',
            'miscellaneous_1', 'miscellaneous_1_monthly', 'miscellaneous_1_rate', 'miscellaneous_1_time',
            'miscellaneous_2', 'miscellaneous_2_monthly', 'miscellaneous_2_rate', 'miscellaneous_2_time'
        ];
        
        const hasAnyValues = meaningfulKeys.some(key => {
            const value = userInputs[key];
            return value !== '' && value !== null && value !== undefined && value !== 0;
        });
        
        if (!hasAnyValues) {
            const defaultValues = {
                // Down Payment
                'down_payment_1': '50000',
                'down_payment_1_monthly': '500',
                'down_payment_1_rate': '4',
                'down_payment_1_time': '60',
                'down_payment_2': '50000',
                'down_payment_2_monthly': '500',
                'down_payment_2_rate': '4',
                'down_payment_2_time': '60',
                // Car
                'car_1': '25000',
                'car_1_monthly': '500',
                'car_1_rate': '4',
                'car_1_time': '60',
                'car_2': '25000',
                'car_2_monthly': '500',
                'car_2_rate': '4',
                'car_2_time': '60',
                // Wedding
                'wedding_1': '15000',
                'wedding_1_monthly': '500',
                'wedding_1_rate': '4',
                'wedding_1_time': '60',
                'wedding_2': '15000',
                'wedding_2_monthly': '500',
                'wedding_2_rate': '4',
                'wedding_2_time': '60',
                // Advanced Degree
                'advanced_degree_1': '30000',
                'advanced_degree_1_monthly': '500',
                'advanced_degree_1_rate': '4',
                'advanced_degree_1_time': '60',
                'advanced_degree_2': '30000',
                'advanced_degree_2_monthly': '500',
                'advanced_degree_2_rate': '4',
                'advanced_degree_2_time': '60',
                // Vacation
                'vacation_1': '5000',
                'vacation_1_monthly': '500',
                'vacation_1_rate': '4',
                'vacation_1_time': '60',
                'vacation_2': '5000',
                'vacation_2_monthly': '500',
                'vacation_2_rate': '4',
                'vacation_2_time': '60',
                // Miscellaneous
                'miscellaneous_1': '10000',
                'miscellaneous_1_monthly': '500',
                'miscellaneous_1_rate': '4',
                'miscellaneous_1_time': '60',
                'miscellaneous_2': '10000',
                'miscellaneous_2_monthly': '500',
                'miscellaneous_2_rate': '4',
                'miscellaneous_2_time': '60'
            };
            
            setUserInputs(prev => ({
                ...prev,
                ...defaultValues
            }));
        }
    }, []);

    // Add missing state variables for save/load functionality
    const [expandedSections, setExpandedSections] = useState({});
    const [customExpenseNames, setCustomExpenseNames] = useState({});
    const [showNameTooltip, setShowNameTooltip] = useState(null); // Track which section name input is hovered/focused

    // Auto-load data on component mount
    useEffect(() => {
        const savedData = localStorage.getItem('week2_data');
        if (savedData) {
            try {
                const savingsData = JSON.parse(savedData);
                
                // IMPORTANT: Do NOT load topInputs from localStorage in Week 2
                // topInputs should always come from Week 1's BudgetContext
                // Loading topInputs here would override Week 1's values and cause incorrect calculations
                
                // Load user inputs (savings-specific inputs only)
                if (savingsData.userInputs) {
                    setUserInputs(savingsData.userInputs);
                }
                // Load custom expense names
                if (savingsData.customExpenseNames) {
                    setCustomExpenseNames(savingsData.customExpenseNames);
                }
                // Load section states
                if (savingsData.expandedSections) {
                    setExpandedSections(savingsData.expandedSections);
                }
            } catch (error) {
                console.error('Error loading Week 2 data:', error);
            }
        }
    }, []); // Only run on mount

    // Auto-save with debounce (500ms delay)
    useEffect(() => {
        const saveTimer = setTimeout(() => {
            autoSaveSavings();
        }, 500); // Wait 500ms after last change before saving

        return () => clearTimeout(saveTimer);
    }, [userInputs, customExpenseNames, expandedSections]); // Removed topInputs - it should only be managed in Week 1


    // Use the same value as Week 1's "Monthly Income (After Taxes & Pre-Tax Expense Items)" in Budgeted Spend column
    // This is userAfterTaxIncome / 12 from summaryCalculations
    // IMPORTANT: Always use summaryCalculations.userAfterTaxIncome, NOT financialCalculations.afterTaxIncome
    // Use useMemo to ensure the value is recalculated when summaryCalculations changes
    // IMPORTANT: Use summaryCalculations object itself as dependency, not just userAfterTaxIncome
    // This ensures we catch when summaryCalculations is initially undefined and then gets populated
    const monthlyAfterTaxIncome = useMemo(() => {
      console.log('=== useMemo EXECUTING ===');
      console.log('summaryCalculations:', summaryCalculations);
      console.log('summaryCalculations type:', typeof summaryCalculations);
      console.log('summaryCalculations?.userAfterTaxIncome:', summaryCalculations?.userAfterTaxIncome);
      console.log('summaryCalculations?.userAfterTaxIncome type:', typeof summaryCalculations?.userAfterTaxIncome);
      
      if (summaryCalculations && typeof summaryCalculations.userAfterTaxIncome === 'number' && summaryCalculations.userAfterTaxIncome > 0) {
        const value = summaryCalculations.userAfterTaxIncome / 12;
        console.log('=== WEEK 2 MONTHLY AFTER-TAX INCOME CALCULATION ===');
        console.log('summaryCalculations exists:', !!summaryCalculations);
        console.log('userAfterTaxIncome (annual):', summaryCalculations.userAfterTaxIncome);
        console.log('monthlyAfterTaxIncome (calculated):', value);
        console.log('=== END CALCULATION ===');
        return value;
      }
      console.log('=== WEEK 2 MONTHLY AFTER-TAX INCOME: USING 0 (summaryCalculations missing or invalid) ===');
      console.log('summaryCalculations:', summaryCalculations);
      console.log('Condition check:', {
        hasSummaryCalculations: !!summaryCalculations,
        isNumber: typeof summaryCalculations?.userAfterTaxIncome === 'number',
        isPositive: summaryCalculations?.userAfterTaxIncome > 0
      });
      return 0;
    }, [summaryCalculations]);

    // Function to calculate savings details for a specific goal
    // IMPORTANT: Use summaryCalculations.userAfterTaxIncome / 12 directly, not monthlyAfterTaxIncome variable
    // This ensures we always use the correct value from Week 1's Budgeted Spend column
    const calculateSavingsDetails = useCallback((goalAmount, monthlySavingsAmount, timeToGoal, calculationMode, annualRateInput) => {
      const goal = parseFloat(goalAmount) || 0;
      const monthly = parseFloat(monthlySavingsAmount) || 0;
      const time = parseFloat(timeToGoal) || 0;
      
      // Require annual rate input - no default
      if (!annualRateInput || annualRateInput === '') {
        return { monthlySavings: 0, percentage: 0, timeToGoal: 0 };
      }
      
      const annualRate = parseFloat(annualRateInput) / 100; // Convert percentage to decimal
      const monthlyRate = annualRate / 12;

      // ALWAYS use summaryCalculations.userAfterTaxIncome / 12 directly - same as Week 1's Budgeted Spend column
      const effectiveMonthlyAfterTaxIncome = (summaryCalculations && typeof summaryCalculations.userAfterTaxIncome === 'number' && summaryCalculations.userAfterTaxIncome > 0) 
        ? summaryCalculations.userAfterTaxIncome / 12 
        : 0;

      // Debug: Check values
      console.log('=== CALCULATION DEBUG ===');
      console.log('summaryCalculations.userAfterTaxIncome (annual):', summaryCalculations?.userAfterTaxIncome);
      console.log('effectiveMonthlyAfterTaxIncome (monthly, from userAfterTaxIncome / 12):', effectiveMonthlyAfterTaxIncome);
      console.log('monthly:', monthly);
      console.log('calculationMode:', calculationMode);
      console.log('annualRateInput (raw):', annualRateInput, 'type:', typeof annualRateInput);
      console.log('annualRate (parsed):', annualRate, 'type:', typeof annualRate);
      console.log('monthlyRate:', monthlyRate);
      console.log('=== END DEBUG ===');

      // Calculate percentage for any monthly savings amount (input or calculated)
      let percentage = 0;
      
      if (effectiveMonthlyAfterTaxIncome > 0) {
        if (monthly > 0) {
          // For time calculation mode - use input monthly amount
          percentage = (monthly / effectiveMonthlyAfterTaxIncome) * 100;
          console.log('Time mode percentage:', percentage);
        } else if (calculationMode === 'monthly' && goal > 0 && time > 0) {
          // For monthly calculation mode - calculate monthly amount first
          const futureValueFactor = ((1 + monthlyRate) ** time - 1) / monthlyRate;
          const calculatedMonthly = goal / futureValueFactor;
          percentage = (calculatedMonthly / effectiveMonthlyAfterTaxIncome) * 100;
          console.log('Monthly mode percentage:', percentage);
        }
      }

      if (calculationMode === 'time') {
        // Calculate time to achieve goal with given monthly savings
        if (goal > 0 && monthly > 0) {
          // Using Excel NPER formula: NPER(rate, -pmt, pv, fv)
          // rate = monthlyRate, pmt = monthly, pv = 0, fv = goal
          const actualTime = Math.log(1 + (goal * monthlyRate) / monthly) / Math.log(1 + monthlyRate);
          console.log('Time calculation - goal:', goal, 'monthly:', monthly, 'monthlyRate:', monthlyRate, 'actualTime:', actualTime);
          return {
            timeToGoal: Math.ceil(actualTime),
            percentage: percentage
          };
        }
        return { monthlySavings: 0, percentage: percentage, timeToGoal: 0 };
      } else if (calculationMode === 'monthly') {
        // Calculate monthly savings needed for given goal and time
        if (goal > 0 && time > 0) {
          const futureValueFactor = ((1 + monthlyRate) ** time - 1) / monthlyRate;
          const requiredMonthly = goal / futureValueFactor;
          return {
            monthlySavings: requiredMonthly,
            percentage: percentage
          };
        }
        return { monthlySavings: 0, percentage: 0, timeToGoal: 0 };
      }
      
      return { monthlySavings: 0, percentage: percentage, timeToGoal: 0 };
    }, [summaryCalculations]);

    const handleUserInputChange = (id, value) => {
        console.log('=== INPUT CHANGE DEBUG ===');
        console.log('Input ID:', id);
        console.log('Input Value:', value);
        console.log('Current userInputs:', userInputs);
        
        // Check if this is a section name field (allow all characters)
        if (id.includes('_name')) {
          console.log('Section name field - allowing all characters');
          console.log('Setting value to:', value);
          setUserInputs(prev => {
            const newState = { ...prev, [id]: value };
            console.log('Updated userInputs:', newState);
            console.log('New value for', id, ':', newState[id]);
            return newState;
          });
          triggerUpdate();
          return;
        }
        
        // Remove commas, $ and % symbols for processing
        const cleanValue = value.replace(/[,$%]/g, '');
        
        // Only allow numbers and at most one decimal point
        const sanitized = cleanValue.replace(/[^0-9.]/g, '');
        
        // Allow empty string for clearing the field
        if (sanitized === '') {
          setUserInputs(prev => {
            const newState = { ...prev, [id]: '' };
            triggerUpdate();
            return newState;
          });
          return;
        }
        
        // Prevent multiple decimals - find first decimal point
        const firstDotIndex = sanitized.indexOf('.');
        let numericValue = '';
        
        if (firstDotIndex === -1) {
          // No decimal point - just numbers
          numericValue = sanitized;
        } else {
          // Has decimal point - take integer part and up to 2 decimal places
          const intPart = sanitized.substring(0, firstDotIndex);
          const decPart = sanitized.substring(firstDotIndex + 1).slice(0, 2); // max 2 decimals
          numericValue = intPart + '.' + decPart;
        }
        
        // Allow just a decimal point or partial decimal (user might be typing ".50")
        if (sanitized === '.' || (firstDotIndex !== -1 && sanitized.substring(firstDotIndex + 1) === '')) {
          setUserInputs(prev => {
            const newState = { ...prev, [id]: numericValue };
            triggerUpdate();
            return newState;
          });
          return;
        }
        
        console.log('Sanitized value:', numericValue);
        
        // Data validation
        const numValue = parseFloat(numericValue);
        
        // Rule 1: Must be a number (if user entered something)
        if (numericValue && isNaN(numValue)) {
          alert('⚠️ Must be a number');
          return;
        }
        
        if (numericValue && !isNaN(numValue)) {
          // Must be >= 0
          if (numValue < 0) {
            alert('⚠️ Must be >= 0');
            return;
          }
          
          // Validate annual earning rate limits (0% to 100%)
          if (id.includes('_rate') && numValue > 100) {
            alert('⚠️ Annual earning rate must be between 0% and 100%');
            return;
          }
          
          // Validate retirement contribution limits, sourced from the
          // Assumptions table -- was hardcoded to the old 2025 annual
          // limits (23500/7000) here, disagreeing with BudgetForm.jsx's
          // and Week12.jsx's 24500/7500. See
          // docs/financial-audit-2026-08-11.md finding #14.
          if (id === 'retirement_roth_401k' && numValue > assumptions.scalars.limit_401k) {
            alert(`Roth 401(k) maximum contribution is ${formatCurrency(assumptions.scalars.limit_401k)} annually`);
            return;
          }
          if (id === 'retirement_roth_ira' && numValue > assumptions.scalars.limit_ira) {
            alert(`Roth IRA maximum contribution is ${formatCurrency(assumptions.scalars.limit_ira)} annually`);
            return;
          }
        }
        
        setUserInputs(prev => {
          const newState = { ...prev, [id]: numericValue };
          console.log('Updated userInputs:', newState);
          console.log('Specific rate value:', newState[id]);
          console.log('=== END INPUT CHANGE DEBUG ===');
          return newState;
        });
        triggerUpdate(); // Force re-render to update calculations
    };

    // formatCurrency/formatPercent now come from src/utils/formatters.js (module import above).

    // Format number for input display (with commas, preserve decimals for cents)
    const formatNumberForInput = (num) => {
      if (!num || num === '') return '';
      
      // Keep as string to preserve decimal input exactly as user types
      const numStr = num.toString();
      
      // If it's just a decimal point, return it as-is
      if (numStr === '.') return '.';
      
      const number = parseFloat(num);
      if (isNaN(number)) return numStr;
      
      // If it has a decimal point, preserve it exactly (don't force 2 decimals)
      if (numStr.includes('.')) {
        const parts = numStr.split('.');
        const intPart = parts[0] || '';
        const decPart = parts[1] || '';
        
        // If intPart is empty (user typing ".5"), don't format
        if (intPart === '') {
          return '.' + decPart;
        }
        
        // Format integer part with commas, keep decimal part as-is
        const formattedInt = parseInt(intPart).toLocaleString('en-US');
        return decPart ? `${formattedInt}.${decPart}` : formattedInt + '.';
      } else {
        // Whole number - format with commas
        return parseInt(numStr).toLocaleString('en-US');
      }
    };
    
    // Parse number from formatted input (remove commas)
    const parseNumberFromInput = (str) => {
      if (!str) return '';
      return str.replace(/,/g, '');
    };
    
    // Read-only field with counting animation - only animates when value actually changes
    const ReadOnlyWithAnimation = ({ value, format, prefix = '', suffix = '', decimals = 0, fieldId }) => {
      const [isCalculating, setIsCalculating] = useState(false);
      const [showSuccess, setShowSuccess] = useState(false);
      const prevValueRef = useRef(value);
      const [shouldAnimate, setShouldAnimate] = useState(false);
      const [animatingValue, setAnimatingValue] = useState(null);
      
      // Only use count-up animation if shouldAnimate is true and we have a target value
      const { count, isAnimating } = useCountUp(shouldAnimate && animatingValue !== null ? animatingValue : (value || 0), 800, decimals);
      
      useEffect(() => {
        // Check if value actually changed (not just re-render)
        const prevValue = prevValueRef.current;
        const currentValue = value || 0;
        
        // Only animate if value actually changed and both values are valid numbers
        if (prevValue !== currentValue && 
            currentValue > 0 && 
            prevValue !== undefined && 
            prevValue !== null && 
            prevValue !== 0 &&
            !isNaN(prevValue) &&
            !isNaN(currentValue)) {
          // Value changed - animate from previous to current
          setAnimatingValue(currentValue);
          setShouldAnimate(true);
          setIsCalculating(true);
          const timer = setTimeout(() => {
            setIsCalculating(false);
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              setShouldAnimate(false);
              setAnimatingValue(null);
            }, 2000);
          }, 800);
          prevValueRef.current = currentValue;
          return () => clearTimeout(timer);
        } else {
          // First render, reset, or no change - no animation
          prevValueRef.current = currentValue;
          setShouldAnimate(false);
          setAnimatingValue(null);
        }
      }, [value, fieldId]);
      
      if (isCalculating && isAnimating && shouldAnimate) {
        return (
          <div style={{ ...styles.readOnly, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <SkeletonLoader width="60%" height="20px" />
          </div>
        );
      }
      
      if (value === 0 || value === null || value === undefined) {
        return <div style={styles.readOnly}>-</div>;
      }
      
      // Use actual value if not animating, otherwise use animated count
      const displayValue = format 
        ? format(shouldAnimate ? count : value, formatCurrency) 
        : `${prefix}${(shouldAnimate ? count : value).toFixed(decimals)}${suffix}`;
      
      return (
        <div style={{ 
          ...styles.readOnly, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          animation: shouldAnimate ? 'slideIn 0.3s ease-out' : 'none',
        }}>
          {displayValue}
          <SuccessCheckmark show={showSuccess} size={16} />
        </div>
      );
    };


    try {
        return (
            <>
            <style>{`
              .week2-savings-page .week2-lift-surface,
              .week2-savings-page .week2-info-surface,
              .week2-savings-page .week2-income-surface,
              .week2-savings-page .week2-pair-card,
              .week2-savings-page .week2-animated-input,
              .week2-savings-page .week2-months-wrap {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .week2-savings-page .week2-lift-surface:hover,
              .week2-savings-page .week2-pair-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08) !important;
                border-color: rgba(148, 163, 184, 0.45) !important;
              }
              .week2-savings-page .week2-info-surface:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(13, 26, 75, 0.12);
                border-color: rgba(13, 26, 75, 0.25) !important;
                background-color: rgba(13, 26, 75, 0.08) !important;
              }
              .week2-savings-page .week2-income-surface:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(22, 101, 52, 0.2);
                border-color: rgba(22, 101, 52, 0.35) !important;
              }
              .week2-savings-page .week2-animated-input:hover:not(:focus) {
                border-color: #9ca3af !important;
                background-color: #ffffff !important;
                box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
                transform: translateY(-2px) scale(1.01);
              }
              .week2-savings-page .week2-animated-input:focus {
                border-color: #0d1a4b !important;
                background-color: #fffef0 !important;
                box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
                transform: translateY(-1px) scale(1.01);
                outline: none;
              }
              .week2-savings-page .week2-months-wrap:hover {
                border-color: #9ca3af !important;
                background-color: #ffffff !important;
                box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
                transform: translateY(-2px) scale(1.01);
              }
              .week2-savings-page .week2-months-wrap:focus-within {
                border-color: #0d1a4b !important;
                background-color: #fffef0 !important;
                box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
                transform: translateY(-1px) scale(1.01);
              }
              @media (prefers-reduced-motion: reduce) {
                .week2-savings-page .week2-lift-surface,
                .week2-savings-page .week2-info-surface,
                .week2-savings-page .week2-income-surface,
                .week2-savings-page .week2-pair-card,
                .week2-savings-page .week2-animated-input,
                .week2-savings-page .week2-months-wrap {
                  transition: none !important;
                  transform: none !important;
                }
              }
            `}</style>
            <div style={styles.container} className="week2-savings-page">
            {/* Section Container - matching Week 1 layered design */}
            <div style={styles.sectionContainer} className="week2-lift-surface">
            {/* Enhanced Header */}
            <div style={styles.enhancedHeader}>
              <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Savings Planning</span>
            </div>
            
            {/* Info Box - matching Week 1 styling */}
            <div style={styles.infoBox} className="week2-info-surface">
              <InfoIcon />
              <div>
                <strong>How it works:</strong> Enter your goal amount and either monthly savings amount (to calculate time) or time period (to calculate monthly savings needed). You can customize the annual earning rate for each savings goal.
              </div>
            </div>

            {/* Monthly Income Summary - from Week 1 */}
            {(() => {
              // Debug: Log the values to understand what's happening
              console.log('=== WEEK 2 MONTHLY INCOME DISPLAY DEBUG ===');
              console.log('summaryCalculations:', summaryCalculations);
              console.log('summaryCalculations?.userAfterTaxIncome:', summaryCalculations?.userAfterTaxIncome);
              console.log('typeof summaryCalculations?.userAfterTaxIncome:', typeof summaryCalculations?.userAfterTaxIncome);
              console.log('financialCalculations?.afterTaxIncome:', financialCalculations?.afterTaxIncome);
              
              // Always show the summary, but check if we have the correct value
              const annualAfterTaxIncome = summaryCalculations?.userAfterTaxIncome;
              const hasValidValue = annualAfterTaxIncome && typeof annualAfterTaxIncome === 'number' && annualAfterTaxIncome > 0;
              
              if (!hasValidValue) {
                console.warn('WARNING: summaryCalculations.userAfterTaxIncome is not available or invalid!');
                console.warn('This means Week 1 calculations may not be complete yet.');
                return null;
              }
              
              const monthlyIncome = annualAfterTaxIncome / 12;
              console.log('Annual After Tax Income:', annualAfterTaxIncome);
              console.log('Monthly Income (calculated):', monthlyIncome);
              console.log('=== END DEBUG ===');
              
              return annualAfterTaxIncome && typeof annualAfterTaxIncome === 'number' && annualAfterTaxIncome > 0;
            })() && (
              <div
                className="week2-income-surface"
                style={{
                ...styles.afterTaxRow,
                marginBottom: '48px',
                marginTop: '48px',
              }}>
                <span>Monthly Income (After Taxes & Pre-Tax Expense Items)</span>
                <span>{formatCurrency(summaryCalculations.userAfterTaxIncome / 12)}</span>
              </div>
            )}
        
        {/* Individual Savings Sections - Grouped in pairs */}
        {savingsConfig.sections.reduce((acc, section, index) => {
          if (index % 2 === 0) {
            // Create a pair with current section and next section
            const nextSection = savingsConfig.sections[index + 1];
            acc.push([section, nextSection]);
          }
          return acc;
        }, []).map(([section1, section2], pairIndex) => {
          const goalAmount1 = userInputs[section1.goalAmount] || '';
          const monthlySavings1 = userInputs[section1.monthlySavings] || '';
          const timeToGoal1 = userInputs[section1.timeToGoal] || '';
          const annualRate1 = userInputs[section1.annualRate] || '';
          const sectionName1 = userInputs[section1.sectionName] || '';
          console.log('Rendering sectionName1 for', section1.sectionName, ':', sectionName1);
          console.log('Section 1 - annualRate1:', annualRate1, 'section1.annualRate:', section1.annualRate);
          const details1 = calculateSavingsDetails(goalAmount1, monthlySavings1, timeToGoal1, section1.calculationMode, annualRate1);
          
          const goalAmount2 = userInputs[section2.goalAmount] || '';
          const monthlySavings2 = userInputs[section2.monthlySavings] || '';
          const timeToGoal2 = userInputs[section2.timeToGoal] || '';
          const annualRate2 = userInputs[section2.annualRate] || '';
          const sectionName2 = userInputs[section2.sectionName] || '';
          console.log('Rendering sectionName2 for', section2.sectionName, ':', sectionName2);
          console.log('Section 2 - annualRate2:', annualRate2, 'section2.annualRate:', section2.annualRate);
          const details2 = calculateSavingsDetails(goalAmount2, monthlySavings2, timeToGoal2, section2.calculationMode, annualRate2);
          
          const syncGoal = (val) => {
            handleUserInputChange(section1.goalAmount, val);
            handleUserInputChange(section2.goalAmount, val);
          };
          const syncRate = (val) => {
            handleUserInputChange(section1.annualRate, val);
            handleUserInputChange(section2.annualRate, val);
          };

          return (
            <div key={`pair-container-${pairIndex}`}>
              {/* Section Divider - except for first pair */}
              {pairIndex > 0 && (
                <div style={styles.sectionDivider}></div>
              )}
              
              {/* Single Excel-like card - two columns for every savings goal pair */}
              <div
                className="week2-pair-card week2-lift-surface"
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  margin: '0 auto 48px',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ ...styles.sectionHeader, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: '#111827' }}>{section1.title}</span>
                </div>
                  {/* Satır bazlı grid: her satırda sol ve sağ hücre aynı yükseklikte, yamukluk kalmaz */}
                  <div style={{
                    padding: '34px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: 'auto auto auto auto',
                    columnGap: '48px',
                    rowGap: '20px',
                    alignItems: 'stretch',
                  }}>
                    {/* Satır 1: Goal Amount */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Goal Amount</label>
                      <div style={styles.inputCellContainer}>
                        <input
                          className="week2-animated-input"
                          style={styles.input}
                          type="text"
                          value={goalAmount1 ? `$${formatNumberForInput(goalAmount1)}` : ''}
                          onChange={(e) => syncGoal(e.target.value.replace(/[$,\s]/g, ''))}
                          onFocus={(e) => { e.target.style.borderColor = '#0d1a4b'; e.target.style.backgroundColor = '#fffef0'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fffde7'; }}
                          placeholder="Enter goal amount"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Goal Amount</label>
                      <div style={styles.inputCellContainer}>
                        <input
                          className="week2-animated-input"
                          style={styles.input}
                          type="text"
                          value={goalAmount1 ? `$${formatNumberForInput(goalAmount1)}` : ''}
                          onChange={(e) => syncGoal(e.target.value.replace(/[$,\s]/g, ''))}
                          onFocus={(e) => { e.target.style.borderColor = '#0d1a4b'; e.target.style.backgroundColor = '#fffef0'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fffde7'; }}
                          placeholder="Enter goal amount"
                        />
                      </div>
                    </div>
                    {/* Satır 2: Monthly Savings (sol) | Time to Achieve - months (sağ) */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Monthly Savings Amount</label>
                      <div style={styles.inputCellContainer}>
                        <input
                          className="week2-animated-input"
                          style={styles.input}
                          type="text"
                          value={monthlySavings1 ? `$${formatNumberForInput(monthlySavings1)}` : ''}
                          onChange={(e) => handleUserInputChange(section1.monthlySavings, e.target.value)}
                          onFocus={(e) => { e.target.style.borderColor = '#0d1a4b'; e.target.style.backgroundColor = '#fffef0'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fffde7'; }}
                          placeholder="Enter monthly amount"
                        />
                      </div>
                      <div style={styles.percentageInfo}>
                        {formatPercent(details1.percentage, { alreadyPercent: true })} of Monthly After Tax Income
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Time to Achieve Savings Goal</label>
                      <div style={styles.monthsFieldWrap} className="week2-months-wrap">
                        <input
                          className="week2-months-input"
                          style={styles.monthsInputInline}
                          type="number"
                          min="1"
                          step="1"
                          value={timeToGoal2}
                          onChange={(e) => handleUserInputChange(section2.timeToGoal, e.target.value)}
                          onFocus={(e) => { e.currentTarget.parentElement.style.borderColor = '#0d1a4b'; e.currentTarget.parentElement.style.backgroundColor = '#fffef0'; }}
                          onBlur={(e) => { e.currentTarget.parentElement.style.borderColor = '#e5e7eb'; e.currentTarget.parentElement.style.backgroundColor = '#fffde7'; }}
                          placeholder="Enter months"
                        />
                        <span style={styles.monthsSuffix}>months</span>
                      </div>
                    </div>
                    {/* Satır 3: Annual Rate */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Annual Earning Rate</label>
                      <div style={styles.inputCellContainer}>
                        <input
                          className="week2-animated-input"
                          style={styles.input}
                          type="text"
                          value={annualRate1 ? `${annualRate1}%` : ''}
                          onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); syncRate(v); }}
                          onFocus={(e) => { e.target.style.borderColor = '#0d1a4b'; e.target.style.backgroundColor = '#fffef0'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fffde7'; }}
                          placeholder="Enter rate"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Annual Earning Rate</label>
                      <div style={styles.inputCellContainer}>
                        <input
                          className="week2-animated-input"
                          style={styles.input}
                          type="text"
                          value={annualRate1 ? `${annualRate1}%` : ''}
                          onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); syncRate(v); }}
                          onFocus={(e) => { e.target.style.borderColor = '#0d1a4b'; e.target.style.backgroundColor = '#fffef0'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fffde7'; }}
                          placeholder="Enter rate"
                        />
                      </div>
                    </div>
                    {/* Satır 4: Time to Achieve (sol) | Monthly Savings (sağ) */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Time to Achieve Savings Goal</label>
                      <ReadOnlyWithAnimation
                        value={details1.timeToGoal}
                        format={(val) => `${Math.round(val)} months`}
                        suffix=" months"
                        fieldId={`${section1.id}_timeToGoal`}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={styles.label}>Monthly Savings Amount</label>
                      <ReadOnlyWithAnimation
                        value={details2.monthlySavings}
                        format={(val, formatCurrencyFn) => formatCurrencyFn(val)}
                        fieldId={`${section2.id}_monthlySavings`}
                      />
                      <div style={styles.percentageInfo}>
                        {formatPercent(details2.percentage, { alreadyPercent: true })} of Monthly After Tax Income
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          );
        })}
            </div>
            {/* Close sectionContainer */}
            </div>
            </>
        );
    } catch (error) {
        console.error('Error rendering SavingsForm:', error);
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Error Loading Savings Form</h2>
                <p>There was an error loading the savings form. Please try refreshing the page.</p>
                <p style={{ color: 'red', fontSize: '12px' }}>Error: {error.message}</p>
            </div>
        );
    }
}
