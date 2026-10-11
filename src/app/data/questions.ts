import { isArgumentValid } from '../core/logic-engine';
import { Exercise, ExerciseOption } from '../core/models';

/**
 * Banco de preguntas NO basadas en tablas de verdad.
 * Cubre:
 *  - Unidad I: conceptos de lógica.
 *  - Unidad II: reglas de inferencia y validez de argumentos.
 *  - Unidad III: proposiciones categóricas (A/E/I/O) y falacias.
 *  - Unidad IV: aplicación en la ingeniería (preguntas conceptuales).
 *
 * Las respuestas de los argumentos se calculan con el motor lógico, por lo que
 * nunca hay errores de calificación.
 */

/* ------------------------------------------------------------------ */
/* Conjuntos de opciones reutilizables                                 */
/* ------------------------------------------------------------------ */

const OPC_OPERADOR: ExerciseOption[] = [
  { valor: 'and', etiqueta: 'Conjunción', sub: '∧' },
  { valor: 'or', etiqueta: 'Disyunción', sub: '∨' },
  { valor: 'not', etiqueta: 'Negación', sub: '¬' },
  { valor: 'imp', etiqueta: 'Condicional', sub: '→' },
  { valor: 'iff', etiqueta: 'Bicondicional', sub: '↔' },
];

const OPC_CLASIF: ExerciseOption[] = [
  { valor: 'tautologia', etiqueta: 'Tautología', sub: 'Siempre V' },
  { valor: 'contradiccion', etiqueta: 'Contradicción', sub: 'Siempre F' },
  { valor: 'contingencia', etiqueta: 'Contingencia', sub: 'V y F' },
];

const OPC_REGLA: ExerciseOption[] = [
  { valor: 'mpp', etiqueta: 'Modus Ponendo Ponens (MPP)' },
  { valor: 'mtt', etiqueta: 'Modus Tollendo Tollens (MTT)' },
  { valor: 'sh', etiqueta: 'Silogismo Hipotético (SH)' },
  { valor: 'sd', etiqueta: 'Silogismo Disyuntivo (SD)' },
  { valor: 'dc', etiqueta: 'Dilema Constructivo (DC)' },
  { valor: 'dn', etiqueta: 'Doble Negación (DN)' },
  { valor: 'simp', etiqueta: 'Simplificación (Simp)' },
  { valor: 'conj', etiqueta: 'Conjunción (Conj)' },
  { valor: 'ad', etiqueta: 'Adición (Ad)' },
];

const OPC_VALIDEZ: ExerciseOption[] = [
  { valor: 'valido', etiqueta: 'Válido', sub: 'La conclusión se sigue necesariamente' },
  { valor: 'invalido', etiqueta: 'Inválido', sub: 'Existe un contraejemplo posible' },
];

const OPC_CATEGORICA: ExerciseOption[] = [
  { valor: 'A', etiqueta: 'Universal Afirmativa (A)', sub: 'Todo S es P' },
  { valor: 'E', etiqueta: 'Universal Negativa (E)', sub: 'Ningún S es P' },
  { valor: 'I', etiqueta: 'Particular Afirmativa (I)', sub: 'Algún S es P' },
  { valor: 'O', etiqueta: 'Particular Negativa (O)', sub: 'Algún S no es P' },
];

const OPC_FALACIA: ExerciseOption[] = [
  { valor: 'ad-baculum', etiqueta: 'Apelación a la fuerza (Ad Baculum)' },
  { valor: 'ad-hominem', etiqueta: 'Ataque personal (Ad Hominem)' },
  { valor: 'ad-ignorantiam', etiqueta: 'Apelación a la ignorancia (Ad Ignorantiam)' },
  { valor: 'ad-misericordiam', etiqueta: 'Llamado a la piedad (Ad Misericordiam)' },
  { valor: 'ad-verecundiam', etiqueta: 'Apelación inapropiada a la autoridad (Ad Verecundiam)' },
  { valor: 'red-herring', etiqueta: 'Pista falsa (Red Herring)' },
  { valor: 'equivoco', etiqueta: 'Equívoco' },
  { valor: 'anfibologia', etiqueta: 'Anfibología' },
  { valor: 'enfasis', etiqueta: 'Énfasis' },
  { valor: 'composicion', etiqueta: 'Composición' },
  { valor: 'division', etiqueta: 'División' },
  { valor: 'afir-consecuente', etiqueta: 'Afirmación del consecuente (formal)' },
  { valor: 'neg-antecedente', etiqueta: 'Negación del antecedente (formal)' },
];

