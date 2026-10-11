import { Injectable, computed, signal } from '@angular/core';
import { CLASIFICACION_LABELS, EXERCISE_BANK, OPERADOR_LABELS } from '../data/exercise-bank';
import {
  Classification,
  Difficulty,
  ExamResult,
  Exercise,
  LogicalOperator,
  QuestionResult,
  StudentAnswer,
} from '../core/models';

/** Número de preguntas por defecto de cada intento de examen. */
export const PREGUNTAS_POR_EXAMEN = 20;

/**
 * Servicio que gestiona el ciclo del examen: selección aleatoria de preguntas,
 * almacenamiento de respuestas y calificación. La nota NO se expone como
 * estado reactivo para evitar trampas: sólo se devuelve al finalizar.
 */
@Injectable({ providedIn: 'root' })
export class ExamService {
  /** Preguntas del intento actual. */
  readonly preguntas = signal<Exercise[]>([]);
  /** Respuestas del estudiante, alineadas por índice con `preguntas`. */
  readonly respuestas = signal<StudentAnswer[]>([]);
  /** Indica si hay un examen en curso. */
  readonly enCurso = signal(false);
  /** Resultado del último examen finalizado (no se muestra hasta descargar). */
  readonly ultimoResultado = signal<ExamResult | null>(null);

  /** Cantidad de preguntas respondidas, útil para la barra de progreso. */
  readonly respondidas = computed(() => {
    const r = this.respuestas();
    return r.filter((a) => !this.estaVacia(a)).length;
  });

  readonly total = computed(() => this.preguntas().length);

  /**
   * Inicia un nuevo examen seleccionando `cantidad` preguntas al azar.
   * Opcionalmente se puede filtrar por niveles de dificultad.
   */
  iniciarExamen(cantidad = PREGUNTAS_POR_EXAMEN, niveles?: Difficulty[]): void {
    const pool = niveles?.length
      ? EXERCISE_BANK.filter((e) => niveles.includes(e.nivel))
      : EXERCISE_BANK;

    const seleccion = this.muestrear(pool, Math.min(cantidad, pool.length));
    this.preguntas.set(seleccion);
    this.respuestas.set(seleccion.map(() => ({}) as StudentAnswer));
    this.enCurso.set(true);
    this.ultimoResultado.set(null);
  }

  /** Guarda (o actualiza) la respuesta de una pregunta y su valor elegido. */
  responder(indice: number, valor: boolean | null, celda?: number): void {
    this.respuestas.update((actuales) => {
      const copia = actuales.map((a) => ({ ...a }));
      const pregunta = this.preguntas()[indice];
      if (!copia[indice]) copia[indice] = {};

      if (pregunta.tipo === 'valor') {
        copia[indice].valores = [valor];
      } else if (pregunta.tipo === 'tabla') {
        const arr = copia[indice].valores ? [...(copia[indice].valores as (boolean | null)[])] : [];
        const totalFilas = pregunta.filas?.length ?? 0;
        while (arr.length < totalFilas) arr.push(null);
        if (celda !== undefined) arr[celda] = valor;
        copia[indice].valores = arr;
      } else {
        copia[indice].opcion = typeof valor === 'string' ? valor : null;
      }
      return copia;
    });
  }

  /** Guarda una opción de texto (operador o clasificación). */
  responderOpcion(indice: number, opcion: string): void {
    this.respuestas.update((actuales) => {
      const copia = actuales.map((a) => ({ ...a }));
      copia[indice] = { ...(copia[indice] ?? {}), opcion };
      return copia;
    });
  }

  /** Califica el examen actual y devuelve el resultado completo. */
  finalizar(umbralSobre100 = 100): ExamResult {
    const preguntas = this.preguntas();
    const respuestas = this.respuestas();

    const detalle: QuestionResult[] = preguntas.map((ex, i) =>
      this.calificarPregunta(ex, respuestas[i] ?? {}),
    );

    const aciertos = detalle.filter((d) => d.correcta).length;
    const sinResponder = detalle.filter(
      (d) => d.respuestaEstudiante === 'Sin responder',
    ).length;
    const errores = preguntas.length - aciertos - sinResponder;
    const notaSobre100 = preguntas.length
      ? Math.round((aciertos / preguntas.length) * umbralSobre100)
      : 0;

    const resultado: ExamResult = {
      fecha: new Date().toISOString(),
      total: preguntas.length,
      aciertos,
      errores,
      sinResponder,
      notaSobre100,
      notaSobre20: Math.round((aciertos / (preguntas.length || 1)) * 20 * 10) / 10,
      preguntas: detalle,
    };

    this.ultimoResultado.set(resultado);
    this.enCurso.set(false);
    return resultado;
  }

