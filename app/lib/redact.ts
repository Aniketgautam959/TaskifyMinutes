const SECRET = /\b(password|passcode|passwd|otp|pin code|secret|api[\s-]?key|credential)\b/i;
const SALARY = /\b(salary|ctc|compensation|paycheck)\b/i;
const MONEY = /(?:₹|\brs\.?\b|\binr\b|\$|\busd\b)\s?\d|\b\d+(?:\.\d+)?\s?(?:lakh|lac|crore)\b/i;
const BUDGET_AMOUNT = /\bbudget\b.{0,48}(?:₹|\brs\.?\b|\binr\b|\$|\busd\b)\s?\d|\bbudget\b.{0,48}\d+\s?(?:lakh|lac|crore)\b/i;

export const REDACTED_LINE = "Hidden. This line mentions a salary, an amount, or a password.";

export function isSensitiveText(text: string): boolean {
  if (!text) return false;
  return SECRET.test(text) || (SALARY.test(text) && /\d/.test(text)) || MONEY.test(text) || BUDGET_AMOUNT.test(text);
}
