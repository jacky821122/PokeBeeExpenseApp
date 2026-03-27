export function evaluateExpression(expression: string): number | null {
  const exp = expression.replace(/\s+/g, "");
  if (!exp) return null;
  const tokens = exp.match(/\d*\.?\d+|[+\-*/()]/g);
  if (!tokens || tokens.join("") !== exp) return null;

  const values: number[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

  const applyTopOperator = () => {
    const op = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (!op || right === undefined || left === undefined) return false;
    if (op === "+") values.push(left + right);
    if (op === "-") values.push(left - right);
    if (op === "*") values.push(left * right);
    if (op === "/") {
      if (right === 0) return false;
      values.push(left / right);
    }
    return true;
  };

  let prevToken: string | null = null;
  for (const token of tokens) {
    if (/^\d*\.?\d+$/.test(token)) {
      values.push(Number(token));
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        if (!applyTopOperator()) return null;
      }
      if (operators.pop() !== "(") return null;
    } else {
      if (token === "-" && (prevToken === null || ["+", "-", "*", "/", "("].includes(prevToken))) {
        values.push(0);
      }
      while (
        operators.length &&
        operators[operators.length - 1] !== "(" &&
        precedence[operators[operators.length - 1]] >= precedence[token]
      ) {
        if (!applyTopOperator()) return null;
      }
      operators.push(token);
    }
    prevToken = token;
  }

  while (operators.length) {
    if (operators[operators.length - 1] === "(") return null;
    if (!applyTopOperator()) return null;
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) return null;
  return values[0];
}