/* ------------------------------------------------------------------ */
/* Unidad II · Reglas de inferencia                                    */
/* ------------------------------------------------------------------ */

interface RuleSpec {
  id: string;
  nombre: string;
  premisas: string[];
  conclusion: string;
  ejemplo: string;
}

const REGLAS: RuleSpec[] = [
  {
    id: 'mpp',
    nombre: 'Modus Ponendo Ponens (MPP)',
    premisas: ['p → q', 'p'],
    conclusion: 'q',
    ejemplo: 'Si el voltaje supera 220 V, el fusible se quema. El voltaje supera 220 V. Por lo tanto, el fusible se quema.',
  },
  {
    id: 'mtt',
    nombre: 'Modus Tollendo Tollens (MTT)',
    premisas: ['p → q', '¬q'],
    conclusion: '¬p',
    ejemplo: 'Si hay corte de red, no hay internet. Hay internet. Por lo tanto, no hay corte de red.',
  },
  {
    id: 'sh',
    nombre: 'Silogismo Hipotético (SH)',
    premisas: ['p → q', 'q → r'],
    conclusion: 'p → r',
    ejemplo: 'Si estudio, apruebo. Si apruebo, celebro. Por lo tanto, si estudio, celebro.',
  },
  {
    id: 'sd',
    nombre: 'Silogismo Disyuntivo (SD)',
    premisas: ['p ∨ q', '¬p'],
    conclusion: 'q',
    ejemplo: 'El sensor es óptico o es inductivo. No es óptico. Por lo tanto, es inductivo.',
  },
  {
    id: 'dc',
    nombre: 'Dilema Constructivo (DC)',
    premisas: ['(p → q) ∧ (r → s)', 'p ∨ r'],
    conclusion: 'q ∨ s',
    ejemplo: 'Si llueve, suspendo la obra; si hace sol, avanzo. Llueve o hace sol. Por lo tanto, suspendo la obra o avanzo.',
  },
  {
    id: 'dn',
    nombre: 'Doble Negación (DN)',
    premisas: ['¬¬p'],
    conclusion: 'p',
    ejemplo: 'No es cierto que el sistema no funcione. Por lo tanto, el sistema funciona.',
  },
  {
    id: 'simp',
    nombre: 'Simplificación (Simp)',
    premisas: ['p ∧ q'],
    conclusion: 'p',
    ejemplo: 'El motor está calibrado y lubricado. Por lo tanto, el motor está calibrado.',
  },
  {
    id: 'conj',
    nombre: 'Conjunción (Conj)',
    premisas: ['p', 'q'],
    conclusion: 'p ∧ q',
    ejemplo: 'El sensor es preciso. El sensor es rápido. Por lo tanto, el sensor es preciso y rápido.',
  },
  {
    id: 'ad',
    nombre: 'Adición (Ad)',
    premisas: ['p'],
    conclusion: 'p ∨ q',
    ejemplo: 'El servidor está en línea. Por lo tanto, el servidor está en línea o está en mantenimiento.',
  },
];

/* ------------------------------------------------------------------ */
/* Unidad II · Argumentos para validar (respuesta calculada)           */
/* ------------------------------------------------------------------ */

interface ArgSpec {
  premisas: string[];
  conclusion: string;
  contexto: string;
}

