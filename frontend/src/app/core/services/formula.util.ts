/**
 * A small, safe, dependency-free arithmetic expression evaluator used for
 * data-binding formulas (e.g. a Text node bound to
 * `{{weight}} / (({{height}} / 100) ** 2)`).
 *
 * It is NOT `eval` and does NOT execute arbitrary JavaScript — it tokenizes,
 * converts to RPN via the shunting-yard algorithm (with proper function-arity
 * tracking), and evaluates numerically. Supported: numbers, variables,
 * `+ - * / %`, `**`/`^` (power, right-assoc), unary minus, parentheses, and a
 * handful of functions (round, abs, sqrt, floor, ceil, min, max, pow, log, exp).
 *
 * Variables may be written bare (`weight`) or wrapped (`{{weight}}`); both
 * resolve against the supplied scope. Any missing/blank/non-numeric variable
 * makes the whole result null, so a half-filled form shows blank rather than NaN.
 */

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'op'; op: string }
  | { kind: 'func'; name: string; argc?: number }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'comma' };

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  round: (a) => (a.length === 2 ? roundTo(a[0], a[1]) : Math.round(a[0])),
  abs: (a) => Math.abs(a[0]),
  sqrt: (a) => Math.sqrt(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil: (a) => Math.ceil(a[0]),
  min: (a) => Math.min(...a),
  max: (a) => Math.max(...a),
  pow: (a) => Math.pow(a[0], a[1]),
  log: (a) => (a.length === 2 ? Math.log(a[0]) / Math.log(a[1]) : Math.log(a[0])),
  exp: (a) => Math.exp(a[0]),
};

const PRECEDENCE: Record<string, number> = {
  'u-': 5,
  '^': 4,
  '**': 4,
  '*': 3,
  '/': 3,
  '%': 3,
  '+': 2,
  '-': 2,
};

const RIGHT_ASSOC = new Set(['^', '**', 'u-']);

function roundTo(value: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}

/** Replaces `{{ name }}` with a bare identifier so the tokenizer sees `name`. */
function stripBraces(input: string): string {
  return input.replace(/\{\{\s*([^}]*?)\s*\}\}/g, (_, inner: string) => inner.trim());
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input;

  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if ((ch >= '0' && ch <= '9') || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) {
        j += 1;
      }
      const num = Number(src.slice(i, j));
      if (!Number.isFinite(num)) {
        throw new Error('Invalid number');
      }
      tokens.push({ kind: 'num', value: num });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) {
        j += 1;
      }
      const name = src.slice(i, j);
      let k = j;
      while (k < src.length && /\s/.test(src[k])) {
        k += 1;
      }
      tokens.push(src[k] === '(' ? { kind: 'func', name } : { kind: 'var', name });
      i = j;
      continue;
    }

    if (ch === '*' && src[i + 1] === '*') {
      tokens.push({ kind: 'op', op: '**' });
      i += 2;
      continue;
    }

    if ('+-*/%^'.includes(ch)) {
      tokens.push({ kind: 'op', op: ch });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma' });
      i += 1;
      continue;
    }

    throw new Error(`Unexpected character "${ch}"`);
  }

  return tokens;
}

