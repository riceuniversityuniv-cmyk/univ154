// Shared column-header style used across every module's data tables.
//
// Previously every file (BudgetForm, Week1FederalTax, Week1Summary, Week10,
// Week11, Week6Retirement, Week7, Week9, WeekAccessAdmin,
// AdminSettingsPanel...) defined its own `th`/`enhancedHeader` style object
// independently, with two near-duplicate solid-navy/gradient-navy variants
// drifting slightly from file to file. This is the single source of truth:
// a soft navy-tinted background instead of a solid/gradient block, no
// backdrop blur, with a clean bottom border -- reads as a header row, not a
// "blue box." Spread this into each file's local `th` object, layering any
// file-specific width/padding on top.
export const tableHeaderStyle = {
  background: '#eef1f8',
  color: '#0d1a4b',
  borderBottom: '2px solid #c7d0e8',
  fontWeight: '600',
};
