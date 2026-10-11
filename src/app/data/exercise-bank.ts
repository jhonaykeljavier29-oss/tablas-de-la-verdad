import {
  buildTruthTable,
  classifyFormula,
  mainOperator,
  rowToEnv,
  evaluateFormula,
} from '../core/logic-engine';
import { Classification, Difficulty, Exercise, LogicalOperator } from '../core/models';
import { buildQuestionBank, OPC_CLASIF, OPC_OPERADOR } from './questions';

/**
 * Banco de ejercicios de Tablas de la Verdad.
 *
 * Para no cometer errores a mano, el banco se CONSTRUYE a partir de una lista
 * de fórmulas: el motor lógico calcula automáticamente las tablas y las
 * respuestas correctas. Con 40+ fórmulas y 3-4 tipos de pregunta por fórmula
 * se superan con holgura los 100 ejercicios.
 */

interface FormulaSpec {
  formula: string;
  nivel: Difficulty;
}

const FORMULAS: FormulaSpec[] = [
  // ---------------- Nivel 1: dos variables, operadores básicos ----------------
  { formula: 'p ∧ q', nivel: 1 },
  { formula: 'p ∨ q', nivel: 1 },
  { formula: '¬p', nivel: 1 },
  { formula: '¬p ∧ q', nivel: 1 },
  { formula: 'p ∧ ¬q', nivel: 1 },
  { formula: '¬p ∨ q', nivel: 1 },
  { formula: '¬(p ∧ q)', nivel: 1 },
  { formula: '¬(p ∨ q)', nivel: 1 },
  { formula: 'p → q', nivel: 1 },
  { formula: 'p ↔ q', nivel: 1 },
  { formula: 'q → p', nivel: 1 },
  { formula: '¬q → p', nivel: 1 },

  // ---------------- Nivel 2: mezclas y tres variables ----------------
  { formula: '(p ∧ q) → r', nivel: 2 },
  { formula: 'p → (q ∧ r)', nivel: 2 },
  { formula: '(p ∨ q) ∧ ¬r', nivel: 2 },
  { formula: '¬(p ∨ q) ∧ r', nivel: 2 },
  { formula: '(p → q) ∧ (q → p)', nivel: 2 },
  { formula: '¬p ∨ (q ∧ r)', nivel: 2 },
  { formula: '(p ↔ q) → r', nivel: 2 },
  { formula: '¬(p ∧ q) ∨ r', nivel: 2 },
  { formula: 'p → (q ∨ r)', nivel: 2 },
  { formula: '(p ∧ ¬q) ∨ r', nivel: 2 },
  { formula: '¬p ↔ (q ∧ r)', nivel: 2 },
  { formula: '(p ∨ ¬q) → r', nivel: 2 },
  { formula: 'p ∧ (q ∨ ¬r)', nivel: 2 },
  { formula: '(p → q) ∨ (r ∧ ¬p)', nivel: 2 },
  { formula: '¬(p ∨ ¬q) ∧ r', nivel: 2 },
  { formula: '(p ↔ q) ∧ r', nivel: 2 },

  // ---------------- Nivel 3: leyes y estructuras complejas ----------------
  { formula: 'p ∨ ¬p', nivel: 3 },
  { formula: 'p ∧ ¬p', nivel: 3 },
  { formula: '(p ∧ q) ↔ (q ∧ p)', nivel: 3 },
  { formula: '(p → q) ↔ (¬q → ¬p)', nivel: 3 },
  { formula: '((p → q) ∧ (q → r)) → (p → r)', nivel: 3 },
  { formula: '(p ↔ q) ↔ (¬p ↔ ¬q)', nivel: 3 },
  { formula: '¬(p ∧ q) ↔ (¬p ∨ ¬q)', nivel: 3 },
  { formula: '¬(p ∨ q) ↔ (¬p ∧ ¬q)', nivel: 3 },
  { formula: '((p ∧ q) ∨ r) → (p ∨ r)', nivel: 3 },
  { formula: '(p ∨ q) → (p ∧ q)', nivel: 3 },
  { formula: '(p ∧ (q ∨ r)) ∨ (¬p ∧ q)', nivel: 3 },
  { formula: '(p → r) ∧ (q → r)', nivel: 3 },
  { formula: '((p ∨ q) ∧ ¬r) ↔ (¬p → q)', nivel: 3 },
  { formula: '(p ↔ q) ∨ (r ∧ ¬q)', nivel: 3 },
];

