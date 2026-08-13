import React, { useState, useMemo } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useAssumptions } from '../contexts/AssumptionsContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

// This data structure now includes all necessary info for rendering the exact layout
const budgetConfig = {
  title: "Monthly Budget",
  tableHeaders: [
    "Expense Items", 
    "Examples/Info", 
    "Budgeted Spend", 
    "Recommended Spend $", 
    "% of Monthly After-Tax Income"
  ],
  sections: [
    // Pre-Tax Expense Items
    {
      title: 'Pre-Tax Expense Items',
      isPreTax: true,
      items: [
        {
          title: 'Insurance',
          items: [
            { id: 'health_insurance', label: 'Health Insurance', explanation: 'Limits amount paid for medical bills' },
            { id: 'life_insurance', label: 'Life Insurance', explanation: 'Pay beneficiaries upon policyholder\'s death' },
            { id: 'disability_insurance', label: 'Disability Insurance', explanation: 'Income in case you are unable to work' },
          ]
        },
        {
          title: 'Retirement Contributions',
          items: [
            { id: 'traditional_401k', label: 'Traditional 401(k)', explanation: '$2,041.66 Max Monthly Contribution' },
            { id: 'traditional_ira', label: 'Traditional IRA', explanation: '$625.00 Max Monthly Contribution' },
          ],
          note: 'Roth 401k & Roth IRA listed under After-Tax'
        }
      ]
    },
    {
      title: 'After-Tax Expense Items',
      items: [
        {
          title: 'Retirement Contributions',
          items: [
            { id: 'roth_401k', label: 'Roth 401(k) Plan', explanation: '$2,041.66 Max Monthly Contribution' },
            { id: 'roth_ira', label: 'Roth IRA Plan', explanation: '$625.00 Max Monthly Contribution' },
          ]
        },
        {
          title: 'Savings & Investments',
          items: [
            { id: 'emergency_fund', label: 'Emergency Fund', explanation: 'Job loss, medical emergencies, urgent' },
            { id: 'down_payment', label: 'Down Payment', explanation: 'Savings Goals' },
            { id: 'car', label: 'Car', explanation: 'Savings Goals' },
            { id: 'wedding', label: 'Wedding', explanation: 'Savings Goals' },
            { id: 'advanced_degree', label: 'Advanced Degree', explanation: 'Savings Goals' },
            { id: 'vacation', label: 'Vacation', explanation: 'Savings Goals' },
            { id: 'miscellaneous', label: 'Miscellaneous', explanation: 'Savings Goals' },
          ]
        },
        {
          title: 'Debt Payments',
          items: [
            { id: 'student_loans', label: 'Student Loans', explanation: 'Monthly student loan payments' },
            { id: 'credit_card_payments', label: 'Credit Card Payments', explanation: 'Monthly credit card payments' },
            { id: 'personal_loans', label: 'Personal Loans', explanation: 'Monthly personal loan payments' },
            { id: 'miscellaneous_debt', label: 'Miscellaneous', explanation: 'Other debt payments' },
          ]
        },
        {
          title: 'Housing',
          items: [
            { id: 'rent', label: 'Rent', explanation: 'House, apartment' },
            { id: 'electricity', label: 'Electricity', explanation: 'Appliances, lighting, heating/cooling systems' },
            { id: 'gas', label: 'Gas', explanation: 'Heating, hot water, cooking' },
            { id: 'water', label: 'Water', explanation: 'Drinking, bathing, cooking, laundry' },
            { id: 'sewer_trash', label: 'Sewer/Trash', explanation: 'Sewer maintenance, trash/recycling collection' },
            { id: 'phone', label: 'Phone (Cell/Landline)', explanation: 'Voice, text, landline' },
            { id: 'internet', label: 'Internet', explanation: 'Wi-Fi' },
            { id: 'housing_miscellaneous', label: 'Miscellaneous', explanation: 'Other housing expenses' },
          ]
        },
        {
          title: 'Transportation',
          items: [
            { id: 'car_payment', label: 'Car Payment', explanation: 'Principal & interest on auto loan' },
            { id: 'gasoline_fuel', label: 'Gasoline/Fuel', explanation: 'Automobile fuel' },
            { id: 'car_maintenance', label: 'Car Maintenance', explanation: 'Oil changes, tire replacement, battery check' },
            { id: 'parking_fees', label: 'Parking Fees', explanation: 'Metered parking, garage fees, permit fees' },
            { id: 'rideshare', label: 'Rideshare', explanation: 'Uber, Lyft' },
            { id: 'public_transit', label: 'Public Transit Passes', explanation: 'Buses, subways, trains, light rail services' },
            { id: 'transportation_miscellaneous', label: 'Miscellaneous', explanation: 'Other transportation expenses' },
          ]
        },
        {
          title: 'Insurance/Health',
          items: [
            { id: 'auto_insurance', label: 'Auto Insurance', explanation: 'Required vehicle coverage for damage' },
            { id: 'renters_insurance', label: 'Renter\'s Insurance', explanation: 'Protection for residence & belongings' },
            { id: 'otc_medications', label: 'Over-the-Counter Medications', explanation: 'Pain relievers, cold medicine, allergy meds' },
            { id: 'mental_health', label: 'Mental Health', explanation: 'Therapist, wellness apps, psychiatric care' },
            { id: 'physical_health', label: 'Physical Health', explanation: 'Gym membership, equipment, personal training' },
            { id: 'insurance_miscellaneous', label: 'Miscellaneous', explanation: 'Other insurance/health expenses' },
          ]
        },
        {
          title: 'Food',
          items: [
            { id: 'groceries', label: 'Groceries', explanation: 'Food & drinks' },
            { id: 'dining_out', label: 'Dining Out', explanation: 'Eating at restaurants' },
            { id: 'takeout', label: 'Takeout', explanation: 'Restaurant delivery, DoorDash' },
            { id: 'food_miscellaneous', label: 'Miscellaneous', explanation: 'Other food expenses' },
          ]
        },
        {
          title: 'Lifestyle & Entertainment',
          items: [
            { id: 'subscriptions', label: 'Subscriptions', explanation: 'Netflix, Spotify, Apps' },
            { id: 'hobbies', label: 'Hobbies', explanation: 'Supplies, gear, classes' },
            { id: 'travel_vacation', label: 'Travel/Vacation', explanation: 'Flights, lodging, transportation' },
            { id: 'gifts', label: 'Gifts', explanation: 'Holidays, birthdays, weddings' },
            { id: 'clothing', label: 'Clothing', explanation: 'Everyday clothes, shoes, outerwear' },
            { id: 'haircuts_salon', label: 'Haircuts/Salon', explanation: 'Barbershop visits, styling, hair coloring' },
            { id: 'personal_care', label: 'Personal Care/Grooming', explanation: 'Skincare, shaving products, toiletries' },
            { id: 'events', label: 'Sporting, Musical, or other Events', explanation: 'Tickets, souvenirs' },
            { id: 'lifestyle_miscellaneous', label: 'Miscellaneous', explanation: 'Other lifestyle expenses' },
          ]
        },
        {
          title: 'Charity',
          items: [
            { id: 'charity', label: 'Charity', explanation: 'Churches, nonprofits, fundraisers' },
          ]
        },
        {
          title: 'Other Miscellaneous Expenses',
          items: [] // Dynamic items - will be added by user via plus button
        }
      ]
    }
  ]
};