  /** Reinicia el estado del examen. */
  reiniciar(): void {
    this.preguntas.set([]);
    this.respuestas.set([]);
    this.enCurso.set(false);
    this.ultimoResultado.set(null);
  }

  /* ------------------------- helpers internos ------------------------- */

  private estaVacia(a: StudentAnswer): boolean {
    if (a.opcion != null && a.opcion !== '') return false;
    return !(a.valores ?? []).some((v) => v !== null && v !== undefined);
  }

  private calificarPregunta(ex: Exercise, answer: StudentAnswer): QuestionResult {
    switch (ex.tipo) {
      case 'tabla':
        return this.calificarTabla(ex, answer);
      case 'valor':
        return this.calificarValor(ex, answer);
      default:
        // operador, clasificacion, concepto, regla, validez, categorica, falacia
        return this.calificarOpcion(ex, answer);
    }
  }

  private calificarTabla(ex: Exercise, answer: StudentAnswer): QuestionResult {
    const filas = ex.filas ?? [];
    const marcadas = answer.valores ?? [];
    const detalle = filas.map((fila, i) => ({
      asignacion: fila.asignacion,
      esperado: fila.valor,
      marcado: marcadas[i] ?? null,
    }));
    const correctas = detalle.filter((d) => d.marcado === d.esperado).length;
    const parcial = filas.length ? correctas / filas.length : 0;
    const respondidas = detalle.filter((d) => d.marcado !== null).length;

    return {
      exercise: ex,
      answer,
      correcta: respondidas === filas.length && correctas === filas.length,
      parcial,
      detalle,
      respuestaEsperada: filas.map((f) => (f.valor ? 'V' : 'F')).join(' , '),
      respuestaEstudiante: respondidas
        ? detalle.map((d) => (d.marcado === null ? '—' : d.marcado ? 'V' : 'F')).join(' , ')
        : 'Sin responder',
    };
  }

  private calificarValor(ex: Exercise, answer: StudentAnswer): QuestionResult {
    const marcado = (answer.valores ?? [])[0] ?? null;
    const esperado = ex.esperada as boolean;
    return {
      exercise: ex,
      answer,
      correcta: marcado === esperado,
      parcial: marcado === esperado ? 1 : 0,
      respuestaEsperada: esperado ? 'Verdadero (V)' : 'Falso (F)',
      respuestaEstudiante:
        marcado === null ? 'Sin responder' : marcado ? 'Verdadero (V)' : 'Falso (F)',
    };
  }

  private calificarOpcion(ex: Exercise, answer: StudentAnswer): QuestionResult {
    const marcado = answer.opcion ?? null;
    return {
      exercise: ex,
      answer,
      correcta: marcado === ex.esperada,
      parcial: marcado === ex.esperada ? 1 : 0,
      respuestaEsperada: this.etiquetaOpcion(ex, ex.esperada),
      respuestaEstudiante: marcado ? this.etiquetaOpcion(ex, marcado) : 'Sin responder',
    };
  }

  /** Devuelve una etiqueta legible para el valor de una opción. */
  private etiquetaOpcion(ex: Exercise, valor: boolean | string | undefined): string {
    if (valor === undefined) return '—';
    const opt = ex.opciones?.find((o) => o.valor === valor);
    if (opt) return opt.etiqueta;
    if (ex.tipo === 'operador') {
      return OPERADOR_LABELS[valor as LogicalOperator] ?? String(valor);
    }
    if (ex.tipo === 'clasificacion') {
      return CLASIFICACION_LABELS[valor as Classification] ?? String(valor);
    }
    return String(valor);
  }

  /** Barajado Fisher-Yates para una selección uniformemente aleatoria. */
  private muestrear<T>(arr: T[], cantidad: number): T[] {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia.slice(0, cantidad);
  }
}
