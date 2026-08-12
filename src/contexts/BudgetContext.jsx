import React, { createContext, useState, useMemo, useContext } from 'react';
import { calculateFullTax, calculateStandardDeduction } from '../utils/taxEngine';
import { useAssumptions } from './AssumptionsContext';
import { supabase } from '../lib/supabaseClient';

const BudgetContext = createContext();

export const useBudget = () => {
  return useContext(BudgetContext);
};

export const BudgetProvider = ({ children }) => {
  const { assumptions } = useAssumptions();

  const [topInputs, setTopInputs] = useState({
    preTaxIncome: '100000',
    location: 'NY',
    residenceInNYC: 'Yes',
    housingCosts: 'Medium',
  });

  // User inputs for pre-tax expenses (Insurance and Retirement)
  const [userPreTaxInputs, setUserPreTaxInputs] = useState({
    health_insurance: '',
    life_insurance: '',
    disability_insurance: '',
    traditional_401k: '',
    traditional_ira: '',
  });


  // New: Retirement plan user inputs (shared between Week 1 and Week 6)
  const [retirementInputs, setRetirementInputs] = useState({
    retirement_traditional_401k: '',
    retirement_roth_401k: '',
    retirement_traditional_ira: '',
    retirement_roth_ira: '',
    retirement_simple_ira: '',
    retirement_403b: '',
    retirement_457b: '',
    retirement_thrift: '',
    retirement_private_db: '',
    retirement_gov_db: '',
  });

  // Week 2: Savings user inputs with individual sections
  const [savingsInputs, setSavingsInputs] = useState({
    // Section names (editable)
    down_payment_1_name: 'Down Payment',
    down_payment_2_name: 'Down Payment',
    car_1_name: 'Car',
    car_2_name: 'Car',
    wedding_1_name: 'Wedding',
    wedding_2_name: 'Wedding',
    advanced_degree_1_name: 'Advanced Degree',
    advanced_degree_2_name: 'Advanced Degree',
    vacation_1_name: 'Vacation',
    vacation_2_name: 'Vacation',
    miscellaneous_1_name: 'Miscellaneous',
    miscellaneous_2_name: 'Miscellaneous',
    // Annual earning rates (editable)
    down_payment_1_rate: '',
    down_payment_2_rate: '',
    car_1_rate: '',
    car_2_rate: '',
    wedding_1_rate: '',
    wedding_2_rate: '',
    advanced_degree_1_rate: '',
    advanced_degree_2_rate: '',
    vacation_1_rate: '',
    vacation_2_rate: '',
    miscellaneous_1_rate: '',
    miscellaneous_2_rate: '',
    // Goal amounts
    down_payment_1: '',
    down_payment_2: '',
    car_1: '',
    car_2: '',
    wedding_1: '',
    wedding_2: '',
    advanced_degree_1: '',
    advanced_degree_2: '',
    vacation_1: '',
    vacation_2: '',
    miscellaneous_1: '',
    miscellaneous_2: '',
    // Monthly savings amounts (calculated)
    down_payment_1_monthly: '',
    down_payment_2_monthly: '',
    car_1_monthly: '',
    car_2_monthly: '',
    wedding_1_monthly: '',
    wedding_2_monthly: '',
    advanced_degree_1_monthly: '',
    advanced_degree_2_monthly: '',
    vacation_1_monthly: '',
    vacation_2_monthly: '',
    miscellaneous_1_monthly: '',
    miscellaneous_2_monthly: '',
    // Time to goal (calculated)
    down_payment_1_time: '',
    down_payment_2_time: '',
    car_1_time: '',
    car_2_time: '',
    wedding_1_time: '',
    wedding_2_time: '',
    advanced_degree_1_time: '',
    advanced_degree_2_time: '',
    vacation_1_time: '',
    vacation_2_time: '',
    miscellaneous_1_time: '',
    miscellaneous_2_time: '',
  });

  const financialCalculations = useMemo(() => {
    const preTaxIncome = parseFloat(topInputs.preTaxIncome) || 0;
    const residenceInNYC = topInputs.location === 'NY' && topInputs.residenceInNYC === 'Yes';
    return calculateFullTax({ preTaxIncome, preTaxExpenses: 0, state: topInputs.location, residenceInNYC }, assumptions);
  }, [topInputs.preTaxIncome, topInputs.location, topInputs.residenceInNYC, assumptions]);

  // Summary sheet calculations (Week 1 B - Summary). "Suggested" and "User"
  // are the same tax picture computed twice, once against a suggested
  // pre-tax-expenses figure and once against the user's actual entered
  // pre-tax expenses -- both now go through the single shared taxEngine.js
  // instead of a hand-duplicated bracket walk, so this tab can no longer
  // drift from the Federal Tax / State Tax tabs (see
  // docs/financial-audit-2026-08-11.md findings #1, #9, #10, #13).
  const summaryCalculations = useMemo(() => {
    const preTaxIncome = parseFloat(topInputs.preTaxIncome || 0);
    const standardDeduction = calculateStandardDeduction(assumptions);
    const residenceInNYC = topInputs.location === 'NY' && topInputs.residenceInNYC === 'Yes';

    // Pre-Tax Expenses calculations (from Budgeting sheet)
    // G28 + G38 (Recommended Insurance + Recommended Retirement) * 12
    const suggestedPreTaxExpenses = 150 * 12; // Health Insurance $150 * 12 months = $1,800
    // E28 + E38 (User Insurance + User Retirement) * 12
    const userPreTaxExpenses = (
      (parseFloat(userPreTaxInputs.health_insurance) || 0) +
      (parseFloat(userPreTaxInputs.life_insurance) || 0) +
      (parseFloat(userPreTaxInputs.disability_insurance) || 0) +
      (parseFloat(userPreTaxInputs.traditional_401k) || 0) +
      (parseFloat(userPreTaxInputs.traditional_ira) || 0)
    ) * 12;

    const suggested = calculateFullTax(
      { preTaxIncome, preTaxExpenses: suggestedPreTaxExpenses, state: topInputs.location, residenceInNYC },
      assumptions
    );
    const user = calculateFullTax(
      { preTaxIncome, preTaxExpenses: userPreTaxExpenses, state: topInputs.location, residenceInNYC },
      assumptions
    );

    return {
      preTaxIncome, // C4, F4
      standardDeduction, // C6, F6
      suggestedPreTaxExpenses, // C7
      userPreTaxExpenses, // F7
      suggestedTaxableIncome: suggested.taxableIncome, // C9
      userTaxableIncome: user.taxableIncome, // F9
      suggestedFederalIncomeTax: suggested.federalIncomeTax, // C11
      suggestedSocialSecurityTax: suggested.socialSecurityTax, // C12
      suggestedMedicareTax: suggested.medicareTax, // C13
      suggestedAdditionalMedicareTax: suggested.additionalMedicareTax,
      suggestedStateIncomeTax: suggested.stateIncomeTax, // C15
      suggestedNYCTax: suggested.nycTax, // C16
      userFederalIncomeTax: user.federalIncomeTax, // F11
      userSocialSecurityTax: user.socialSecurityTax, // F12
      userMedicareTax: user.medicareTax, // F13
      userAdditionalMedicareTax: user.additionalMedicareTax,
      userStateIncomeTax: user.stateIncomeTax, // F15
      userNYCTax: user.nycTax, // F16
      suggestedAfterTaxIncome: suggested.afterTaxIncome, // C18
      userAfterTaxIncome: user.afterTaxIncome, // F18
      zeroPretaxTaxableIncome: preTaxIncome - standardDeduction, // C22
    };
  }, [topInputs.preTaxIncome, topInputs.location, topInputs.residenceInNYC, userPreTaxInputs, assumptions]);

  // Week 2: Savings calculations matching Excel structure
  const savingsCalculations = useMemo(() => {
    const monthlyAfterTaxIncome = summaryCalculations.userAfterTaxIncome / 12;
    const annualEarningRate = 0.04; // 4% as shown in Excel
    
    // Calculate savings goal details for each goal
    const calculateGoalDetails = (goalAmount) => {
      const amount = parseFloat(goalAmount) || 0;
      if (amount <= 0) return { monthlySavings: 0, percentage: 0, timeToGoal: 0 };
      
      // Calculate monthly savings needed to reach goal in 60 months (5 years) with 4% annual return
      // Using future value formula: FV = PMT * [((1 + r)^n - 1) / r]
      // Solving for PMT: PMT = FV / [((1 + r)^n - 1) / r]
      const monthlyRate = annualEarningRate / 12;
      const months = 60; // 5 years as shown in Excel
      const futureValueFactor = ((1 + monthlyRate) ** months - 1) / monthlyRate;
      const monthlySavings = amount / futureValueFactor;
      
      const percentage = monthlyAfterTaxIncome > 0 ? (monthlySavings / monthlyAfterTaxIncome) * 100 : 0;
      
      return {
        monthlySavings,
        percentage,
        timeToGoal: months
      };
    };

    // Calculate details for each savings goal
    const goalDetails = {};
    Object.keys(savingsInputs).forEach(key => {
      goalDetails[key] = calculateGoalDetails(savingsInputs[key]);
    });

    // Calculate total monthly savings
    const totalMonthlySavings = Object.values(goalDetails).reduce((sum, details) => {
      return sum + details.monthlySavings;
    }, 0);

    // Calculate total savings rate
    const totalSavingsRate = monthlyAfterTaxIncome > 0 ? (totalMonthlySavings / monthlyAfterTaxIncome) * 100 : 0;

    return {
      monthlyAfterTaxIncome,
      annualEarningRate,
      goalDetails,
      totalMonthlySavings,
      totalSavingsRate,
    };
  }, [summaryCalculations.userAfterTaxIncome, savingsInputs]);

  // Supabase functions for data persistence
  const saveBudgetData = async (userInputs, customExpenseNames, sectionStates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const budgetData = {
        user_id: user.id,
        top_inputs: topInputs,
        user_inputs: userInputs,
        custom_expense_names: customExpenseNames,
        section_states: sectionStates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('budget_data')
        .upsert(budgetData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving budget data:', error);
      return { success: false, error: error.message };
    }
  };

  const loadBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('budget_data')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error loading budget data:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    topInputs,
    setTopInputs,
    financialCalculations,
    summaryCalculations,
    retirementInputs,
    setRetirementInputs,
    userPreTaxInputs,
    setUserPreTaxInputs,
    savingsInputs,
    setSavingsInputs,
    savingsCalculations,
    saveBudgetData,
    loadBudgetData,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}; 