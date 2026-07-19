export const calculateExpenseTotal = (categories) => {
  return categories.reduce(
    (total, category) => total + Number(category.amount),
    0
  );
};