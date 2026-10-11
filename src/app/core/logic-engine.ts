import { Classification, LogicalOperator, TruthRow } from './models';

/**
 * Motor de lógica proposicional.
 *
 * Incluye un tokenizador, un parser descendente-recursivo y un evaluador.
 * Con esto el banco de ejercicios sólo guarda fórmulas y las respuestas
 * correctas se calculan de forma determinista (evitando errores humanos).
 */

/* ------------------------------------------------------------------ */
/* AST                                                                 */
/* ------------------------------------------------------------------ */

export type LogicNode =
  | { kind: 'var'; name: string }
  | { kind: 'not'; child: LogicNode }
  | { kind: 'binary'; op: Exclude<LogicalOperator, 'not'>; left: LogicNode; right: LogicNode };

/* ------------------------------------------------------------------ */
/* Normalización de símbolos                                           */
/* ------------------------------------------------------------------ */

/**
 * Convierte distintas formas de escribir los operadores a los símbolos
 * canónicos usados internamente (¬ ∧ ∨ → ↔).
 */
export function normalizeExpression(expr: string): string {
  return expr
    .replace(/<->/g, '↔')
    .replace(/<=>/g, '↔')
    .replace(/->/g, '→')
    .replace(/=>/g, '→')
    .replace(/~/g, '¬')
    .replace(/!/g, '¬')
    .replace(/&/g, '∧')
    .replace(/\^/g, '∧')
    .replace(/\|/g, '∨')
    .replace(/\+/g, '∨')
    .replace(/\s+/g, '');
}

/* ------------------------------------------------------------------ */
/* Tokenizador                                                         */
/* ------------------------------------------------------------------ */

type Token =
  | { type: 'var'; value: string }
  | { type: 'not' }
  | { type: 'and' }
  | { type: 'or' }
  | { type: 'imp' }
  | { type: 'iff' }
  | { type: 'lparen' }
  | { type: 'rparen' };