const styles = {
  // Main container - Modern Shadcn/ui + Glassmorphism hybrid
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
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  sectionDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(229, 231, 235, 0.6), transparent)',
    margin: '0',
    borderRadius: '1px',
  },
  
  // Top "User Inputted Data" section - Modern input styles
  header: { 
    fontSize: '18px', 
    fontWeight: '600',
    margin: '24px 0 16px 0', 
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  topInput: {
    border: '2px solid #d1d5db',
    backgroundColor: '#fffde7',
    padding: '10px 14px',
    width: '220px',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '14px',
    outline: 'none',
    fontWeight: '500',
    textAlign: 'right',
  },
  topInputFocus: {
    borderColor: '#0d1a4b',
    boxShadow: '0 0 0 3px rgba(13, 26, 75, 0.12)',
    backgroundColor: '#fffef0',
  },
  selectInput: {
    border: '2px solid #d1d5db',
    backgroundColor: 'white',
    padding: '10px 14px',
    width: '220px',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    textAlign: 'right',
    textAlignLast: 'right',
  },
  selectInputFocus: {
    borderColor: '#0d1a4b',
    boxShadow: '0 0 0 3px rgba(13, 26, 75, 0.12)',
    backgroundColor: '#fafafa',
  },
  afterTaxRow: { 
    background: 'rgba(240, 253, 244, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '16px 20px', 
    border: '2px solid rgba(134, 239, 172, 0.5)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    marginTop: '16px', 
    borderRadius: '12px',
    fontWeight: '600',
    color: '#166534',
    boxShadow: '0 4px 16px 0 rgba(22, 101, 52, 0.15)',
    fontSize: '15px',
  },

  // Main table - Modern Shadcn/ui table style
  table: { 
    width: '100%', 
    maxWidth: '1200px',
    borderCollapse: 'separate',
    borderSpacing: 0,
    marginTop: 32, 
    marginBottom: 32,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'table',
  },
  th: { 
    background: 'linear-gradient(135deg, rgba(13, 26, 75, 0.95) 0%, rgba(30, 58, 138, 0.9) 100%)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'white', 
    padding: '16px', 
    borderBottom: 'none',
    borderRight: 'none',
    textAlign: 'center', 
    fontWeight: '600',
    fontSize: '17px',
    letterSpacing: '0.01em',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
  },
  thExpense: { width: '200px' },
  thBudgeted: { width: '180px' },
  thRecommended: { width: '240px' },
  thPercent: { width: '120px' },
  td: { 
    borderBottom: '1px solid rgba(243, 244, 246, 0.3)',
    borderRight: 'none',
    padding: '14px 16px', 
    verticalAlign: 'middle',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    boxShadow: 'inset 0 -1px 0 rgba(243, 244, 246, 0.2)',
  },
  tdHover: {
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transform: 'translateX(2px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  trHover: {
    backgroundColor: 'rgba(249, 250, 251, 0.6)',
    transform: 'scale(1.002)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  
  // Table row types
  sectionHeader: { 
    fontWeight: '600',
    background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 100%)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#111827',
    fontSize: '15px',
    letterSpacing: '-0.01em',
    borderTop: 'none',
    borderBottom: 'none',
    padding: '16px 20px',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    position: 'relative',
  },
  totalRow: { 
    background: '#fafafa',
    fontWeight: '600',
    fontSize: '14px',
    borderTop: '2px solid #e5e7eb',
  },

  // Input fields within the table - Modern Shadcn/ui input style
  input: { 
    width: '100%', 
    border: '2px solid #d1d5db', 
    padding: '8px 12px', 
    textAlign: 'right', 
    backgroundColor: '#fffde7',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontWeight: '500',
    fontSize: '13px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  },
  inputFocus: {
    borderColor: '#0d1a4b',
    boxShadow: '0 0 0 2px rgba(13, 26, 75, 0.12)',
    backgroundColor: '#fffef0',
  },
  readOnly: { 
    textAlign: 'right', 
    paddingRight: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  deductionLabel: {
    width: '240px',
  },
  inputCellContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  currencySymbol: {
    marginLeft: '8px',
    color: '#6b7280',
  },
  warningBox: {
    marginTop: '20px',
    padding: '12px 16px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: '14px',
  },
  floatingWarning: {
    position: 'fixed',
    left: '50%',
    bottom: '32px',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px 32px',
    fontWeight: '500',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    fontSize: '14px',
  },
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

// Animated Number Component - Smooth number transitions
// Note: formatCurrency function will be passed as prop or accessed from parent scope
const AnimatedNumber = ({ value, formatCurrency = false, formatCurrencyFn = null, style = {} }) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (Math.abs(value - displayValue) > 0.01) { // Use threshold to avoid infinite loops
      setIsAnimating(true);
      const startValue = displayValue;
      const endValue = value;
      const duration = 600;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOutCubic;
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue); // Ensure final value is exact
          setIsAnimating(false);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [value]);

  // Use provided formatCurrency function if available, otherwise use default formatting
  // Note: the `formatCurrency` prop here is a boolean flag and shadows the
  // module-level formatCurrency() import for the rest of this component --
  // that's fine since actual formatting always goes through formatCurrencyFn.
  const formatValue = (val) => {
    if (formatCurrency && formatCurrencyFn) {
      return formatCurrencyFn(val);
    } else if (formatCurrency) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  return (
    <span style={{
      ...style,
      transition: 'transform 0.2s ease-out',
      transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
      display: 'inline-block'
    }}>
      {formatValue(displayValue)}
    </span>
  );
};

// Progress Bar Component - Visual budget utilization
const ProgressBar = ({ percentage, color = '#16a34a', height = '8px', showLabel = true, label }) => {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div style={{ width: '100%' }}>
      {showLabel && label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#6b7280' }}>
          <span>{label}</span>
          <span style={{ fontWeight: '600', color: safePercentage > 100 ? '#dc2626' : '#16a34a' }}>{safePercentage.toFixed(1)}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height: height,
        backgroundColor: 'rgba(229, 231, 235, 0.5)',
        borderRadius: '9999px',
        overflow: 'hidden',
        position: 'relative',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}>
        <div style={{
          width: `${safePercentage}%`,
          height: '100%',
          backgroundColor: safePercentage > 100 ? '#dc2626' : color,
          borderRadius: '9999px',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
          boxShadow: safePercentage > 100 
            ? '0 2px 8px rgba(220, 38, 38, 0.3)' 
            : '0 2px 8px rgba(22, 163, 74, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: safePercentage > 100
              ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            animation: 'shimmer 2s infinite',
          }} />
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// Status Badge Component - Modern badge design
const StatusBadge = ({ status, variant = 'default' }) => {
  const variants = {
    success: { bg: 'rgba(240, 253, 244, 0.8)', color: '#16a34a', border: 'rgba(134, 239, 172, 0.5)', icon: '✓' },
    warning: { bg: 'rgba(254, 252, 232, 0.8)', color: '#ca8a04', border: 'rgba(253, 224, 71, 0.5)', icon: '⚠' },
    error: { bg: 'rgba(254, 242, 242, 0.8)', color: '#dc2626', border: 'rgba(252, 165, 165, 0.5)', icon: '✕' },
    info: { bg: 'rgba(240, 249, 255, 0.8)', color: '#2563eb', border: 'rgba(191, 219, 254, 0.5)', icon: 'ℹ' },
    default: { bg: 'rgba(249, 250, 251, 0.8)', color: '#6b7280', border: 'rgba(229, 231, 235, 0.5)', icon: '' }
  };
  
  const style = variants[variant] || variants.default;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    }}>
      {style.icon && <span>{style.icon}</span>}
      {status}
    </span>
  );
};

const userInputFields = [
    { id: 'preTaxIncome', label: 'Annual Pre-Tax Income', value: '1000000' },
    { id: 'location', label: 'Location (State Abbreviation)', value: 'NY' },
    { id: 'residenceInNYC', label: 'Residence in New York City', value: 'No' },
    { id: 'housingCosts', label: 'Housing Costs', value: 'High' },
];

// Note: deductionChoiceFields removed as deductionChoices is not available in current context