const ARGUMENTOS: ArgSpec[] = [
  { premisas: ['p → q', 'p'], conclusion: 'q', contexto: 'Si el circuito se sobrecarga, el breaker salta. El circuito se sobrecarga.' },
  { premisas: ['p → q', '¬q'], conclusion: '¬p', contexto: 'Si hay datos, el LED parpadea. El LED no parpadea.' },
  { premisas: ['p → q', 'q → r'], conclusion: 'p → r', contexto: 'Si compila, se empaqueta. Si se empaqueta, se publica.' },
  { premisas: ['p ∨ q', '¬p'], conclusion: 'q', contexto: 'El error es de hardware o de software. No es de hardware.' },
  { premisas: ['(p → q) ∧ (r → s)', 'p ∨ r'], conclusion: 'q ∨ s', contexto: 'Si sube la temperatura, activo el ventilador; si sube la presión, cierro la válvula. Sube la temperatura o la presión.' },
  { premisas: ['¬¬p'], conclusion: 'p', contexto: 'No es el caso que el sistema no esté activo.' },
  { premisas: ['p ∧ q'], conclusion: 'p', contexto: 'El motor está calibrado y lubricado.' },
  { premisas: ['p ∧ q'], conclusion: 'q', contexto: 'El motor está calibrado y lubricado.' },
  { premisas: ['p', 'q'], conclusion: 'p ∧ q', contexto: 'El sensor es preciso. El sensor es rápido.' },
  { premisas: ['p'], conclusion: 'p ∨ q', contexto: 'El servidor está en línea.' },
  { premisas: ['p → q', 'q'], conclusion: 'p', contexto: 'Si el programa es correcto, pasa los tests. Pasa los tests.' },
  { premisas: ['p → q', '¬p'], conclusion: '¬q', contexto: 'Si el cable está conectado, hay señal. El cable no está conectado.' },
  { premisas: ['p ∨ q'], conclusion: 'p', contexto: 'El fallo es eléctrico o mecánico.' },
  { premisas: ['p → q'], conclusion: 'q', contexto: 'Si el usuario hace login, accede al panel.' },
  { premisas: ['p ∨ q', 'p'], conclusion: '¬q', contexto: 'El equipo es eléctrico o híbrido. El equipo es eléctrico.' },
  { premisas: ['p → q', 'q → r'], conclusion: 'r', contexto: 'Si A entonces B. Si B entonces C.' },
];

/* ------------------------------------------------------------------ */
/* Unidad III · Proposiciones categóricas                              */
/* ------------------------------------------------------------------ */

interface CatSpec {
  enunciado: string;
  tipo: 'A' | 'E' | 'I' | 'O';
}

const CATEGORICAS: CatSpec[] = [
  { enunciado: 'Todos los ingenieros son lógicos.', tipo: 'A' },
  { enunciado: 'Todo PLC es un controlador lógico programable.', tipo: 'A' },
  { enunciado: 'Ningún metal es un aislante.', tipo: 'E' },
  { enunciado: 'Ningún cortocircuito es deseable.', tipo: 'E' },
  { enunciado: 'Algún estudiante es becado.', tipo: 'I' },
  { enunciado: 'Algún sensor es óptico.', tipo: 'I' },
  { enunciado: 'Algún software no es seguro.', tipo: 'O' },
  { enunciado: 'Algún sensor no funciona.', tipo: 'O' },
  { enunciado: 'Todos los sistemas de control incluyen retroalimentación.', tipo: 'A' },
  { enunciado: 'Ningún algoritmo es infalible.', tipo: 'E' },
  { enunciado: 'Algún error es de tipografía.', tipo: 'I' },
  { enunciado: 'Algún proyecto no cumple el presupuesto.', tipo: 'O' },
];

interface CatFormSpec {
  forma: string;
  tipo: 'A' | 'E' | 'I' | 'O';
}

const CATEGORICAS_FORMA: CatFormSpec[] = [
  { forma: 'Ningún S es P', tipo: 'E' },
  { forma: 'Todo S es P', tipo: 'A' },
  { forma: 'Algún S no es P', tipo: 'O' },
  { forma: 'Algún S es P', tipo: 'I' },
];

