/** Metadatos de las unidades del material "Fundamentos de Lógica". */

export interface UnitMeta {
  id: 1 | 2 | 3 | 4;
  titulo: string;
  subtitulo: string;
  icono: string;
  color: string;
  temas: string[];
}

export const UNITS: UnitMeta[] = [
  {
    id: 1,
    titulo: 'Fundamentos de Lógica',
    subtitulo: 'Introducción, conceptos básicos y lenguaje',
    icono: '📘',
    color: '#22d3ee',
    temas: [
      'Definición y propósito de la lógica',
      'Lógica formal e informal',
      'Principios supremos de la lógica',
      'Proposiciones, enunciados y juicios',
      'Argumentos: premisas y conclusión',
      'Validez y solidez',
      'Funciones del lenguaje y definiciones',
      'Ambigüedad, vaguedad y semiótica',
    ],
  },
  {
    id: 2,
    titulo: 'Lógica Proposicional',
    subtitulo: 'Conectivas, tablas de verdad y reglas de inferencia',
    icono: '🧩',
    color: '#8b5cf6',
    temas: [
      'Conectivas lógicas (¬ ∧ ∨ → ↔)',
      'Tabla de verdad y su construcción',
      'Tautología, contradicción y contingencia',
      'Reglas de inferencia (formas válidas)',
      'Modus ponens, tollens y silogismos',
      'Métodos de prueba de validez',
    ],
  },
  {
    id: 3,
    titulo: 'Lógica Categórica y Falacias',
    subtitulo: 'Proposiciones A/E/I/O, Venn y falacias',
    icono: '🔷',
    color: '#f472b6',
    temas: [
      'Proposiciones categóricas (A, E, I, O)',
      'Diagramas de Venn',
      'Silogismos categóricos y figuras',
      'Falacias formales e informales',
      'Falacias de relevancia',
      'Falacias de ambigüedad',
    ],
  },
  {
    id: 4,
    titulo: 'Aplicación en la Ingeniería',
    subtitulo: 'Lógica aplicada al diseño y la decisión',
    icono: '⚙️',
    color: '#34d399',
    temas: [
      'Resolución de problemas técnicos',
      'Modelado lógico y sistemas complejos',
      'Control automatizado y compuertas lógicas',
      'Matrices y árboles de decisión',
      'Ética y pensamiento crítico',
    ],
  },
];

export function getUnit(id: number): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}
