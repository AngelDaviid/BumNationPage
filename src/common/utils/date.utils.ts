export function addOneMonth(date: Date): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setMonth(result.getMonth() + 1);

  if (result.getDate() != originalDay) {
    result.setDate(0);
  }

  return result;
}
