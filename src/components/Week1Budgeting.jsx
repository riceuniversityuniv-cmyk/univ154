import React from 'react';
import BudgetForm from './BudgetForm';

// This data structure now includes all necessary info for rendering the exact layout

// Styles are now handled in BudgetForm component

const Week1BudgetingWrapper = () => {
  return (
    <div>
      <BudgetForm />
    </div>
  );
}

export default function Week1Budgeting() {
  return <Week1BudgetingWrapper />;
} 