function tokenize(expr: string): Token[] {
  const clean = normalizeExpression(expr);
  const tokens: Token[] = [];

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    switch (ch) {
      case '(':
        tokens.push({ type: 'lparen' });
        break;
      case ')':
        tokens.push({ type: 'rparen' });
        break;
      case '¬':
        tokens.push({ type: 'not' });
        break;
      case '∧':
        tokens.push({ type: 'and' });
        break;
      case '∨':
        tokens.push({ type: 'or' });
        break;
      case '→':
        tokens.push({ type: 'imp' });
        break;
      case '↔':
        tokens.push({ type: 'iff' });
        break;
      default:
        if (/[a-zA-Z]/.test(ch)) {
          tokens.push({ type: 'var', value: ch.toLowerCase() });
        } else {
          throw new Error(`Símbolo no reconocido: "${ch}"`);
        }
    }
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Parser (descendente recursivo)                                      */
/* ------------------------------------------------------------------ */

/**
 * Precedencia (de menor a mayor):  ↔  →  ∨  ∧  ¬
 * El condicional y el bicondicional se tratan como asociativos por la
 * derecha, que es la convención habitual en lógica.
 */
export function parseExpression(expr: string): LogicNode {
  const tokens = tokenize(expr);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function parseIff(): LogicNode {
    let left = parseImp();
    while (peek()?.type === 'iff') {
      pos++;
      const right = parseImp();
      left = { kind: 'binary', op: 'iff', left, right };
    }
    return left;
  }

  function parseImp(): LogicNode {
    const left = parseOr();
    if (peek()?.type === 'imp') {
      pos++;
      const right = parseImp(); // asociativo por la derecha
      return { kind: 'binary', op: 'imp', left, right };
    }
    return left;
  }

  function parseOr(): LogicNode {
    let left = parseAnd();
    while (peek()?.type === 'or') {
      pos++;
      const right = parseAnd();
      left = { kind: 'binary', op: 'or', left, right };
    }
    return left;
  }

  function parseAnd(): LogicNode {
    let left = parseUnary();
    while (peek()?.type === 'and') {
      pos++;
      const right = parseUnary();
      left = { kind: 'binary', op: 'and', left, right };
    }
    return left;
  }

  function parseUnary(): LogicNode {
    if (peek()?.type === 'not') {
      pos++;
      return { kind: 'not', child: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary(): LogicNode {
    const token = peek();
    if (!token) {
      throw new Error('Expresión incompleta.');
    }
    if (token.type === 'lparen') {
      pos++;
      const inner = parseIff();
      if (peek()?.type !== 'rparen') {
        throw new Error('Falta un paréntesis de cierre.');
      }
      pos++;
      return inner;
    }
    if (token.type === 'var') {
      pos++;
      return { kind: 'var', name: token.value };
    }
    throw new Error('Expresión mal formada.');
  }

  const node = parseIff();
  if (pos !== tokens.length) {
    throw new Error('Sobran símbolos en la expresión.');
  }
  return node;
}

/* ------------------------------------------------------------------ */
/* Evaluación                                                          */
/* ------------------------------------------------------------------ */

/** Evalúa un AST dado un entorno de variables (nombre -> valor). */
export function evaluateNode(node: LogicNode, env: Record<string, boolean>): boolean {
  switch (node.kind) {
    case 'var':
      return env[node.name] ?? false;
    case 'not':
      return !evaluateNode(node.child, env);
    case 'binary': {
      const l = evaluateNode(node.left, env);
      const r = evaluateNode(node.right, env);
      switch (node.op) {
        case 'and':
          return l && r;
        case 'or':
          return l || r;
        case 'imp':
          return !l || r; // l → r  ≡  ¬l ∨ r
        case 'iff':
          return l === r;
      }
    }
  }
}

/** Atajo: evalúa una fórmula con una asignación concreta. */
export function evaluateFormula(formula: string, env: Record<string, boolean>): boolean {
  return evaluateNode(parseExpression(formula), env);
}

/* ------------------------------------------------------------------ */
/* Utilidades de variables                                             */
/* ------------------------------------------------------------------ */

/** Devuelve las variables en orden de aparición (sin duplicados). */
export function variablesOf(node: LogicNode): string[] {
  const found: string[] = [];
  const walk = (n: LogicNode): void => {
    if (n.kind === 'var') {
      if (!found.includes(n.name)) found.push(n.name);
    } else if (n.kind === 'not') {
      walk(n.child);
    } else {
      walk(n.left);
      walk(n.right);
    }
  };
  walk(node);
  return found;
}

/** Genera todas las asignaciones posibles para `n` variables (V primero). */
export function allAssignments(n: number): boolean[][] {
  const total = 2 ** n;
  const rows: boolean[][] = [];
  for (let i = 0; i < total; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < n; j++) {
      // La primera variable es la más significativa y empieza en V:
      // (V V, V F, F V, F F...).
      const bit = (i >> (n - 1 - j)) & 1;
      row.push(bit === 0);
    }
    rows.push(row);
  }
  return rows;
}

/** Convierte una fila de valores booleanos en un entorno nombre -> valor. */
export function rowToEnv(variables: string[], row: boolean[]): Record<string, boolean> {
  const env: Record<string, boolean> = {};
  variables.forEach((v, i) => {
    env[v] = row[i] ?? false;
  });
  return env;
}

/* ------------------------------------------------------------------ */
/* Tabla de verdad y clasificación                                     */
/* ------------------------------------------------------------------ */

/** Construye la tabla de verdad completa de una fórmula. */
export function buildTruthTable(formula: string): { variables: string[]; rows: TruthRow[] } {
  const node = parseExpression(formula);
  const variables = variablesOf(node);
  const rows: TruthRow[] = allAssignments(variables.length).map((asignacion) => ({
    asignacion,
    valor: evaluateNode(node, rowToEnv(variables, asignacion)),
  }));
  return { variables, rows };
}

/** Clasifica la proposición como tautología, contradicción o contingencia. */
export function classifyFormula(formula: string): Classification {
  const { rows } = buildTruthTable(formula);
  const todosVerdaderos = rows.every((r) => r.valor);
  const todosFalsos = rows.every((r) => !r.valor);
  if (todosVerdaderos) return 'tautologia';
  if (todosFalsos) return 'contradiccion';
  return 'contingencia';
}

/** Devuelve el operador principal (raíz) de una fórmula. */
export function mainOperator(formula: string): LogicalOperator {
  const node = parseExpression(formula);
  if (node.kind === 'var') return 'not'; // caso degenerado, no usado por el banco
  if (node.kind === 'not') return 'not';
  return node.op;
}

/** Comprueba si dos fórmulas son lógicamente equivalentes. */
export function areEquivalent(a: string, b: string): boolean {
  const nodeA = parseExpression(a);
  const nodeB = parseExpression(b);
  const vars = Array.from(new Set([...variablesOf(nodeA), ...variablesOf(nodeB)])).sort();
  return allAssignments(vars.length).every((row) => {
    const env = rowToEnv(vars, row);
    return evaluateNode(nodeA, env) === evaluateNode(nodeB, env);
  });
}

/* ------------------------------------------------------------------ */
/* Representación legible y subfórmulas (para el laboratorio)          */
/* ------------------------------------------------------------------ */

const BINARY_SYMBOL: Record<'and' | 'or' | 'imp' | 'iff', string> = {
  and: '∧',
  or: '∨',
  imp: '→',
  iff: '↔',
};

/** Renderiza un AST con paréntesis explícitos en cada operación binaria. */
function renderFull(node: LogicNode): string {
  switch (node.kind) {
    case 'var':
      return node.name;
    case 'not':
      return '¬' + renderFull(node.child);
    case 'binary':
      return `(${renderFull(node.left)} ${BINARY_SYMBOL[node.op]} ${renderFull(node.right)})`;
  }
}

/** Quita el par de paréntesis más externo si encierra toda la expresión. */
function stripOuter(s: string): string {
  if (!s.startsWith('(') || !s.endsWith(')')) return s;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return i === s.length - 1 ? s.slice(1, -1) : s;
    }
  }
  return s;
}

/** Devuelve la fórmula en notación bonita (sin paréntesis externos). */
export function renderNode(node: LogicNode): string {
  return stripOuter(renderFull(node));
}

/**
 * Lista las subfórmulas en orden de evaluación (de las más simples a la
 * fórmula completa). Sirve para construir las columnas intermedias de una
 * tabla de verdad "paso a paso". Se excluyen las variables sueltas.
 */
export function subformulaColumns(node: LogicNode): { node: LogicNode; label: string }[] {
  const resultado: { node: LogicNode; label: string }[] = [];
  const vistos = new Set<string>();

  const walk = (n: LogicNode): void => {
    if (n.kind === 'var') return;
    if (n.kind === 'not') {
      walk(n.child);
    } else {
      walk(n.left);
      walk(n.right);
    }
    const label = renderNode(n);
    if (!vistos.has(label)) {
      vistos.add(label);
      resultado.push({ node: n, label });
    }
  };

  walk(node);
  return resultado;
}

/**
 * Valida un argumento proposicional: un argumento es VÁLIDO si no existe
 * ninguna interpretación en la que todas las premisas sean verdaderas y la
 * conclusión sea falsa. (Equivale a comprobar si las premisas implican la
 * conclusión: `premisas ⊨ conclusión`.)
 */
export function isArgumentValid(premisas: string[], conclusion: string): boolean {
  if (premisas.length === 0) return classifyFormula(conclusion) === 'tautologia';

  const nodosPremisa = premisas.map(parseExpression);
  const nodoConclusion = parseExpression(conclusion);

  const todas = [...nodosPremisa, nodoConclusion];
  const vars = Array.from(new Set(todas.flatMap((n) => variablesOf(n)))).sort();

  return allAssignments(vars.length).every((row) => {
    const env = rowToEnv(vars, row);
    const premisasVerdaderas = nodosPremisa.every((n) => evaluateNode(n, env));
    const conclusionVerdadera = evaluateNode(nodoConclusion, env);
    // Contraejemplo: premisas V y conclusión F => inválido.
    return !(premisasVerdaderas && !conclusionVerdadera);
  });
}
