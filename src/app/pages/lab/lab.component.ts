import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  allAssignments,
  evaluateNode,
  parseExpression,
  rowToEnv,
  LogicNode,
  renderNode,
  subformulaColumns,
  variablesOf,
} from '../../core/logic-engine';
import { Classification } from '../../core/models';

interface LabColumn {
  label: string;
  node: LogicNode;
  esFinal: boolean;
}

interface LabRow {
  asignacion: boolean[];
  valores: boolean[];
}

interface LabResult {
  ok: true;
  variables: string[];
  columns: LabColumn[];
  rows: LabRow[];
  clasif: Classification;
}

interface LabError {
  ok: false;
  mensaje: string;
}

interface Tecla {
  texto: string;
  insertar: string;
  tipo?: 'var' | 'op' | 'paren' | 'accion';
}

@Component({
  selector: 'app-lab',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.css',
})
export class LabComponent {
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('entrada');

  readonly formula = signal('(p ∧ q) → r');

  /** Teclado de símbolos para no tener que escribirlos. */
  readonly teclas: Tecla[] = [
    { texto: 'p', insertar: 'p', tipo: 'var' },
    { texto: 'q', insertar: 'q', tipo: 'var' },
    { texto: 'r', insertar: 'r', tipo: 'var' },
    { texto: 's', insertar: 's', tipo: 'var' },
    { texto: '¬', insertar: '¬', tipo: 'op' },
    { texto: '∧', insertar: '∧', tipo: 'op' },
    { texto: '∨', insertar: '∨', tipo: 'op' },
    { texto: '→', insertar: '→', tipo: 'op' },
    { texto: '↔', insertar: '↔', tipo: 'op' },
    { texto: '(', insertar: '(', tipo: 'paren' },
    { texto: ')', insertar: ')', tipo: 'paren' },
  ];

  /** Ejemplos listos para tocar y entender. */
  readonly ejemplos: { etiqueta: string; formula: string }[] = [
    { etiqueta: 'Conjunción', formula: 'p ∧ q' },
    { etiqueta: 'Disyunción', formula: 'p ∨ q' },
    { etiqueta: 'Condicional', formula: 'p → q' },
    { etiqueta: 'Bicondicional', formula: 'p ↔ q' },
    { etiqueta: 'Negación de una conjunción', formula: '¬(p ∧ q)' },
    { etiqueta: 'Tautología', formula: 'p ∨ ¬p' },
    { etiqueta: 'Contradicción', formula: 'p ∧ ¬p' },
    { etiqueta: 'Con tres variables', formula: '(p ∧ q) → r' },
  ];

  /** Resultado de analizar la fórmula actual. */
  readonly resultado = computed<LabResult | LabError>(() => {
    const f = this.formula().trim();
    if (!f) {
      return { ok: false, mensaje: 'Escribe una fórmula o toca un ejemplo para empezar.' };
    }
    try {
      const ast = parseExpression(f);
      const variables = variablesOf(ast);
      const subs = subformulaColumns(ast);

      // Fórmula que es una sola variable: la columna final es esa variable.
      const columns: LabColumn[] =
        subs.length > 0
          ? subs.map((s, i) => ({ label: s.label, node: s.node, esFinal: i === subs.length - 1 }))
          : [{ label: renderNode(ast), node: ast, esFinal: true }];

      const rows: LabRow[] = allAssignments(variables.length).map((asignacion) => {
        const env = rowToEnv(variables, asignacion);
        return { asignacion, valores: columns.map((c) => evaluateNode(c.node, env)) };
      });

      const finales = rows.map((r) => r.valores[r.valores.length - 1]);
      const clasif: Classification = finales.every(Boolean)
        ? 'tautologia'
        : finales.every((v) => !v)
          ? 'contradiccion'
          : 'contingencia';

      return { ok: true, variables, columns, rows, clasif };
    } catch (e) {
      return { ok: false, mensaje: (e as Error).message };
    }
  });

  /** Resumen legible de la clasificación. */
  readonly clasifTexto: Record<Classification, { titulo: string; detalle: string; clase: string }> = {
    tautologia: {
      titulo: 'Tautología',
      detalle: 'La columna final es siempre Verdadera: la fórmula siempre se cumple.',
      clase: 'tautologia',
    },
    contradiccion: {
      titulo: 'Contradicción',
      detalle: 'La columna final es siempre Falsa: la fórmula nunca se cumple.',
      clase: 'contradiccion',
    },
    contingencia: {
      titulo: 'Contingencia',
      detalle: 'Hay filas verdaderas y falsas: depende de los valores de las variables.',
      clase: 'contingencia',
    },
  };

  onInput(event: Event): void {
    this.formula.set((event.target as HTMLInputElement).value);
  }

  onClickTecla(tecla: Tecla): void {
    const el = this.input()?.nativeElement;
    if (!el) {
      this.formula.update((f) => f + tecla.insertar);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const nuevo = el.value.slice(0, start) + tecla.insertar + el.value.slice(end);
    this.formula.set(nuevo);
    queueMicrotask(() => {
      el.focus();
      const pos = start + tecla.insertar.length;
      el.setSelectionRange(pos, pos);
    });
  }

  borrarUno(): void {
    const el = this.input()?.nativeElement;
    const actual = this.formula();
    if (!el) {
      this.formula.set(actual.slice(0, -1));
      return;
    }
    const start = el.selectionStart ?? actual.length;
    const end = el.selectionEnd ?? start;
    if (start !== end) {
      const nuevo = actual.slice(0, start) + actual.slice(end);
      this.formula.set(nuevo);
      queueMicrotask(() => {
        el.focus();
        el.setSelectionRange(start, start);
      });
      return;
    }
    const pos = Math.max(0, start - 1);
    const nuevo = actual.slice(0, pos) + actual.slice(start);
    this.formula.set(nuevo);
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  limpiar(): void {
    this.formula.set('');
    queueMicrotask(() => this.input()?.nativeElement.focus());
  }

  usarEjemplo(formula: string): void {
    this.formula.set(formula);
    queueMicrotask(() => this.input()?.nativeElement.focus());
  }

  vf(valor: boolean): string {
    return valor ? 'V' : 'F';
  }
}