/* ------------------------------------------------------------------ */
/* Unidad III · Falacias                                               */
/* ------------------------------------------------------------------ */

interface FallacySpec {
  texto: string;
  tipo: string;
  nombre: string;
}

const FALACIAS: FallacySpec[] = [
  { texto: 'Aprueba mi propuesta de diseño o tendrás problemas conmigo.', tipo: 'ad-baculum', nombre: 'Ad Baculum' },
  { texto: 'No le hagas caso a su análisis del circuito: es un mal programador.', tipo: 'ad-hominem', nombre: 'Ad Hominem' },
  { texto: 'Nadie ha demostrado que este reactor sea inseguro, así que es completamente seguro.', tipo: 'ad-ignorantiam', nombre: 'Ad Ignorantiam' },
  { texto: 'Debes darme el contrato, soy padre de familia y necesito el dinero.', tipo: 'ad-misericordiam', nombre: 'Ad Misericordiam' },
  { texto: 'Un famoso futbolista dijo que este puente es seguro, así que no hay de qué preocuparse.', tipo: 'ad-verecundiam', nombre: 'Ad Verecundiam' },
  { texto: '¿Por qué me preguntas por el presupuesto excedido? Mejor hablemos de lo bonito que quedó el logo.', tipo: 'red-herring', nombre: 'Red Herring' },
  { texto: 'El banco de la plaza se desbordó justo cuando el banco negó el crédito.', tipo: 'equivoco', nombre: 'Equívoco' },
  { texto: 'Vendemos mantas para niños de lana.', tipo: 'anfibologia', nombre: 'Anfibología' },
  { texto: 'NO dije que él alteró los datos (dando a entender que alguien más lo hizo).', tipo: 'enfasis', nombre: 'Énfasis' },
  { texto: 'Cada componente del motor es ligero, por lo tanto el motor completo es ligero.', tipo: 'composicion', nombre: 'Composición' },
  { texto: 'La empresa es rentable, por lo tanto cada empleado es rentable.', tipo: 'division', nombre: 'División' },
  { texto: 'Si el depósito está lleno, la bomba funciona. La bomba funciona; por lo tanto, el depósito está lleno.', tipo: 'afir-consecuente', nombre: 'Afirmación del consecuente' },
  { texto: 'Si el depósito está lleno, la bomba funciona. El depósito no está lleno; por lo tanto, la bomba no funciona.', tipo: 'neg-antecedente', nombre: 'Negación del antecedente' },
  { texto: 'Es verdad que este material es caro porque me lo dijo el jefe, y como jefe sabe de todo, es caro.', tipo: 'ad-verecundiam', nombre: 'Ad Verecundiam' },
  { texto: 'No se puede probar que el registro esté falsificado, entonces es auténtico.', tipo: 'ad-ignorantiam', nombre: 'Ad Ignorantiam' },
  { texto: 'Su propuesta de energía solar es mala porque él nunca ha usado paneles solares.', tipo: 'ad-hominem', nombre: 'Ad Hominem' },
  { texto: 'Firma el acuerdo o retiro el financiamiento del laboratorio.', tipo: 'ad-baculum', nombre: 'Ad Baculum' },
  { texto: 'Apruébeme, mi mamá está enferma y no puedo repetir la materia.', tipo: 'ad-misericordiam', nombre: 'Ad Misericordiam' },
  { texto: 'El operador pesa el reporte; el reporte técnico pesa poco, por lo tanto no sirve.', tipo: 'equivoco', nombre: 'Equívoco' },
  { texto: 'Se solicita persona con auto propio y buena presencia (¿propio de qué?).', tipo: 'anfibologia', nombre: 'Anfibología' },
];

/* ------------------------------------------------------------------ */
/* Unidad I y IV · Preguntas conceptuales                              */
/* ------------------------------------------------------------------ */

interface ConceptSpec {
  pregunta: string;
  unidad: 1 | 4;
  opciones: ExerciseOption[];
  correcta: string;
  formula?: string;
}

