import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { buildTruthTable } from '../../core/logic-engine';
import { TruthRow } from '../../core/models';

interface OperatorCard {
  simbolo: string;
  nombre: string;
  enIngles: string;
  descripcion: string;
  regla: string;
  color: string;
}

interface ExampleBlock {
  titulo: string;
  formula: string;
  pasos: string[];
  variables: string[];
  rows: TruthRow[];
  nota: string;
}

interface RuleCard {
  nombre: string;
  forma: string[];
  conclusion: string;
  ejemplo: string;
  color: string;
}

@Component({
  selector: 'app-unit-proposicional',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './proposicional.component.html',
})
export class ProposicionalComponent {
  readonly operadores: OperatorCard[] = [
    {
      simbolo: '¬',
      nombre: 'Negación',
      enIngles: 'NOT',
      descripcion: 'Invierte el valor de verdad de una proposición.',
      regla: 'V → F y F → V',
      color: '#ef476f',
    },
    {
      simbolo: '∧',
      nombre: 'Conjunción',
      enIngles: 'AND',
      descripcion: 'Verdadera sólo si ambas proposiciones son verdaderas.',
      regla: 'V ∧ V = V',
      color: '#118ab2',
    },
    {
      simbolo: '∨',
      nombre: 'Disyunción',
      enIngles: 'OR',
      descripcion: 'Verdadera si al menos una proposición es verdadera.',
      regla: 'F ∨ F = F',
      color: '#06d6a0',
    },
    {
      simbolo: '→',
      nombre: 'Condicional',
      enIngles: 'IMPLIES',
      descripcion: 'Verdadera salvo cuando el antecedente es V y el consecuente F.',
      regla: 'Sólo V → F = F',
      color: '#f78c6b',
    },
    {
      simbolo: '↔',
      nombre: 'Bicondicional',
      enIngles: 'IFF',
      descripcion: 'Verdadera cuando ambas proposiciones tienen el mismo valor.',
      regla: 'V↔V y F↔F = V',
      color: '#8338ec',
    },
  ];

  readonly ejemplos: ExampleBlock[] = [
    this.crearEjemplo(
      'Conjunción · p ∧ q',
      'p ∧ q',
      [
        'Con 2 variables generamos 2² = 4 filas.',
        'La conjunción exige que AMBAS sean verdaderas.',
        'Sólo la fila (V, V) produce V.',
      ],
      'Basta que una sea falsa para que todo sea falso.',
    ),
    this.crearEjemplo(
      'Condicional · p → q',
      'p → q',
      [
        'El condicional sólo falla con antecedente V y consecuente F.',
        'Las filas (V,V), (F,V) y (F,F) dan V.',
        'La única fila falsa es (V, F).',
      ],
      'Regla de oro: "V → F" es el único caso falso.',
    ),
    this.crearEjemplo(
      'Negación compuesta · ¬(p ∧ q)',
      '¬(p ∧ q)',
      [
        'Primero se resuelve el paréntesis p ∧ q.',
        'Luego se niega el resultado.',
        'Esta fórmula equivale a ¬p ∨ ¬q (Ley de De Morgan).',
      ],
      'Verdadera salvo cuando p y q son verdaderas a la vez.',
    ),
  ];

  /** Reglas de inferencia (Unidad II). */
  readonly reglas: RuleCard[] = [
    { nombre: 'Modus Ponendo Ponens', forma: ['p → q', 'p'], conclusion: 'q', ejemplo: 'Si llueve, la calle se moja. Llueve. ⟹ Se moja.', color: '#8b5cf6' },
    { nombre: 'Modus Tollendo Tollens', forma: ['p → q', '¬q'], conclusion: '¬p', ejemplo: 'Si hay corte, no hay internet. Hay internet. ⟹ No hay corte.', color: '#22d3ee' },
    { nombre: 'Silogismo Hipotético', forma: ['p → q', 'q → r'], conclusion: 'p → r', ejemplo: 'Si A entonces B; si B entonces C. ⟹ Si A entonces C.', color: '#f472b6' },
    { nombre: 'Silogismo Disyuntivo', forma: ['p ∨ q', '¬p'], conclusion: 'q', ejemplo: 'Es eléctrico o mecánico. No es eléctrico. ⟹ Es mecánico.', color: '#34d399' },
    { nombre: 'Dilema Constructivo', forma: ['(p → q) ∧ (r → s)', 'p ∨ r'], conclusion: 'q ∨ s', ejemplo: 'Dos condicionales y una disyunción de antecedentes.', color: '#fbbf24' },
    { nombre: 'Doble Negación', forma: ['¬¬p'], conclusion: 'p', ejemplo: 'No es cierto que no funcione. ⟹ Funciona.', color: '#a78bfa' },
    { nombre: 'Simplificación', forma: ['p ∧ q'], conclusion: 'p', ejemplo: 'De una conjunción se recupera cualquier componente.', color: '#38bdf8' },
    { nombre: 'Conjunción', forma: ['p', 'q'], conclusion: 'p ∧ q', ejemplo: 'De dos proposiciones se forma su conjunción.', color: '#fb7185' },
    { nombre: 'Adición', forma: ['p'], conclusion: 'p ∨ q', ejemplo: 'De p se deduce p ∨ q (disyunción débil).', color: '#4ade80' },
  ];

  readonly tiposResultado = [
    { nombre: 'Tautología', desc: 'La columna de resultado es siempre V.', forma: 'VVVV', clase: 'tautologia' },
    { nombre: 'Contradicción', desc: 'La columna de resultado es siempre F.', forma: 'FFFF', clase: 'contradiccion' },
    { nombre: 'Contingencia', desc: 'Hay valores V y F.', forma: 'V…F', clase: 'contingencia' },
  ];

  private crearEjemplo(
    titulo: string,
    formula: string,
    pasos: string[],
    nota: string,
  ): ExampleBlock {
    const t = buildTruthTable(formula);
    return { titulo, formula, pasos, variables: t.variables, rows: t.rows, nota };
  }

  vf(valor: boolean): string {
    return valor ? 'V' : 'F';
  }
}
