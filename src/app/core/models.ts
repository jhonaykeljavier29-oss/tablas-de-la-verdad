/**
 * Modelos centrales de la aplicación.
 * Cubre las 4 unidades del material de "Fundamentos de Lógica".
 */

/** Los cinco operadores lógicos soportados. */
export type LogicalOperator = 'not' | 'and' | 'or' | 'imp' | 'iff';

/**
 * Tipos de pregunta del banco.
 * - Propios de tablas de verdad: `tabla`, `valor`, `operador`, `clasificacion`.
 * - Unidad I: `concepto`.
 * - Unidad II: `regla` (reglas de inferencia), `validez` (argumentos).
 * - Unidad III: `categorica` (A/E/I/O), `falacia`.
 */
export type ExerciseType =
  | 'tabla'
  | 'valor'
  | 'operador'
  | 'clasificacion'
  | 'concepto'
  | 'regla'
  | 'validez'
  | 'categorica'
  | 'falacia';

/** Nivel de dificultad (1 = básico, 2 = medio, 3 = avanzado). */
export type Difficulty = 1 | 2 | 3;

/** Clasificación global de una proposición. */
export type Classification = 'tautologia' | 'contradiccion' | 'contingencia';

/** Etiquetas legibles para los operadores. */
export const OPERATOR_LABELS: Record<LogicalOperator, string> = {
  not: 'Negación (¬)',
  and: 'Conjunción (∧)',
  or: 'Disyunción (∨)',
  imp: 'Condicional (→)',
  iff: 'Bicondicional (↔)',
};

/** Símbolos cortos de cada operador para la UI. */
export const OPERATOR_SYMBOLS: Record<LogicalOperator, string> = {
  not: '¬',
  and: '∧',
  or: '∨',
  imp: '→',
  iff: '↔',
};

/** Una opción de respuesta de selección múltiple. */
export interface ExerciseOption {
  /** Valor interno usado para calificar. */
  valor: string;
  /** Texto visible. */
  etiqueta: string;
  /** Texto secundario opcional (p. ej. el símbolo o la forma lógica). */
  sub?: string;
}

/** Una fila de la tabla de verdad con su asignación y valor esperado. */
export interface TruthRow {
  asignacion: boolean[];
  valor: boolean;
}

/** Pregunta genérica del banco de ejercicios. */
export interface Exercise {
  id: number;
  tipo: ExerciseType;
  nivel: Difficulty;
  /** Unidad del material a la que pertenece (1..4). */
  unidad: 1 | 2 | 3 | 4;
  titulo: string;
  enunciado: string;
  /** Fórmula en notación bonita (vacío si la pregunta es conceptual). */
  formula: string;
  variables: string[];
  /** Opciones para preguntas de selección múltiple. */
  opciones?: ExerciseOption[];
  /** Sólo para `tabla`: filas con la asignación y el valor esperado. */
  filas?: TruthRow[];
  /** Sólo para `valor`: asignación concreta a evaluar. */
  asignacion?: boolean[];
  /** Sólo para `validez`: premisas del argumento. */
  premisas?: string[];
  /** Respuesta esperada: boolean (valor) o string (opción). */
  esperada?: boolean | string;
}

/** Respuesta del estudiante para una pregunta. */
export interface StudentAnswer {
  valores?: (boolean | null)[];
  opcion?: string | null;
}

/** Resultado de calificar una sola pregunta. */
export interface QuestionResult {
  exercise: Exercise;
  answer: StudentAnswer;
  correcta: boolean;
  parcial: number;
  detalle?: { asignacion: boolean[]; esperado: boolean; marcado: boolean | null }[];
  respuestaEsperada: string;
  respuestaEstudiante: string;
}

/** Resultado global del examen. */
export interface ExamResult {
  fecha: string;
  total: number;
  aciertos: number;
  errores: number;
  sinResponder: number;
  notaSobre100: number;
  notaSobre20: number;
  preguntas: QuestionResult[];
}