const CONCEPTOS: ConceptSpec[] = [
  {
    pregunta: '¿Qué significa etimológicamente el término "lógica" (logos)?',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Palabra, discurso y razón' },
      { valor: 'b', etiqueta: 'Número, medida y cálculo' },
      { valor: 'c', etiqueta: 'Fuerza, poder y dominio' },
      { valor: 'd', etiqueta: 'Imagen, símbolo y dibujo' },
    ],
    correcta: 'a',
  },
  {
    pregunta: 'El principio lógico que afirma "A = A" (todo objeto es idéntico a sí mismo) es el de:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Tercio excluido' },
      { valor: 'b', etiqueta: 'Identidad' },
      { valor: 'c', etiqueta: 'Razón suficiente' },
      { valor: 'd', etiqueta: 'No-contradicción' },
    ],
    correcta: 'b',
    formula: 'A = A',
  },
  {
    pregunta: 'El principio "es imposible que algo sea y no sea al mismo tiempo" corresponde a:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'No-contradicción' },
      { valor: 'b', etiqueta: 'Identidad' },
      { valor: 'c', etiqueta: 'Tercio excluido' },
      { valor: 'd', etiqueta: 'Doble negación' },
    ],
    correcta: 'a',
    formula: '¬(A ∧ ¬A)',
  },
  {
    pregunta: 'La expresión "A ∨ ¬A" (algo es o no es, sin término medio) corresponde al principio de:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Razón suficiente' },
      { valor: 'b', etiqueta: 'Identidad' },
      { valor: 'c', etiqueta: 'Tercio excluido' },
      { valor: 'd', etiqueta: 'No-contradicción' },
    ],
    correcta: 'c',
    formula: 'A ∨ ¬A',
  },
  {
    pregunta: 'El principio que exige que todo juicio tenga un fundamento que lo justifique es el de:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Tercio excluido' },
      { valor: 'b', etiqueta: 'Identidad' },
      { valor: 'c', etiqueta: 'No-contradicción' },
      { valor: 'd', etiqueta: 'Razón suficiente' },
    ],
    correcta: 'd',
  },
  {
    pregunta: 'El portador de valor de verdad (puede ser verdadero o falso) es:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'El juicio' },
      { valor: 'b', etiqueta: 'El enunciado' },
      { valor: 'c', etiqueta: 'La proposición' },
      { valor: 'd', etiqueta: 'El concepto' },
    ],
    correcta: 'c',
  },
  {
    pregunta: 'La expresión lingüística material (la oración física que se pronuncia o escribe) se denomina:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Proposición' },
      { valor: 'b', etiqueta: 'Enunciado' },
      { valor: 'c', etiqueta: 'Juicio' },
      { valor: 'd', etiqueta: 'Argumento' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'El acto mental interno por el cual se afirma o niega una relación entre conceptos es el:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Enunciado' },
      { valor: 'b', etiqueta: 'Juicio' },
      { valor: 'c', etiqueta: 'Silogismo' },
      { valor: 'd', etiqueta: 'Término' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'Un argumento es SÓLIDO cuando:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Sólo su forma es válida' },
      { valor: 'b', etiqueta: 'Es válido y además todas sus premisas son verdaderas' },
      { valor: 'c', etiqueta: 'La conclusión es popular' },
      { valor: 'd', etiqueta: 'Sus premisas son falsas' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'La validez de un argumento depende de:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'La verdad fáctica de las premisas' },
      { valor: 'b', etiqueta: 'Su estructura o forma lógica' },
      { valor: 'c', etiqueta: 'La opinión de un experto' },
      { valor: 'd', etiqueta: 'El número de premisas' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'La función del lenguaje que transmite hechos y puede evaluarse como verdadera o falsa es:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Expresiva' },
      { valor: 'b', etiqueta: 'Directiva' },
      { valor: 'c', etiqueta: 'Informativa' },
      { valor: 'd', etiqueta: 'Poética' },
    ],
    correcta: 'c',
  },
  {
    pregunta: 'La expresión "Reinicie el controlador" cumple una función del lenguaje:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Informativa' },
      { valor: 'b', etiqueta: 'Expresiva' },
      { valor: 'c', etiqueta: 'Directiva' },
      { valor: 'd', etiqueta: 'Declarativa' },
    ],
    correcta: 'c',
  },
  {
    pregunta: 'Cuando se crea un significado nuevo para un término o símbolo dentro de un contexto, la definición es:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Léxica' },
      { valor: 'b', etiqueta: 'Estipulativa' },
      { valor: 'c', etiqueta: 'Aclaratoria' },
      { valor: 'd', etiqueta: 'Teórica' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'La definición que recoge el significado de uso común, tal como aparece en el diccionario, es:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Estipulativa' },
      { valor: 'b', etiqueta: 'Léxica' },
      { valor: 'c', etiqueta: 'Teórica' },
      { valor: 'd', etiqueta: 'Aclaratoria' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'Una frase que admite múltiples interpretaciones y puede llevar a conclusiones técnicas opuestas presenta:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Vaguedad' },
      { valor: 'b', etiqueta: 'Ambigüedad' },
      { valor: 'c', etiqueta: 'Precisión' },
      { valor: 'd', etiqueta: 'Sinonimia' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'Decir "el sistema es rápido" sin especificar una métrica de tiempo es un ejemplo de:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Ambigüedad' },
      { valor: 'b', etiqueta: 'Vaguedad' },
      { valor: 'c', etiqueta: 'Equívoco' },
      { valor: 'd', etiqueta: 'Anfibología' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'La rama de la semiótica que estudia la relación de los signos entre sí es la:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Semántica' },
      { valor: 'b', etiqueta: 'Pragmática' },
      { valor: 'c', etiqueta: 'Sintaxis' },
      { valor: 'd', etiqueta: 'Fonética' },
    ],
    correcta: 'c',
  },
  {
    pregunta: 'La rama de la semiótica que estudia la relación entre los signos y los objetos (condiciones de verdad) es la:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Sintaxis' },
      { valor: 'b', etiqueta: 'Semántica' },
      { valor: 'c', etiqueta: 'Pragmática' },
      { valor: 'd', etiqueta: 'Morfología' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'La lógica que se ocupa del lenguaje cotidiano, la identificación de falacias y el análisis crítico es la:',
    unidad: 1,
    opciones: [
      { valor: 'a', etiqueta: 'Lógica formal' },
      { valor: 'b', etiqueta: 'Lógica informal' },
      { valor: 'c', etiqueta: 'Lógica simbólica' },
      { valor: 'd', etiqueta: 'Lógica matemática' },
    ],
    correcta: 'b',
  },
  {
    pregunta: 'Cuando un ingeniero pasa de una lógica intuitiva a premisas demostrables y modelos sin ambigüedad, aplica la lógica para:',
    unidad: 4,
    opciones: [
      { valor: 'a', etiqueta: 'Resolución de problemas técnicos' },
      { valor: 'b', etiqueta: 'Decorar informes' },
      { valor: 'c', etiqueta: 'Aumentar el presupuesto' },
      { valor: 'd', etiqueta: 'Reemplazar el diseño' },
    ],
    correcta: 'a',
  },
  {
    pregunta: 'En el diseño de control automatizado (PLC, compuertas lógicas), la lógica proposicional sirve para:',
    unidad: 4,
    opciones: [
      { valor: 'a', etiqueta: 'Garantizar consistencia estructural y evitar fallos' },
      { valor: 'b', etiqueta: 'Sustituir los sensores' },
      { valor: 'c', etiqueta: 'Eliminar la necesidad de pruebas' },
      { valor: 'd', etiqueta: 'Aumentar la resistencia del cableado' },
    ],
    correcta: 'a',
  },
  {
    pregunta: 'Según la unidad IV, rechazar falacias en propuestas técnicas contribuye a:',
    unidad: 4,
    opciones: [
      { valor: 'a', etiqueta: 'La seguridad y la sostenibilidad a largo plazo' },
      { valor: 'b', etiqueta: 'Acelerar la venta de equipos' },
      { valor: 'c', etiqueta: 'Ocultar los riesgos' },
      { valor: 'd', etiqueta: 'Reducir la precisión del análisis' },
    ],
    correcta: 'a',
  },
];