/** Shunting-yard → RPN, tracking unary minus and function arity. */
function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const ops: Token[] = [];
  const commaCount: number[] = []; // per open-paren
  const sawValue: boolean[] = []; // per open-paren: did it receive any value?
  const parenIsFunc: boolean[] = [];
  let prev: Token | null = null;

  const markValue = () => {
    if (sawValue.length) {
      sawValue[sawValue.length - 1] = true;
    }
  };
  const isValueEnd = (t: Token | null) =>
    t != null && (t.kind === 'num' || t.kind === 'var' || t.kind === 'rparen');

  for (const token of tokens) {
    switch (token.kind) {
      case 'num':
      case 'var':
        output.push(token);
        markValue();
        break;

      case 'func':
        ops.push(token);
        break;

      case 'lparen':
        ops.push(token);
        commaCount.push(0);
        sawValue.push(false);
        parenIsFunc.push(prev != null && prev.kind === 'func');
        break;

      case 'comma':
        while (ops.length && ops[ops.length - 1].kind !== 'lparen') {
          output.push(ops.pop() as Token);
        }
        if (commaCount.length) {
          commaCount[commaCount.length - 1] += 1;
        }
        break;

      case 'op': {
        let op = token.op;
        if (op === '-' && !isValueEnd(prev)) {
          op = 'u-';
        }
        while (ops.length) {
          const top = ops[ops.length - 1];
          if (top.kind !== 'op') break;
          const topPrec = PRECEDENCE[top.op];
          const curPrec = PRECEDENCE[op];
          if (topPrec > curPrec || (topPrec === curPrec && !RIGHT_ASSOC.has(op))) {
            output.push(ops.pop() as Token);
          } else {
            break;
          }
        }
        ops.push({ kind: 'op', op });
        break;
      }

      case 'rparen': {
        while (ops.length && ops[ops.length - 1].kind !== 'lparen') {
          output.push(ops.pop() as Token);
        }
        if (!ops.length) {
          throw new Error('Mismatched parentheses');
        }
        ops.pop(); // discard lparen
        const commas = commaCount.pop() ?? 0;
        const had = sawValue.pop() ?? false;
        const wasFunc = parenIsFunc.pop() ?? false;
        if (wasFunc && ops.length && ops[ops.length - 1].kind === 'func') {
          const fn = ops.pop() as Extract<Token, { kind: 'func' }>;
          fn.argc = had ? commas + 1 : 0;
          output.push(fn);
        }
        markValue(); // the (…) produced a value for any enclosing context
        break;
      }
    }
    prev = token;
  }

  while (ops.length) {
    const top = ops.pop() as Token;
    if (top.kind === 'lparen') {
      throw new Error('Mismatched parentheses');
    }
    output.push(top);
  }

  return output;
}

function resolveVar(name: string, scope: Record<string, unknown>): number {
  const raw = scope[name];
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(num)) {
    throw new Error(`Variable "${name}" is not set`);
  }
  return num;
}

function evalRpn(rpn: Token[], scope: Record<string, unknown>): number {
  const stack: number[] = [];
  const binary = (fn: (a: number, b: number) => number) => {
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) throw new Error('Malformed expression');
    stack.push(fn(a, b));
  };

  for (const token of rpn) {
    if (token.kind === 'num') {
      stack.push(token.value);
    } else if (token.kind === 'var') {
      stack.push(resolveVar(token.name, scope));
    } else if (token.kind === 'op') {
      switch (token.op) {
        case 'u-': {
          const a = stack.pop();
          if (a === undefined) throw new Error('Malformed expression');
          stack.push(-a);
          break;
        }
        case '+': binary((a, b) => a + b); break;
        case '-': binary((a, b) => a - b); break;
        case '*': binary((a, b) => a * b); break;
        case '/': binary((a, b) => a / b); break;
        case '%': binary((a, b) => a % b); break;
        case '^':
        case '**': binary((a, b) => Math.pow(a, b)); break;
        default: throw new Error(`Unknown operator "${token.op}"`);
      }
    } else if (token.kind === 'func') {
      const fn = FUNCTIONS[token.name];
      if (!fn) throw new Error(`Unknown function "${token.name}"`);
      const argc = token.argc ?? 0;
      const args: number[] = [];
      for (let n = 0; n < argc; n += 1) {
        const v = stack.pop();
        if (v === undefined) throw new Error('Malformed expression');
        args.unshift(v);
      }
      stack.push(fn(args));
    } else {
      throw new Error('Malformed expression');
    }
  }

  if (stack.length !== 1) {
    throw new Error('Malformed expression');
  }
  return stack[0];
}

/**
 * Evaluates a binding formula against a variables scope.
 * Returns the numeric result, or `null` if the formula is empty, invalid, or
 * references a variable that isn't set yet.
 */
export function evaluateFormula(
  formula: string,
  scope: Record<string, unknown>,
): number | null {
  const trimmed = (formula ?? '').trim();
  if (!trimmed) {
    return null;
  }
  try {
    const rpn = toRpn(tokenize(stripBraces(trimmed)));
    const result = evalRpn(rpn, scope);
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/** Formats a formula result for display: up to 2 decimals, trailing zeros trimmed. */
export function formatFormulaResult(value: number | null): string {
  if (value === null) {
    return '';
  }
  return String(roundTo(value, 2));
}

/** Extracts the variable names referenced by a formula (skips function names). */
export function extractFormulaVariables(formula: string): string[] {
  const names = new Set<string>();
  const stripped = stripBraces(formula ?? '');
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(stripped)) !== null) {
    const name = match[0];
    if (name in FUNCTIONS) {
      continue;
    }
    const followedByParen = /^\s*\(/.test(stripped.slice(re.lastIndex));
    if (!followedByParen) {
      names.add(name);
    }
  }
  return Array.from(names);
}
