/**
 * Analyseur d'expressions du métré — arithmétique pure, sans eval ni Function.
 * Grammaire : docs/preparation/BEWORK-PREP-BUNDLE-V1-SPEC.md §8.3
 */

export const FORMULA_MAX_LENGTH = 500;
const MAX_DEPTH = 32;
const EPS = 1e-9;

const FUNCTIONS: Record<string, { min: number; max: number }> = {
  min: { min: 1, max: 99 },
  max: { min: 1, max: 99 },
  ceil: { min: 1, max: 1 },
  floor: { min: 1, max: 1 },
  abs: { min: 1, max: 1 },
  round: { min: 1, max: 2 },
};

export const PARAM_KEY_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;
export const LINE_CODE_RE = /^[A-Z][A-Z0-9]*-[0-9]{1,4}$/;

export type FormulaNode =
  | { k: "num"; v: number }
  | { k: "ref"; v: string }
  | { k: "neg"; a: FormulaNode }
  | { k: "bin"; op: "+" | "-" | "*" | "/"; a: FormulaNode; b: FormulaNode }
  | { k: "fn"; f: string; args: FormulaNode[] };

export class FormulaError extends Error {}

type Token =
  | { t: "num"; v: number }
  | { t: "line"; v: string }
  | { t: "param"; v: string }
  | { t: "op"; v: string };

const TOKEN_RE =
  /\s*(?:([0-9]+(?:\.[0-9]+)?)|([A-Z][A-Z0-9]*-[0-9]+)|([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*)|([-+*/(),]))/y;

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    TOKEN_RE.lastIndex = i;
    const m = TOKEN_RE.exec(src);
    if (!m) {
      throw new FormulaError(
        `Caractère non autorisé à la position ${i + 1} : « ${src.slice(i, i + 12).trim()} »`,
      );
    }
    if (m[1] !== undefined) out.push({ t: "num", v: Number(m[1]) });
    else if (m[2] !== undefined) out.push({ t: "line", v: m[2] });
    else if (m[3] !== undefined) out.push({ t: "param", v: m[3] });
    else out.push({ t: "op", v: m[4] });
    i = TOKEN_RE.lastIndex;
  }
  return out;
}

export function parseFormula(src: string): FormulaNode {
  if (typeof src !== "string" || !src.trim()) throw new FormulaError("Formule vide");
  if (src.length > FORMULA_MAX_LENGTH) {
    throw new FormulaError(`Formule trop longue (maximum ${FORMULA_MAX_LENGTH} caractères)`);
  }
  const tk = tokenize(src);
  let p = 0;
  let depth = 0;

  const peek = () => tk[p];
  const isOp = (v: string) => {
    const x = tk[p];
    return !!x && x.t === "op" && x.v === v;
  };
  const expect = (v: string) => {
    if (!isOp(v)) throw new FormulaError(`« ${v} » attendu`);
    p++;
  };

  function expression(): FormulaNode {
    let node = term();
    while (isOp("+") || isOp("-")) {
      const op = (tk[p++] as { v: "+" | "-" }).v;
      node = { k: "bin", op, a: node, b: term() };
    }
    return node;
  }

  function term(): FormulaNode {
    let node = factor();
    while (isOp("*") || isOp("/")) {
      const op = (tk[p++] as { v: "*" | "/" }).v;
      node = { k: "bin", op, a: node, b: factor() };
    }
    return node;
  }

  function factor(): FormulaNode {
    depth++;
    if (depth > MAX_DEPTH) throw new FormulaError("Formule trop imbriquée");
    const x = peek();
    if (!x) throw new FormulaError("Fin de formule inattendue");
    let node: FormulaNode;
    if (x.t === "op" && (x.v === "-" || x.v === "+")) {
      p++;
      const inner = factor();
      node = x.v === "-" ? { k: "neg", a: inner } : inner;
    } else if (x.t === "num") {
      p++;
      node = { k: "num", v: x.v };
    } else if (x.t === "line") {
      p++;
      node = { k: "ref", v: x.v };
    } else if (x.t === "param") {
      p++;
      if (isOp("(")) {
        const spec = FUNCTIONS[x.v];
        if (!spec) throw new FormulaError(`Fonction non autorisée : ${x.v}`);
        p++;
        const args = [expression()];
        while (isOp(",")) {
          p++;
          args.push(expression());
        }
        expect(")");
        if (args.length < spec.min || args.length > spec.max) {
          throw new FormulaError(`Nombre d'arguments invalide pour ${x.v}()`);
        }
        node = { k: "fn", f: x.v, args };
      } else {
        node = { k: "ref", v: x.v };
      }
    } else if (x.t === "op" && x.v === "(") {
      p++;
      node = expression();
      expect(")");
    } else {
      throw new FormulaError(`Élément inattendu « ${x.v} »`);
    }
    depth--;
    return node;
  }

  const ast = expression();
  if (p !== tk.length) {
    const x = tk[p];
    throw new FormulaError(`Élément inattendu « ${x ? String(x.v) : "?"} »`);
  }
  return ast;
}

export function formulaRefs(ast: FormulaNode, acc: Set<string> = new Set()): Set<string> {
  switch (ast.k) {
    case "ref":
      acc.add(ast.v);
      break;
    case "neg":
      formulaRefs(ast.a, acc);
      break;
    case "bin":
      formulaRefs(ast.a, acc);
      formulaRefs(ast.b, acc);
      break;
    case "fn":
      for (const a of ast.args) formulaRefs(a, acc);
      break;
  }
  return acc;
}

/** Constantes numériques significatives (hors 0 et 1) présentes dans la formule. */
export function formulaLiterals(ast: FormulaNode, acc: number[] = []): number[] {
  switch (ast.k) {
    case "num":
      if (ast.v !== 0 && ast.v !== 1) acc.push(ast.v);
      break;
    case "neg":
      formulaLiterals(ast.a, acc);
      break;
    case "bin":
      formulaLiterals(ast.a, acc);
      formulaLiterals(ast.b, acc);
      break;
    case "fn":
      for (const a of ast.args) formulaLiterals(a, acc);
      break;
  }
  return acc;
}

export function evaluateFormula(
  ast: FormulaNode,
  resolve: (ref: string) => number | null,
): number {
  switch (ast.k) {
    case "num":
      return ast.v;
    case "ref": {
      const v = resolve(ast.v);
      if (v === null || !Number.isFinite(v)) {
        throw new FormulaError(`Valeur indisponible : ${ast.v}`);
      }
      return v;
    }
    case "neg":
      return -evaluateFormula(ast.a, resolve);
    case "bin": {
      const a = evaluateFormula(ast.a, resolve);
      const b = evaluateFormula(ast.b, resolve);
      switch (ast.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          if (b === 0) throw new FormulaError("Division par zéro");
          return a / b;
      }
      break;
    }
    case "fn": {
      const v = ast.args.map((x) => evaluateFormula(x, resolve));
      switch (ast.f) {
        case "min":
          return Math.min(...v);
        case "max":
          return Math.max(...v);
        case "abs":
          return Math.abs(v[0]);
        case "ceil":
          return Math.ceil(v[0] - EPS);
        case "floor":
          return Math.floor(v[0] + EPS);
        case "round": {
          const digits = Math.max(0, Math.min(10, Math.trunc(v[1] ?? 0)));
          const f = 10 ** digits;
          return Math.round((v[0] + Math.sign(v[0]) * EPS) * f) / f;
        }
      }
    }
  }
  throw new FormulaError("Expression invalide");
}