/* ------------------------------------------------------------------ */
/* Constructor del banco                                               */
/* ------------------------------------------------------------------ */

/** Construye y devuelve todas las preguntas no basadas en tablas de verdad. */
export function buildQuestionBank(): Exercise[] {
  const banco: Exercise[] = [];
  let id = 1;

  /* --- Unidad II · reglas de inferencia --- */
  for (const regla of REGLAS) {
    banco.push({
      id: id++,
      tipo: 'regla',
      nivel: 2,
      unidad: 2,
      titulo: 'Regla de inferencia',
      enunciado:
        'Identifica qué regla de inferencia corresponde a la siguiente forma argumental ' +
        `(premisas: ${regla.premisas.join(' , ')} ⊢ conclusión).`,
      formula: regla.conclusion,
      variables: [],
      premisas: regla.premisas,
      opciones: OPC_REGLA,
      esperada: regla.id,
    });
  }

  /* --- Unidad II · validez de argumentos (respuesta calculada) --- */
  for (const arg of ARGUMENTOS) {
    const valido = isArgumentValid(arg.premisas, arg.conclusion);
    banco.push({
      id: id++,
      tipo: 'validez',
      nivel: valido ? 2 : 3,
      unidad: 2,
      titulo: 'Validez del argumento',
      enunciado:
        `${arg.contexto} Por lo tanto, ${arg.conclusion}. ` +
        '¿El argumento es válido o inválido?',
      formula: arg.conclusion,
      variables: [],
      premisas: arg.premisas,
      opciones: OPC_VALIDEZ,
      esperada: valido ? 'valido' : 'invalido',
    });
  }

  /* --- Unidad III · proposiciones categóricas --- */
  for (const cat of CATEGORICAS) {
    banco.push({
      id: id++,
      tipo: 'categorica',
      nivel: 2,
      unidad: 3,
      titulo: 'Proposición categórica',
      enunciado: `Clasifica la siguiente proposición categórica: "${cat.enunciado}"`,
      formula: '',
      variables: [],
      opciones: OPC_CATEGORICA,
      esperada: cat.tipo,
    });
  }
  for (const forma of CATEGORICAS_FORMA) {
    banco.push({
      id: id++,
      tipo: 'categorica',
      nivel: 1,
      unidad: 3,
      titulo: 'Forma categórica',
      enunciado: `La forma lógica "${forma.forma}" corresponde a la proposición de tipo:`,
      formula: forma.forma,
      variables: [],
      opciones: OPC_CATEGORICA,
      esperada: forma.tipo,
    });
  }

  /* --- Unidad III · falacias --- */
  FALACIAS.forEach((f, i) => {
    banco.push({
      id: id++,
      tipo: 'falacia',
      nivel: i % 3 === 0 ? 3 : 2,
      unidad: 3,
      titulo: 'Identificación de falacia',
      enunciado: `Identifica la falacia presente en el siguiente fragmento: "${f.texto}"`,
      formula: '',
      variables: [],
      opciones: OPC_FALACIA,
      esperada: f.tipo,
    });
  });

  /* --- Unidad I y IV · conceptos --- */
  for (const c of CONCEPTOS) {
    banco.push({
      id: id++,
      tipo: 'concepto',
      nivel: c.unidad === 1 ? 1 : 2,
      unidad: c.unidad,
      titulo: 'Concepto teórico',
      enunciado: c.pregunta,
      formula: c.formula ?? '',
      variables: [],
      opciones: c.opciones,
      esperada: c.correcta,
    });
  }

  return banco;
}

// Re-exportaciones de opciones para la UI.
export { OPC_OPERADOR, OPC_CLASIF, OPC_CATEGORICA, OPC_FALACIA, OPC_REGLA, OPC_VALIDEZ };