export default function BudgetForm() {
    const { 
        topInputs, 
        setTopInputs, 
        financialCalculations,
        summaryCalculations,
        retirementInputs,
        setRetirementInputs,
        userPreTaxInputs,
        setUserPreTaxInputs,
        saveBudgetData,
        loadBudgetData
    } = useBudget();
    const { assumptions } = useAssumptions();
    const monthly401kLimit = assumptions.scalars.limit_401k / 12;
    const monthlyIraLimit = assumptions.scalars.limit_ira / 12;

    // Auto-save function (without alert)
    const autoSaveBudget = () => {
        try {
            const budgetData = {
                topInputs,
                userInputs,
                customExpenseNames,
                customExpenseItems,
                nextItemId,
                expandedSections,
                timestamp: new Date().toISOString()
            };
            
            // Save to localStorage silently
            localStorage.setItem('week1_data', JSON.stringify(budgetData));
        } catch (error) {
            console.error('Error auto-saving Week 1 data:', error);
        }
    };


    const [userInputs, setUserInputs] = useState(
        budgetConfig.sections.flatMap(s => s.items).flatMap(subsection => subsection.items).reduce((acc, item) => ({ ...acc, [item.id]: '' }), {})
    );

    // Initialize userInputs with context values for pre-tax items
    React.useEffect(() => {
      setUserInputs(prev => {
        const updated = { ...prev };
        Object.keys(userPreTaxInputs).forEach(key => {
          if (userPreTaxInputs[key] !== undefined && userPreTaxInputs[key] !== '') {
            updated[key] = userPreTaxInputs[key];
          }
        });
        return updated;
      });
    }, [userPreTaxInputs]);
    
    // Note: showDeductionChoices removed as deductionChoices section is not available
    
    const afterTaxIncome = financialCalculations.afterTaxIncome;

    // Note: dynamicNoteText removed as deductionChoices is not available in current context

    const tableCalculations = useMemo(() => {
        const recommended = {};
        const entered = {};
        const sectionTotals = {};
        let grandTotalEntered = 0;

        budgetConfig.sections.forEach(section => {
          let sectionEnteredTotal = 0;
          let sectionRecommendedTotal = 0;
          
          section.items.forEach(subsection => {
            subsection.items.forEach(item => {
              if (item.id) {
                const recommendedValue = item.recommendedAmount || 0;
                recommended[item.id] = recommendedValue;
                sectionRecommendedTotal += recommendedValue;
                const enteredValue = parseFloat(userInputs[item.id]) || 0;
                entered[item.id] = enteredValue;
                sectionEnteredTotal += enteredValue;
              }
            });
          });
          
          sectionTotals[section.title] = {
            entered: sectionEnteredTotal,
            recommended: sectionRecommendedTotal
          };
          grandTotalEntered += sectionEnteredTotal;
        });

        return { recommended, entered, sectionTotals, grandTotalEntered };
    }, [userInputs, afterTaxIncome, topInputs.housingCosts]);

    // On mount, initialize local userInputs for retirement plans from context if available
    React.useEffect(() => {
      setUserInputs(prev => {
        const updated = { ...prev };
        Object.keys(retirementInputs).forEach(key => {
          if (retirementInputs[key] !== undefined && retirementInputs[key] !== '') {
            updated[key] = retirementInputs[key];
          }
        });
        // Map retirement context values back to Week 1 field names
        if (retirementInputs.retirement_roth_401k !== undefined && retirementInputs.retirement_roth_401k !== '') {
          updated.roth_401k = retirementInputs.retirement_roth_401k;
        }
        if (retirementInputs.retirement_roth_ira !== undefined && retirementInputs.retirement_roth_ira !== '') {
          updated.roth_ira = retirementInputs.retirement_roth_ira;
        }
        return updated;
      });
    }, []);

    const handleUserInputChange = (id, value) => {
        // Remove $, %, and comma symbols, then only allow numbers and at most one decimal point
        const cleanValue = value.replace(/[$%,]/g, '');
        const sanitized = cleanValue.replace(/[^0-9.]/g, '');
        
        // Allow empty string for clearing the field
        if (sanitized === '') {
          setUserInputs(prev => ({ ...prev, [id]: '' }));
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
          setUserInputs(prev => ({ ...prev, [id]: numericValue }));
          return;
        }
        
        // Data validation based on Excel constraints
        const numValue = parseFloat(numericValue);
        
        // Rule 1: Must be a number (if user entered something)
        if (numericValue && numericValue !== '.' && isNaN(numValue)) {
          return; // Don't alert, just prevent invalid input
        }
        
        if (numericValue && numericValue !== '.' && !isNaN(numValue)) {
          // Excel validation rules: 1. Number, 2. >= 0, 3. <= Monthly Pre-Tax Income
          if (numValue < 0) {
            return; // Don't alert, just prevent negative input
          }
          if (numValue > monthlyPreTaxIncome) {
            alert(`⚠️ Must be <= Monthly Pre-Tax Income (${formatCurrency(monthlyPreTaxIncome)})`);
            return;
          }
          
          // Validate retirement contribution limits (monthly), sourced from
          // the Assumptions table -- was hardcoded to 2041.66/625.00 here,
          // disagreeing with Week6Retirement.jsx's 1958.33/583.33 and
          // SavingsForm.jsx's annual 23500/7000. See
          // docs/financial-audit-2026-08-11.md finding #14.
          if (id === 'traditional_401k' && numValue > monthly401kLimit) {
            alert(`Traditional 401(k) maximum contribution is ${formatCurrency(monthly401kLimit)} monthly`);
            return;
          }
          if (id === 'traditional_ira' && numValue > monthlyIraLimit) {
            alert(`Traditional IRA maximum contribution is ${formatCurrency(monthlyIraLimit)} monthly`);
            return;
          }
          if (id === 'roth_401k' && numValue > monthly401kLimit) {
            alert(`Roth 401(k) maximum contribution is ${formatCurrency(monthly401kLimit)} monthly`);
            return;
          }
          if (id === 'roth_ira' && numValue > monthlyIraLimit) {
            alert(`Roth IRA maximum contribution is ${formatCurrency(monthlyIraLimit)} monthly`);
            return;
          }
        }
        
        // Store as string to preserve decimal input exactly (e.g., "450.59")
        setUserInputs(prev => ({ ...prev, [id]: numericValue }));
        // If this is a retirement plan input, update context too
        if (id.startsWith('retirement_')) {
          setRetirementInputs(prev => ({ ...prev, [id]: numericValue }));
        }
        // Map Week 1 retirement field names to retirement context
        if (id === 'roth_401k') {
          setRetirementInputs(prev => ({ ...prev, retirement_roth_401k: numericValue }));
        }
        if (id === 'roth_ira') {
          setRetirementInputs(prev => ({ ...prev, retirement_roth_ira: numericValue }));
        }
        // If this is a pre-tax expense item, update context too
        if (['health_insurance', 'life_insurance', 'disability_insurance', 'traditional_401k', 'traditional_ira'].includes(id)) {
          setUserPreTaxInputs(prev => ({ ...prev, [id]: numericValue }));
        }
    };
    
    const handleTopInputChange = (id, value) => {
        // Data validation for top inputs
        if (id === 'preTaxIncome') {
          // Remove $, %, and comma symbols, then only allow numbers and at most one decimal point
          const cleanValue = value.replace(/[$%,]/g, '');
          const sanitized = cleanValue.replace(/[^0-9.]/g, '');
          
          // Allow empty string for clearing the field
          if (sanitized === '') {
            setTopInputs(prev => ({ ...prev, [id]: '' }));
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
            setTopInputs(prev => ({ ...prev, [id]: numericValue }));
            return;
          }
          
          // Data validation
          const numValue = parseFloat(numericValue);
          if (numericValue && numericValue !== '.' && !isNaN(numValue)) {
            if (numValue <= 0) {
              alert('Pre-tax income must be a positive number');
              return;
            }
          }
          
          // Store as string to preserve decimal input exactly (e.g., "1000000.59")
          // Format with commas for display, but keep raw value for editing
          setTopInputs(prev => ({ ...prev, [id]: numericValue }));
          return;
        }
        setTopInputs(prev => ({ ...prev, [id]: value }));
    };
    
    // Note: handleDeductionChange removed as deductionChoices is not available in current context

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

    // Calculate monthly pre-tax income for formula calculations
    const monthlyPreTaxIncome = parseFloat(topInputs.preTaxIncome || 0) / 12;

    // Calculate monthly after-tax income for After-Tax Expense Items
    const monthlyAfterTaxIncome = summaryCalculations.suggestedAfterTaxIncome / 12;
    
    // Debug After-Tax Retirement Contributions calculations
    React.useEffect(() => {
      console.log('=== AFTER-TAX RETIREMENT CONTRIBUTIONS DEBUG ===', new Date().toISOString());
      console.log('preTaxIncome:', topInputs.preTaxIncome);
      console.log('suggestedAfterTaxIncome:', summaryCalculations.suggestedAfterTaxIncome);
      console.log('monthlyAfterTaxIncome:', monthlyAfterTaxIncome);
      
      // Test the calculation functions directly
      const testRoth401k = calculateRecommendedAmount({ id: 'roth_401k' });
      const testRothIRA = calculateRecommendedAmount({ id: 'roth_ira' });
      const testRoth401kPercent = calculateRecommendedPercent({ id: 'roth_401k' });
      const testRothIRAPercent = calculateRecommendedPercent({ id: 'roth_ira' });

      console.log('Direct function calls:');
      console.log('Roth 401k Amount:', testRoth401k);
      console.log('Roth IRA Amount:', testRothIRA);
      console.log('Roth 401k Percentage:', testRoth401kPercent);
      console.log('Roth IRA Percentage:', testRothIRAPercent);
    }, [topInputs.preTaxIncome, monthlyAfterTaxIncome, summaryCalculations.suggestedAfterTaxIncome]);

    // Helper function to calculate other percentages for Down Payment and Car calculations
    const calculateOtherPercentages = () => {
      // This calculates the total percentage used by other sections
      // Based on Excel formula: (1-(I50+I54+I82+I104+I122+I138+I150+I172+I198))
      // Where I50 = Retirement Contributions Total, I54 = Emergency Fund, etc.
      
      // Calculate actual percentages from our current calculations
      const retirementPercent = calculateRecommendedPercent({ id: 'roth_401k' }) + calculateRecommendedPercent({ id: 'roth_ira' });
      const emergencyFundPercent = calculateRecommendedPercent({ id: 'emergency_fund' });
      
      // Debt Payments - these are user input only, so their percentage is 0 for recommended
      const debtPaymentsPercent = 0; // I82 in Excel
      
      // Housing - calculate actual percentage based on housingCosts selection
      let housingTotalPercent = 0;
      if (topInputs.housingCosts === 'Low') housingTotalPercent = 0.30; // 30%
      else if (topInputs.housingCosts === 'Medium') housingTotalPercent = 0.35; // 35%
      else if (topInputs.housingCosts === 'High') housingTotalPercent = 0.40; // 40%
      
      const housingPercent = housingTotalPercent;
      
      // Transportation - calculate actual percentage
      const transportationPercent = calculateRecommendedPercent({ id: 'car_payment' }) + 
        calculateRecommendedPercent({ id: 'gasoline_fuel' }) + 
        calculateRecommendedPercent({ id: 'car_maintenance' }) + 
        calculateRecommendedPercent({ id: 'parking_fees' }) + 
        calculateRecommendedPercent({ id: 'rideshare' }) + 
        calculateRecommendedPercent({ id: 'public_transit' }) + 
        calculateRecommendedPercent({ id: 'transportation_miscellaneous' });
      
      // Insurance/Health - calculate actual percentage
      const insuranceHealthPercent = calculateRecommendedPercent({ id: 'auto_insurance' }) + 
        calculateRecommendedPercent({ id: 'renters_insurance' }) + 
        calculateRecommendedPercent({ id: 'otc_medications' }) + 
        calculateRecommendedPercent({ id: 'mental_health' }) + 
        calculateRecommendedPercent({ id: 'physical_health' }) + 
        calculateRecommendedPercent({ id: 'insurance_miscellaneous' });
      
      // Food - calculate actual percentage
      const foodPercent = calculateRecommendedPercent({ id: 'groceries' }) + 
        calculateRecommendedPercent({ id: 'dining_out' }) + 
        calculateRecommendedPercent({ id: 'takeout' }) + 
        calculateRecommendedPercent({ id: 'food_miscellaneous' });
      
      // Lifestyle & Entertainment - calculate actual percentage
      const lifestyleEntertainmentPercent = calculateRecommendedPercent({ id: 'subscriptions' }) + 
        calculateRecommendedPercent({ id: 'hobbies' }) + 
        calculateRecommendedPercent({ id: 'travel_vacation' }) + 
        calculateRecommendedPercent({ id: 'gifts' }) + 
        calculateRecommendedPercent({ id: 'clothing' }) + 
        calculateRecommendedPercent({ id: 'haircuts_salon' }) + 
        calculateRecommendedPercent({ id: 'personal_care' }) + 
        calculateRecommendedPercent({ id: 'events' }) + 
        calculateRecommendedPercent({ id: 'lifestyle_miscellaneous' });
      
      // Charity - calculate actual percentage
      const charityPercent = calculateRecommendedPercent({ id: 'charity' });
      
      return retirementPercent + emergencyFundPercent + debtPaymentsPercent + housingPercent + transportationPercent + insuranceHealthPercent + foodPercent + lifestyleEntertainmentPercent + charityPercent;
    };

    // Helper function to calculate Down Payment percentage
    const calculateDownPaymentPercent = () => {
      const otherPercentages = calculateOtherPercentages();
      const remainingPercentage = Math.max(0, 1 - otherPercentages);
      return remainingPercentage * 0.7; // 70% of remaining
    };

    // Helper function to calculate Car percentage
    const calculateCarPercent = () => {
      const otherPercentages = calculateOtherPercentages();
      const remainingPercentage = Math.max(0, 1 - otherPercentages);
      return remainingPercentage * 0.3; // 30% of remaining
    };

    // Function to calculate recommended amount based on Excel formulas
    const calculateRecommendedAmount = (item) => {
      // For After-Tax items, use monthly after-tax income as the base
      if (['roth_401k', 'roth_ira', 'rent', 'electricity', 'gas', 'water', 'sewer_trash', 'phone', 'internet', 'housing_miscellaneous', 'car_payment', 'gasoline_fuel', 'car_maintenance', 'parking_fees', 'rideshare', 'public_transit', 'transportation_miscellaneous', 'auto_insurance', 'renters_insurance', 'otc_medications', 'mental_health', 'physical_health', 'insurance_miscellaneous', 'groceries', 'dining_out', 'takeout', 'food_miscellaneous', 'subscriptions', 'hobbies', 'travel_vacation', 'gifts', 'clothing', 'haircuts_salon', 'personal_care', 'events', 'lifestyle_miscellaneous', 'student_loans', 'credit_card_payments', 'personal_loans', 'miscellaneous_debt', 'charity', 'emergency_fund', 'down_payment', 'car', 'wedding', 'advanced_degree', 'vacation', 'miscellaneous'].includes(item.id) || item.id.startsWith('user_input_')) {
        if (monthlyAfterTaxIncome <= 0) return 0;
        
        if (item.id === 'roth_401k') {
          // 5% of monthly after-tax income, capped at the monthly 401(k)
          // limit (Assumptions table, annual limit / 12).
          return Math.min(monthlyAfterTaxIncome * 0.05, monthly401kLimit);
        }
        if (item.id === 'roth_ira') {
          // Only contribute to Roth IRA if Roth 401k is at its maximum
          const roth401kAmount = Math.min(monthlyAfterTaxIncome * 0.05, monthly401kLimit);
          if (roth401kAmount === monthly401kLimit) {
            // Calculate Roth 401k percentage first
            const roth401kPercent = roth401kAmount / monthlyAfterTaxIncome;
            // Then calculate Roth IRA: 5% total - Roth 401k percentage, capped at the monthly IRA limit
            return Math.min(monthlyAfterTaxIncome * (0.05 - roth401kPercent), monthlyIraLimit);
          }
          return 0;
        }
        // Housing - Excel formulas
        if (['rent', 'electricity', 'gas', 'water', 'sewer_trash', 'phone', 'internet', 'housing_miscellaneous'].includes(item.id)) {
          if (item.id === 'rent') {
            // Excel: =I86*'Week 1 - Budgeting'!G40
            // The total housing percentage is dynamic based on housingCosts selection
            let housingTotalPercent = 0;
            if (topInputs.housingCosts === 'Low') housingTotalPercent = 0.30; // 30%
            else if (topInputs.housingCosts === 'Medium') housingTotalPercent = 0.35; // 35%
            else if (topInputs.housingCosts === 'High') housingTotalPercent = 0.40; // 40%
            
            // Calculate total fixed utilities cost
            const utilitiesTotal = 125 + 25 + 60 + 25 + 120 + 65 + 0; // electricity + gas + water + sewer/trash + phone + internet + miscellaneous
            const utilitiesPercent = utilitiesTotal / monthlyAfterTaxIncome;
            
            // Rent should be the remaining percentage after utilities
            const rentPercent = Math.max(0, housingTotalPercent - utilitiesPercent);
            return monthlyAfterTaxIncome * rentPercent;
          }
          if (item.id === 'electricity') return 125; // Fixed value from Excel
          if (item.id === 'gas') return 25; // Fixed value from Excel
          if (item.id === 'water') return 60; // Fixed value from Excel
          if (item.id === 'sewer_trash') return 25; // Fixed value from Excel
          if (item.id === 'phone') return 120; // Fixed value from Excel
          if (item.id === 'internet') return 65; // Fixed value from Excel
          if (item.id === 'housing_miscellaneous') return 0; // Fixed value from Excel
        }
        
        // Transportation - Excel formulas
        if (['car_payment', 'gasoline_fuel', 'car_maintenance', 'parking_fees', 'rideshare', 'public_transit', 'transportation_miscellaneous'].includes(item.id)) {
          if (item.id === 'car_payment') return 250; // Fixed value from Excel
          if (item.id === 'gasoline_fuel') return 80; // Fixed value from Excel
          if (item.id === 'car_maintenance') return 120; // Fixed value from Excel
          if (item.id === 'parking_fees') return 120; // Fixed value from Excel
          if (item.id === 'rideshare') return 60; // Fixed value from Excel
          if (item.id === 'public_transit') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.0025,50)
            return Math.min(monthlyAfterTaxIncome * 0.0025, 50);
          }
          if (item.id === 'transportation_miscellaneous') return 0; // Fixed value from Excel
        }
        
        // Insurance/Health - Excel formulas (fixed values)
        if (['auto_insurance', 'renters_insurance', 'otc_medications', 'mental_health', 'physical_health', 'insurance_miscellaneous'].includes(item.id)) {
          if (item.id === 'auto_insurance') return 125;
          if (item.id === 'renters_insurance') return 50;
          if (item.id === 'otc_medications') return 25;
          if (item.id === 'mental_health') return 65;
          if (item.id === 'physical_health') return 120;
          if (item.id === 'insurance_miscellaneous') return 0;
        }
        
        // Food - Excel formulas with MIN functions
        if (['groceries', 'dining_out', 'takeout', 'food_miscellaneous'].includes(item.id)) {
          if (item.id === 'groceries') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.07,1250)
            return Math.min(monthlyAfterTaxIncome * 0.07, 1250);
          }
          if (item.id === 'dining_out') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.03,1500)
            return Math.min(monthlyAfterTaxIncome * 0.03, 1500);
          }
          if (item.id === 'takeout') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.0125,500)
            return Math.min(monthlyAfterTaxIncome * 0.0125, 500);
          }
          if (item.id === 'food_miscellaneous') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.005,100)
            return Math.min(monthlyAfterTaxIncome * 0.005, 100);
          }
        }
        
        // Lifestyle & Entertainment - Excel formulas
        if (['subscriptions', 'hobbies', 'travel_vacation', 'gifts', 'clothing', 'haircuts_salon', 'personal_care', 'events', 'lifestyle_miscellaneous'].includes(item.id)) {
          if (item.id === 'subscriptions') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.01,200)
            return Math.min(monthlyAfterTaxIncome * 0.01, 200);
          }
          if (item.id === 'hobbies') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.01,1000)
            return Math.min(monthlyAfterTaxIncome * 0.01, 1000);
          }
          if (item.id === 'travel_vacation') {
            // Excel: ='Week 1 - Budgeting'!$G$40*0.025
            return monthlyAfterTaxIncome * 0.025;
          }
          if (item.id === 'gifts') {
            // Excel: ='Week 1 - Budgeting'!$G$40*0.01
            return monthlyAfterTaxIncome * 0.01;
          }
          if (item.id === 'clothing') {
            // Excel: ='Week 1 - Budgeting'!$G$40*0.01
            return monthlyAfterTaxIncome * 0.01;
          }
          if (item.id === 'haircuts_salon') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.005,500)
            return Math.min(monthlyAfterTaxIncome * 0.005, 500);
          }
          if (item.id === 'personal_care') {
            // Excel: ='Week 1 - Budgeting'!$G$40*0.01
            return monthlyAfterTaxIncome * 0.01;
          }
          if (item.id === 'events') {
            // Excel: ='Week 1 - Budgeting'!$G$40*0.01
            return monthlyAfterTaxIncome * 0.01;
          }
          if (item.id === 'lifestyle_miscellaneous') {
            // Excel: =MIN('Week 1 - Budgeting'!$G$40*0.05,100)
            return Math.min(monthlyAfterTaxIncome * 0.05, 100);
          }
        }
        
        // Debt Payments - these are user input only, no recommended amounts
      if (['student_loans', 'credit_card_payments', 'personal_loans', 'miscellaneous_debt'].includes(item.id)) {
          return 0; // No recommended amounts for debt payments
        }
        
        // Charity - Excel formula
        if (['charity'].includes(item.id)) {
          // Excel: ='Week 1 - Budgeting'!$G$40*0.01
          return monthlyAfterTaxIncome * 0.01;
        }
        
        // User Input items - these are user input only, no recommended amounts
        if (item.id.startsWith('user_input_')) {
          return 0; // No recommended amounts for user input items
        }
        
        if (item.id === 'emergency_fund') {
          // Excel: ='Week 1 - Budgeting'!$G$40*0.02
          // 2% of monthly after-tax income
          return monthlyAfterTaxIncome * 0.02;
        }
        if (item.id === 'down_payment') {
          // Excel: =I58*'Week 1 - Budgeting'!$G$40
          // Where I58 = (1-(I50+I54+I82+I104+I122+I138+I150+I172+I198))*0.7
          const downPaymentPercent = calculateDownPaymentPercent();
          return monthlyAfterTaxIncome * downPaymentPercent;
        }
        if (item.id === 'car') {
          // Excel: =I60*'Week 1 - Budgeting'!$G$40
          // Where I60 = (1-(I50+I54+I82+I104+I122+I138+I150+I172+I198))*0.3
          const carPercent = calculateCarPercent();
          return monthlyAfterTaxIncome * carPercent;
        }
        // Wedding, Advanced Degree, Vacation, Miscellaneous are 0 in Excel
        if (['wedding', 'advanced_degree', 'vacation', 'miscellaneous'].includes(item.id)) {
          return 0;
        }
        return 0;
      }
      
      // For Pre-Tax items, use monthly pre-tax income as the base
      if (monthlyPreTaxIncome <= 0) return 0;
      
      // Pre-Tax Insurance section - use static values from Excel
      if (['health_insurance', 'life_insurance', 'disability_insurance'].includes(item.id)) {
        // Health Insurance: $150/month (1.8% of $8,333.33)
        if (item.id === 'health_insurance') {
          return 150.00;
        }
        // Life and Disability Insurance: $0 (not recommended)
        return 0;
      }
      
      // Pre-Tax Retirement section - use static values from Excel
      if (['traditional_401k', 'traditional_ira'].includes(item.id)) {
        return 0; // Not recommended in Pre-Tax section
      }
      
      // For other items, use static recommended amount if available
      return item.recommendedAmount || 0;
    };

    // Function to calculate recommended percentage based on Excel formulas
    const calculateRecommendedPercent = (item) => {
      // For After-Tax items, use monthly after-tax income as the base (Excel: =G46/'Week 1 - Budgeting'!$G$40)
      if (['roth_401k', 'roth_ira', 'rent', 'electricity', 'gas', 'water', 'sewer_trash', 'phone', 'internet', 'housing_miscellaneous', 'car_payment', 'gasoline_fuel', 'car_maintenance', 'parking_fees', 'rideshare', 'public_transit', 'transportation_miscellaneous', 'auto_insurance', 'renters_insurance', 'otc_medications', 'mental_health', 'physical_health', 'insurance_miscellaneous', 'groceries', 'dining_out', 'takeout', 'food_miscellaneous', 'subscriptions', 'hobbies', 'travel_vacation', 'gifts', 'clothing', 'haircuts_salon', 'personal_care', 'events', 'lifestyle_miscellaneous', 'student_loans', 'credit_card_payments', 'personal_loans', 'miscellaneous_debt', 'charity', 'emergency_fund', 'down_payment', 'car', 'wedding', 'advanced_degree', 'vacation', 'miscellaneous'].includes(item.id) || item.id.startsWith('user_input_')) {
        if (monthlyAfterTaxIncome > 0) {
          // For Down Payment and Car, use the helper functions to get the exact percentage
          if (item.id === 'down_payment') {
            return calculateDownPaymentPercent();
          }
          if (item.id === 'car') {
            return calculateCarPercent();
          }
          // For other items, calculate from amount
      const recommendedAmount = calculateRecommendedAmount(item);
          return recommendedAmount / monthlyAfterTaxIncome;
        }
        return 0;
      }
      
      // For Pre-Tax items, use monthly pre-tax income as the base
      if (monthlyPreTaxIncome > 0) {
      const recommendedAmount = calculateRecommendedAmount(item);
        return recommendedAmount / monthlyPreTaxIncome;
      }
      return 0;
    };

    // 1. Section expanded state
    const initialExpanded = Object.fromEntries(budgetConfig.sections.map(s => [s.title, true]));
    const [expandedSections, setExpandedSections] = useState(initialExpanded);
    const toggleSection = (title) => setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));

    // 1.5. Subsection expanded state
    const initialSubsectionExpanded = {};
    budgetConfig.sections.forEach(section => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach(subsection => {
          if (subsection.title) {
            initialSubsectionExpanded[subsection.title] = true;
          }
        });
      }
    });
    const [expandedSubsections, setExpandedSubsections] = useState(initialSubsectionExpanded);
    const toggleSubsection = (title) => setExpandedSubsections(prev => ({ ...prev, [title]: !prev[title] }));

  // 2. Dynamic custom expense items state for Other Miscellaneous Expenses
  const [customExpenseItems, setCustomExpenseItems] = useState([]);
  const [customExpenseNames, setCustomExpenseNames] = useState({});
  const [nextItemId, setNextItemId] = useState(1);

  // Add a new custom expense item
  const addCustomExpenseItem = () => {
    const newId = `user_input_${nextItemId}`;
    setCustomExpenseItems(prev => [...prev, { id: newId, label: 'Enter your custom expense name', explanation: 'Additional description' }]);
    setCustomExpenseNames(prev => ({
      ...prev,
      [newId]: '',
      [newId + '_label']: ''
    }));
    setUserInputs(prev => ({ ...prev, [newId]: '' }));
    setNextItemId(prev => prev + 1);
  };

  // Remove a custom expense item
  const removeCustomExpenseItem = (itemId) => {
    setCustomExpenseItems(prev => prev.filter(item => item.id !== itemId));
    setCustomExpenseNames(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      delete updated[itemId + '_label'];
      return updated;
    });
    setUserInputs(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleExpenseNameChange = (itemId, newName) => {
    setCustomExpenseNames(prev => ({
      ...prev,
      [itemId]: newName
    }));
  };


    // Debug function to show all calculated values
    const debugCalculations = () => {
        const preTaxIncome = parseFloat(topInputs.preTaxIncome || 0);
        const monthlyPreTaxIncome = preTaxIncome / 12;
        const standardDeduction = assumptions.scalars.std_deduction_single;
        
        // Pre-Tax Expenses
        const suggestedPreTaxExpenses = 150 * 12; // $1,800
        const userPreTaxExpenses = (
            (parseFloat(userPreTaxInputs.health_insurance) || 0) +
            (parseFloat(userPreTaxInputs.life_insurance) || 0) +
            (parseFloat(userPreTaxInputs.disability_insurance) || 0) +
            (parseFloat(userPreTaxInputs.traditional_401k) || 0) +
            (parseFloat(userPreTaxInputs.traditional_ira) || 0)
        ) * 12;
        
        // Taxable Income
        const suggestedTaxableIncome = preTaxIncome - standardDeduction - suggestedPreTaxExpenses;
        const userTaxableIncome = preTaxIncome - standardDeduction - userPreTaxExpenses;
        
        console.log('=== DEBUG CALCULATIONS FOR $1,000,000 ===');
        console.log('Pre-Tax Income:', preTaxIncome);
        console.log('Monthly Pre-Tax Income:', monthlyPreTaxIncome);
        console.log('Standard Deduction:', standardDeduction);
        console.log('Suggested Pre-Tax Expenses:', suggestedPreTaxExpenses);
        console.log('User Pre-Tax Expenses:', userPreTaxExpenses);
        console.log('Suggested Taxable Income:', suggestedTaxableIncome);
        console.log('User Taxable Income:', userTaxableIncome);
        console.log('Summary Calculations:', summaryCalculations);
        console.log('==========================================');
    };

    // Function to calculate total expenses (sum of all Budgeted Spend values - user inputs)
    const calculateTotalExpenses = () => {
      // Sum all user inputs from Budgeted Spend column
      let total = 0;
      
      // Sum all user input values
      Object.values(userInputs).forEach(value => {
        const numValue = parseFloat(value) || 0;
        total += numValue;
      });
      
      return total;
    };

    // Function to calculate budget checker (E40 - E200)
    const calculateBudgetChecker = () => {
      const monthlyIncome = summaryCalculations.userAfterTaxIncome / 12; // E40 - User's monthly after-tax income
      const totalExpenses = calculateTotalExpenses(); // E200 (sum of all Budgeted Spend values)
      const difference = monthlyIncome - totalExpenses;
      
      if (difference > 0) {
        return `Under Budget by ${formatCurrency(difference)}`;
      } else if (difference < 0) {
        return `Over Budget by ${formatCurrency(Math.abs(difference))}`;
      } else {
        return `Exactly on Budget`;
      }
    };

    // Auto-load data on component mount
    React.useEffect(() => {
        const savedData = localStorage.getItem('week1_data');
        if (savedData) {
            try {
                const budgetData = JSON.parse(savedData);
                
                // Load top inputs
                if (budgetData.topInputs) {
                    setTopInputs(budgetData.topInputs);
                }
                // Load user inputs
                if (budgetData.userInputs) {
                    setUserInputs(budgetData.userInputs);
                }
                // Load custom expense names
                if (budgetData.customExpenseNames) {
                    setCustomExpenseNames(budgetData.customExpenseNames);
                }
                // Load custom expense items
                if (budgetData.customExpenseItems) {
                    setCustomExpenseItems(budgetData.customExpenseItems);
                }
                // Load next item ID
                if (budgetData.nextItemId) {
                    setNextItemId(budgetData.nextItemId);
                }
                // Load section states
                if (budgetData.expandedSections) {
                    setExpandedSections(budgetData.expandedSections);
                }
            } catch (error) {
                console.error('Error loading Week 1 data:', error);
            }
        }
    }, []); // Only run on mount

    // Auto-save with debounce (500ms delay)
    React.useEffect(() => {
        const saveTimer = setTimeout(() => {
            autoSaveBudget();
        }, 500); // Wait 500ms after last change before saving

        return () => clearTimeout(saveTimer);
    }, [topInputs, userInputs, customExpenseNames, customExpenseItems, nextItemId, expandedSections]);

    // Call debug function when component mounts or inputs change
    React.useEffect(() => {
        if (topInputs.preTaxIncome === '1000000') {
            debugCalculations();
        }
        // Debug userInputs to see what's in there
        console.log('userInputs state:', userInputs);
        Object.entries(userInputs).forEach(([key, value]) => {
          if (value && value !== '') {
            console.log(`userInputs[${key}] = "${value}"`);
          }
        });
    }, [topInputs.preTaxIncome, userPreTaxInputs, summaryCalculations, userInputs]);

    return (
        <div style={styles.container}>
            <style>{`
              .week1-user-input-card,
              .week1-user-input-note,
              .week1-user-input-row,
              .week1-user-input-summary,
              .week1-user-input-control {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .week1-user-input-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12), 0 6px 18px rgba(15, 23, 42, 0.08);
              }
              .week1-user-input-note:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(13, 26, 75, 0.12) !important;
                border-color: rgba(13, 26, 75, 0.25) !important;
                background-color: rgba(13, 26, 75, 0.08) !important;
              }
              .week1-user-input-row:hover {
                transform: translateX(3px);
                background-color: rgba(248, 250, 252, 0.7);
                border-radius: 8px;
              }
              .week1-user-input-control:hover:not(:focus) {
                border-color: #9ca3af !important;
                background-color: #ffffff !important;
                box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(13, 26, 75, 0.05), inset 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
                transform: translateY(-2px) scale(1.01) !important;
              }
              .week1-user-input-control:focus {
                border-color: #0d1a4b !important;
                background-color: #fffef0 !important;
                box-shadow: 0 0 0 3px rgba(13, 26, 75, 0.12) !important;
                transform: translateY(-1px) scale(1.01) !important;
                outline: none;
              }
              .week1-user-input-summary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 22px rgba(22, 101, 52, 0.2);
                border-color: rgba(22, 101, 52, 0.35) !important;
              }
              @media (prefers-reduced-motion: reduce) {
                .week1-user-input-card,
                .week1-user-input-note,
                .week1-user-input-row,
                .week1-user-input-summary,
                .week1-user-input-control {
                  transition: none !important;
                  transform: none !important;
                }
              }
            `}</style>
        
            {/* Section Container - matching Week 3 layered design */}
            <div style={styles.sectionContainer}>
            {/* Enhanced Header */}
            <div style={styles.enhancedHeader}>
              <span style={{ fontSize: '26px', letterSpacing: '-0.02em' }}>Budget Planning</span>
            </div>

            {/* Budget Status Banner - combines the former floating "Budget Status"
                indicator and the bottom "Budget Summary" card into a single
                top banner: total expenses, over/under status, and utilization. */}
            {(() => {
              const monthlyIncome = summaryCalculations.userAfterTaxIncome / 12;
              const totalExpenses = calculateTotalExpenses();
              const difference = monthlyIncome - totalExpenses;
              const utilizationPercent = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;
              const isUnder = difference > 0;
              const isOver = difference < 0;
              const statusText = calculateBudgetChecker();

              return (
                <div style={{
                  width: '100%',
                  maxWidth: '1200px',
                  margin: '0 auto 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px 32px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), 0 4px 16px 0 rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.3fr',
                  gap: '32px',
                  alignItems: 'center',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{fontSize: '22px', fontWeight: '700', color: '#16a34a', marginBottom: '4px'}}>
                      <AnimatedNumber value={totalExpenses} formatCurrency={true} formatCurrencyFn={formatCurrency} />
                    </div>
                    <div style={{fontSize: '13px', color: '#6b7280', fontWeight: '500'}}>Total Expenses</div>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    borderLeft: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRight: '1px solid rgba(229, 231, 235, 0.6)',
                    padding: '0 16px',
                  }}>
                    <div style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: isUnder ? '#16a34a' : isOver ? '#dc2626' : '#0d1a4b',
                      marginBottom: '4px',
                    }}>
                      {isUnder ? `+${formatCurrency(difference)}` : isOver ? `-${formatCurrency(Math.abs(difference))}` : '$0.00'}
                    </div>
                    <div style={{fontSize: '13px', color: '#6b7280', fontWeight: '500', marginBottom: '8px'}}>Budget Status</div>
                    <StatusBadge
                      status={statusText.replace('Under Budget by $', '').replace('Over Budget by $', '').replace('Exactly on Budget', 'On Track')}
                      variant={isUnder ? 'success' : isOver ? 'error' : 'info'}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{fontSize: '13px', color: '#6b7280', fontWeight: '500'}}>Budget Utilization</span>
                      <span style={{fontSize: '18px', fontWeight: '700', color: utilizationPercent > 100 ? '#dc2626' : '#111827'}}>
                        <AnimatedNumber value={utilizationPercent} />%
                      </span>
                    </div>
                    <ProgressBar
                      percentage={utilizationPercent}
                      color={utilizationPercent > 100 ? '#dc2626' : utilizationPercent > 90 ? '#ca8a04' : '#16a34a'}
                      height="10px"
                      showLabel={false}
                    />
                  </div>
                </div>
              );
            })()}

            <div
              className="week1-user-input-card"
              style={{
                width: '450px',
                marginBottom: '20px',
                padding: '8px 10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.55)',
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              }}
            >
            <h3 style={styles.header}>User Inputted Data</h3>
            <div
              className="week1-user-input-note"
              style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px', 
              color: '#0d1a4b', 
              marginBottom: '16px', 
              fontStyle: 'italic', 
              padding: '12px 16px', 
              backgroundColor: 'rgba(13, 26, 75, 0.05)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '10px', 
              border: '1px solid rgba(13, 26, 75, 0.15)',
              boxShadow: '0 2px 8px 0 rgba(13, 26, 75, 0.1)'
            }}>
                <InfoIcon />
                <div>Taxes calculated based on single taxpayer filing status</div>
            </div>
            {userInputFields.map(field => (
            <div key={field.id} className="week1-user-input-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', alignItems: 'center', padding: '4px 8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{field.label}</label>
                {field.id === 'location' ? (
                  <select
                    className="week1-user-input-control"
                    style={styles.selectInput}
                    value={topInputs[field.id]}
                    onChange={e => handleTopInputChange(field.id, e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectInputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, styles.selectInput)}
                  >
                    {Object.keys(assumptions.stateBrackets).sort().map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                ) : field.id === 'residenceInNYC' ? (
                  <select
                    className="week1-user-input-control"
                    style={styles.selectInput}
                    value={topInputs[field.id]}
                    onChange={e => handleTopInputChange(field.id, e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectInputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, styles.selectInput)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : field.id === 'housingCosts' ? (
                  <select
                    className="week1-user-input-control"
                    style={styles.selectInput}
                    value={topInputs[field.id]}
                    onChange={e => handleTopInputChange(field.id, e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.selectInputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, styles.selectInput)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                ) : (
                  <input
                    className="week1-user-input-control"
                    style={styles.topInput}
                    type="text"
                    value={field.id === 'preTaxIncome' && topInputs[field.id] ? formatNumberForInput(topInputs[field.id]) : (topInputs[field.id] || '')}
                    onChange={e => handleTopInputChange(field.id, e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, styles.topInputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, styles.topInput)}
                    placeholder="Enter amount"
                  />
                )}
            </div>
            ))}
            
            {/* Monthly Pre-Tax Income - Row 14 equivalent */}
            <div className="week1-user-input-summary" style={{...styles.afterTaxRow, marginTop: '10px', backgroundColor: '#e8f5e9'}}>
              <span>Monthly Pre-Tax Income</span>
              <span>{formatCurrency(parseFloat(topInputs.preTaxIncome || 0) / 12)}</span>
            </div>
            
            {/* Note: Standard Deduction Choices section removed as deductionChoices is not available in current context */}
        </div>
        
        <div style={{width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center'}}>
        <table style={styles.table}>
            <thead>
            <tr>
                <th style={{
                  ...styles.th, 
                  ...styles.thExpense,
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px',
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}>Expense Items</th>
                <th style={{
                  ...styles.th, 
                  ...styles.thBudgeted,
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}>Examples/Info</th>
                <th style={{
                  ...styles.th, 
                  ...styles.thRecommended,
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}>Budgeted Spend</th>
                <th style={{
                  ...styles.th, 
                  ...styles.thPercent,
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}>Recommended Spend $</th>
                <th style={{
                  ...styles.th, 
                  ...styles.thPercent,
                  borderTopRightRadius: '12px',
                  borderBottomRightRadius: '12px',
                  borderRight: 'none'
                }}>% of Monthly Income</th>
            </tr>
            </thead>
            <tbody>
              {budgetConfig.sections.map((section, sectionIndex) => {
                return (
                <React.Fragment key={section.title}>
                  {/* Section Divider - except for first section */}
                  {sectionIndex > 0 && (
                    <tr>
                      <td colSpan="5" style={{padding: '16px 0', border: 'none', backgroundColor: 'transparent'}}>
                        <div style={styles.sectionDivider}></div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{
                      ...styles.td, 
                      ...styles.sectionHeader, 
                      cursor: 'pointer',
                      borderTop: sectionIndex === 0 ? 'none' : '1px solid rgba(229, 231, 235, 0.4)',
                      marginTop: sectionIndex === 0 ? '0' : '8px'
                    }} colSpan="5"
                        onClick={() => toggleSection(section.title)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to bottom, rgba(243, 244, 246, 0.98) 0%, rgba(237, 242, 247, 0.95) 100%)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = styles.sectionHeader.background;
                          e.currentTarget.style.boxShadow = styles.sectionHeader.boxShadow;
                        }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1}}>
                          <span style={{
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: '#111827',
                            transition: 'transform 0.2s',
                            display: 'inline-block',
                            transform: expandedSections[section.title] ? 'rotate(90deg)' : 'rotate(0deg)'
                          }}>
                            ▶
                          </span>
                          <span style={{fontSize: '15px', fontWeight: '600', color: '#111827'}}>{section.title}</span>
                          {!expandedSections[section.title] && (() => {
                            // Calculate preview summary for collapsed sections
                            const allItems = section.items.flatMap(sub => sub.items || []);
                            const itemsWithValues = allItems.filter(item => item.id && (parseFloat(userInputs[item.id]) || 0) > 0);
                            const totalEntered = allItems
                              .filter(item => item.id)
                              .reduce((sum, item) => sum + (parseFloat(userInputs[item.id]) || 0), 0);
                            const totalRecommended = allItems
                              .filter(item => item.id)
                              .reduce((sum, item) => sum + calculateRecommendedAmount(item), 0);
                            
                            if (itemsWithValues.length > 0 || totalRecommended > 0) {
                              return (
                                <span style={{
                                  fontSize: '13px',
                                  color: '#6b7280',
                                  fontWeight: '500',
                                  marginLeft: '12px',
                                  padding: '4px 10px',
                                  backgroundColor: 'rgba(243, 244, 246, 0.6)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(229, 231, 235, 0.5)'
                                }}>
                                  {itemsWithValues.length} items • Entered: {formatCurrency(totalEntered)}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expandedSections[section.title] && (
                    <>
                      {section.items.map((subsection, subIndex) => (
                        <React.Fragment key={subsection.title}>
                          <tr>
                            <td
                              style={{
                                ...styles.td, 
                                ...styles.sectionHeader, 
                                paddingLeft: '32px', 
                                cursor: 'pointer',
                                background: 'linear-gradient(to bottom, rgba(247, 248, 250, 0.9) 0%, rgba(241, 245, 249, 0.85) 100%)',
                                borderTop: '1px solid rgba(229, 231, 235, 0.3)'
                              }}
                              colSpan="5"
                              onClick={() => toggleSubsection(subsection.title)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to bottom, rgba(241, 245, 249, 0.95) 0%, rgba(235, 241, 247, 0.9) 100%)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to bottom, rgba(247, 248, 250, 0.9) 0%, rgba(241, 245, 249, 0.85) 100%)';
                                e.currentTarget.style.boxShadow = styles.sectionHeader.boxShadow;
                              }}>
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                  <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#6b7280',
                                    transition: 'transform 0.2s',
                                    display: 'inline-block',
                                    transform: expandedSubsections[subsection.title] ? 'rotate(90deg)' : 'rotate(0deg)'
                                  }}>
                                    ▶
                                  </span>
                                  <span style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>
                                    {subsection.title}
                                  </span>
                                  {!expandedSubsections[subsection.title] && (() => {
                                    // Calculate preview for collapsed subsection
                                    const itemsToSum = subsection.title === 'Other Miscellaneous Expenses' 
                                      ? customExpenseItems 
                                      : subsection.items;
                                    const itemsWithValues = itemsToSum.filter(item => item.id && (parseFloat(userInputs[item.id]) || 0) > 0);
                                    const totalEntered = itemsToSum
                                      .filter(item => item.id)
                                      .reduce((sum, item) => sum + (parseFloat(userInputs[item.id]) || 0), 0);
                                    const totalRecommended = itemsToSum
                                      .filter(item => item.id)
                                      .reduce((sum, item) => sum + calculateRecommendedAmount(item), 0);
                                    
                                    if (itemsWithValues.length > 0 || totalRecommended > 0) {
                                      return (
                                        <span style={{
                                          fontSize: '12px',
                                          color: '#9ca3af',
                                          fontWeight: '500',
                                          marginLeft: '8px',
                                          padding: '3px 8px',
                                          backgroundColor: 'rgba(243, 244, 246, 0.5)',
                                          borderRadius: '4px'
                                        }}>
                                          {itemsWithValues.length} items • {formatCurrency(totalEntered)}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            </td>
                          </tr>
                          {expandedSubsections[subsection.title] && (() => {
                            // Use customExpenseItems for "Other Miscellaneous Expenses", otherwise use subsection.items
                            const itemsToRender = subsection.title === 'Other Miscellaneous Expenses' 
                              ? customExpenseItems 
                              : subsection.items;
                            
                            return itemsToRender.map((item, index) => {
                              if (item.type === 'subheader') {
                                return (
                                  <tr key={`${item.label}-${index}`}>
                                    <td style={{...styles.td, fontWeight: 'bold', paddingLeft: '40px'}}>{item.label}</td>
                                    <td style={styles.td}></td>
                                    <td style={styles.td}></td>
                                    <td style={styles.td}></td>
                                    <td style={styles.td}></td>
                                  </tr>
                                )
                              }
                              return (
                                <tr 
                                  key={item.id}
                                  style={{
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'default',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor;
                                    e.currentTarget.style.transform = styles.trHover.transform;
                                    e.currentTarget.style.boxShadow = styles.trHover.boxShadow;
                                    Array.from(e.currentTarget.children).forEach(td => {
                                      Object.assign(td.style, styles.tdHover);
                                    });
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    Array.from(e.currentTarget.children).forEach(td => {
                                      td.style.backgroundColor = styles.td.backgroundColor;
                                      td.style.backdropFilter = 'none';
                                      td.style.WebkitBackdropFilter = 'none';
                                      td.style.transform = 'translateX(0)';
                                      td.style.boxShadow = 'none';
                                    });
                                  }}
                                >
                                  <td style={{...styles.td, paddingLeft: '60px', textAlign: 'left', fontWeight: '500'}}>
                                    {item.id.startsWith('user_input_') ? (
                                      <input
                                        style={{
                                          ...styles.input,
                                          width: '100%',
                                          textAlign: 'left',
                                          backgroundColor: 'white',
                                        }}
                                        type="text"
                                        value={customExpenseNames[item.id] || ''}
                                        onChange={(e) => handleExpenseNameChange(item.id, e.target.value)}
                                        onFocus={(e) => {
                                          e.target.style.borderColor = '#0d1a4b';
                                          e.target.style.boxShadow = '0 0 0 2px rgba(13, 26, 75, 0.12)';
                                          e.target.style.backgroundColor = 'white';
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.borderColor = '#d1d5db';
                                          e.target.style.boxShadow = 'none';
                                          e.target.style.backgroundColor = 'white';
                                        }}
                                        placeholder="Enter expense name"
                                      />
                                    ) : (
                                      item.label
                                    )}
                                  </td>
                                  <td style={{...styles.td, textAlign: 'left', color: '#6b7280', fontSize: '13px'}}>
                                    {item.id.startsWith('user_input_') ? (
                                      <input
                                        style={{
                                          ...styles.input,
                                          width: '100%',
                                          textAlign: 'left',
                                          color: '#6b7280',
                                        }}
                                        type="text"
                                        value={customExpenseNames[item.id + '_label'] || ''}
                                        onChange={(e) => handleExpenseNameChange(item.id + '_label', e.target.value)}
                                        onFocus={(e) => {
                                          e.target.style.borderColor = '#0d1a4b';
                                          e.target.style.boxShadow = '0 0 0 2px rgba(13, 26, 75, 0.12)';
                                          e.target.style.backgroundColor = '#fffef0';
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.borderColor = '#d1d5db';
                                          e.target.style.boxShadow = 'none';
                                          e.target.style.backgroundColor = '#fffde7';
                                        }}
                                        placeholder="Additional description"
                                      />
                                    ) : (
                                      item.explanation
                                    )}
                                  </td>
                                  <td style={styles.td}>
                                    <div style={styles.inputCellContainer}>
                                      <input
                                        style={styles.input}
                                        type="text"
                                        value={userInputs[item.id] ? `$${formatNumberForInput(userInputs[item.id])}` : ''}
                                        onChange={(e) => handleUserInputChange(item.id, e.target.value)}
                                        onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                                        onBlur={(e) => Object.assign(e.target.style, styles.input)}
                                        placeholder="Enter amount"
                                        step="0.01"
                                      />
                                    </div>
                                  </td>
                                  <td style={{...styles.td, ...styles.readOnly, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px'}}>
                                    {(() => {
                                      const calculatedAmount = calculateRecommendedAmount(item);
                                      const userAmount = parseFloat(userInputs[item.id]) || 0;
                                      return calculatedAmount > 0 ? (
                                        <>
                                          <span>{formatCurrency(calculatedAmount)}</span>
                                        </>
                                      ) : '-';
                                    })()}
                                  </td>
                                  <td style={{...styles.td, ...styles.readOnly, position: 'relative'}}>
                                    {(() => {
                                      const calculatedPercent = calculateRecommendedPercent(item);
                                      return calculatedPercent > 0 ? formatPercent(calculatedPercent) : '-';
                                    })()}
                                    {item.id.startsWith('user_input_') && (
                                      <button
                                        onClick={() => removeCustomExpenseItem(item.id)}
                                        style={{
                                          position: 'absolute',
                                          right: '8px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          background: '#ef4444',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          width: '24px',
                                          height: '24px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '14px',
                                          fontWeight: 'bold',
                                          transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = '#dc2626';
                                          e.target.style.transform = 'translateY(-50%) scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = '#ef4444';
                                          e.target.style.transform = 'translateY(-50%) scale(1)';
                                        }}
                                        title="Remove expense"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )
                            });
                          })()}
                          {/* Add button for Other Miscellaneous Expenses */}
                          {expandedSubsections[subsection.title] && subsection.title === 'Other Miscellaneous Expenses' && (
                            <tr>
                              <td colSpan="5" style={{...styles.td, paddingLeft: '60px', borderTop: '1px solid #e5e7eb'}}>
                                <button
                                  onClick={addCustomExpenseItem}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    backgroundColor: '#0d1a4b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#1e3a8a';
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#0d1a4b';
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                                  }}
                                  onMouseDown={(e) => {
                                    // Keep the same color when clicked
                                    e.target.style.backgroundColor = '#1e3a8a';
                                  }}
                                  onMouseUp={(e) => {
                                    // Keep the same color when released
                                    e.target.style.backgroundColor = '#1e3a8a';
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = '#1e3a8a';
                                    e.target.style.outline = 'none';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = '#0d1a4b';
                                  }}
                                >
                                  <span style={{ fontSize: '18px', lineHeight: '1' }}>+</span>
                                  <span>Add Expense</span>
                                </button>
                              </td>
                            </tr>
                          )}
                          {subsection.note && (
                            <tr>
                              <td style={{...styles.td, fontStyle: 'italic', paddingLeft: '40px'}} colSpan="5">
                                {subsection.note}
                              </td>
                            </tr>
                          )}
                          {/* Subsection Total Row */}
                          {expandedSubsections[subsection.title] && (
                          <tr style={styles.totalRow}>
                            <td style={{...styles.td, fontWeight: 'bold', paddingLeft: '40px'}}>Total</td>
                            <td style={styles.td}></td>
                            <td style={styles.td}>
                              {(() => {
                                const itemsToSum = subsection.title === 'Other Miscellaneous Expenses'
                                  ? customExpenseItems
                                  : subsection.items;
                                const total = itemsToSum
                                  .filter(item => item.id)
                                  .reduce((sum, item) => sum + (parseFloat(userInputs[item.id]) || 0), 0);
                                return total > 0 ? formatCurrency(total) : '-';
                              })()}
                            </td>
                            <td style={styles.td}>
                              {(() => {
                                const itemsToSum = subsection.title === 'Other Miscellaneous Expenses'
                                  ? customExpenseItems
                                  : subsection.items;
                                const totalRecommended = itemsToSum
                                  .filter(item => item.id)
                                  .reduce((sum, item) => sum + calculateRecommendedAmount(item), 0);
                                return totalRecommended > 0 ? formatCurrency(totalRecommended) : '-';
                              })()}
                            </td>
                            <td style={{...styles.td, ...styles.readOnly}}>
                              {(() => {
                                const itemsToSum = subsection.title === 'Other Miscellaneous Expenses' 
                                  ? customExpenseItems 
                                  : subsection.items;
                                const totalPercent = itemsToSum
                                  .filter(item => item.id)
                                  .reduce((sum, item) => sum + calculateRecommendedPercent(item), 0);
                                return totalPercent > 0 ? formatPercent(totalPercent) : '-';
                              })()}
                            </td>
                          </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                  
                  {/* Monthly Income (After Taxes & Pre-Tax Expense Items) - Row 40 equivalent */}
                  {section.title === 'Pre-Tax Expense Items' && (
                    <>
                      <tr style={{height: '20px'}}>
                        <td colSpan="5" style={{border: 'none'}}></td>
                      </tr>
                      <tr style={{backgroundColor: 'rgba(240, 253, 244, 0.6)'}}>
                        <td style={{...styles.td, fontWeight: 'bold', backgroundColor: 'rgba(240, 253, 244, 0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'}}>
                          Monthly Income (After Taxes & Pre-Tax Expense Items)
                        </td>
                        <td style={{...styles.td, backgroundColor: 'rgba(240, 253, 244, 0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'}}></td>
                        <td style={{...styles.td, backgroundColor: 'rgba(240, 253, 244, 0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'}}>
                          {formatCurrency(summaryCalculations.userAfterTaxIncome / 12)}
                        </td>
                        <td style={{...styles.td, backgroundColor: 'rgba(240, 253, 244, 0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'}}>
                          {formatCurrency(summaryCalculations.suggestedAfterTaxIncome / 12)}
                        </td>
                        <td style={{...styles.td, backgroundColor: 'rgba(240, 253, 244, 0.6)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)'}}></td>
                      </tr>
                    </>
                  )}
                  
                  {/* Spacer row for visual separation between sections */}
                  {sectionIndex < budgetConfig.sections.length - 1 && (
                    <tr style={{height: '20px'}}>
                        <td colSpan="5" style={{border: 'none'}}></td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
            </tbody>
        </table>
        </div>
        
        {/* Close sectionContainer */}
        </div>
        
        </div>
    );
}