const ETIQUETA_OPERADOR: Record<LogicalOperator, string> = {
  not: 'Negación (¬)',
  and: 'Conjunción (∧)',
  or: 'Disyunción (∨)',
  imp: 'Condicional (→)',
  iff: 'Bicondicional (↔)',
};

const ETIQUETA_CLASIFICACION: Record<Classification, string> = {
  tautologia: 'Tautología',
  contradiccion: 'Contradicción',
  contingencia: 'Contingencia',
};

/** Texto legible para una asignación, p. ej. "p = V, q = F". */
function describirAsignacion(variables: string[], asignacion: boolean[]): string {
  return variables.map((v, i) => `${v} = ${asignacion[i] ? 'V' : 'F'}`).join(', ');
}

/** Construye el banco completo. Se ejecuta una sola vez al importar el módulo. */
function construirBanco(): Exercise[] {
  const banco: Exercise[] = [];
  let id = 1;

  FORMULAS.forEach((spec, indice) => {
    const { variables, rows } = buildTruthTable(spec.formula);

    // 1) Ejercicio de tabla de verdad completa (columna de resultado).
    banco.push({
      id: id++,
      tipo: 'tabla',
      nivel: spec.nivel,
      unidad: 2,
      titulo: 'Tabla de verdad',
      enunciado:
        'Completa la columna "Resultado": indica V (verdadero) o F (falso) ' +
        'para cada fila de la tabla de verdad de la proposición.',
      formula: spec.formula,
      variables,
      filas: rows,
    });

    // 2) Ejercicio de valor puntual con una asignación concreta.
    const indiceFila = (indice * 7 + 3) % rows.length;
    const fila = rows[indiceFila];
    banco.push({
      id: id++,
      tipo: 'valor',
      nivel: spec.nivel,
      unidad: 2,
      titulo: 'Valor de verdad',
      enunciado:
        `Dada la asignación ${describirAsignacion(variables, fila.asignacion)}, ` +
        'determina el valor de verdad de la proposición completa.',
      formula: spec.formula,
      variables,
      asignacion: fila.asignacion,
      esperada: evaluateFormula(spec.formula, rowToEnv(variables, fila.asignacion)),
    });

    // 3) Ejercicio de operador principal.
    const op = mainOperator(spec.formula);
    banco.push({
      id: id++,
      tipo: 'operador',
      nivel: spec.nivel,
      unidad: 2,
      titulo: 'Operador principal',
      enunciado:
        'Observa la proposición y selecciona cuál es su conectiva principal ' +
        '(el operador de mayor jerarquía que la gobierna).',
      formula: spec.formula,
      variables,
      opciones: OPC_OPERADOR,
      esperada: op,
    });

    // 4) Clasificación (sólo para fórmulas de nivel 2 y 3).
    if (spec.nivel >= 2) {
      banco.push({
        id: id++,
        tipo: 'clasificacion',
        nivel: spec.nivel,
        unidad: 2,
        titulo: 'Clasificación',
        enunciado:
          'Clasifica la proposición según su tabla de verdad: ¿es una ' +
          'tautología, una contradicción o una contingencia?',
        formula: spec.formula,
        variables,
        opciones: OPC_CLASIF,
        esperada: classifyFormula(spec.formula),
      });
    }
  });

  return banco;
}

/** Asigna ids consecutivos a un banco ya construido. */
function reindexar(ejercicios: Exercise[]): Exercise[] {
  return ejercicios.map((e, i) => ({ ...e, id: i + 1 }));
}

/**
 * Banco completo: tablas de verdad + ejercicios de las 4 unidades
 * (reglas de inferencia, validez, categóricas, falacias y conceptos).
 */
export const EXERCISE_BANK: Exercise[] = reindexar([
  ...construirBanco(),
  ...buildQuestionBank(),
]);

/** Número total de ejercicios disponibles (útil para mostrar en la UI). */
export const TOTAL_EXERCISES = EXERCISE_BANK.length;

/** Etiquetas legibles de respuestas, exportadas para la UI y los reportes. */
export const OPERADOR_LABELS = ETIQUETA_OPERADOR;
export const CLASIFICACION_LABELS = ETIQUETA_CLASIFICACION;
