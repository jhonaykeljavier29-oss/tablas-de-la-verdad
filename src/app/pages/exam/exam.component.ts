import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExamService, PREGUNTAS_POR_EXAMEN } from '../../services/exam.service';
import { Exercise } from '../../core/models';

/**
 * Examen interactivo: 20 preguntas aleatorias.
 * Las preguntas de tabla y valor tienen controles propios; el resto
 * (operador, clasificación, concepto, regla, validez, categórica, falacia)
 * se responden con la lista de opciones que trae cada ejercicio.
 */
@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css',
})
export class ExamComponent {
  private readonly exam = inject(ExamService);
  private readonly router = inject(Router);

  readonly totalPreguntas = PREGUNTAS_POR_EXAMEN;

  readonly indice = signal(0);

  readonly preguntas = this.exam.preguntas;
  readonly respuestas = this.exam.respuestas;
  readonly enCurso = this.exam.enCurso;
  readonly respondidas = this.exam.respondidas;
  readonly total = this.exam.total;

  readonly preguntaActual = computed<Exercise | null>(
    () => this.preguntas()[this.indice()] ?? null,
  );

  readonly esUltima = computed(() => this.indice() === this.preguntas().length - 1);

  /* -------------------------- acciones -------------------------- */

  iniciar(cantidad = this.totalPreguntas): void {
    this.exam.iniciarExamen(cantidad);
    this.indice.set(0);
  }

  ir(indice: number): void {
    if (indice >= 0 && indice < this.preguntas().length) {
      this.indice.set(indice);
    }
  }

  siguiente(): void {
    this.ir(this.indice() + 1);
  }

  anterior(): void {
    this.ir(this.indice() - 1);
  }

  toggleCelda(indicePregunta: number, fila: number, valor: boolean): void {
    const actual = this.valorCelda(indicePregunta, fila);
    this.exam.responder(indicePregunta, actual === valor ? null : valor, fila);
  }

  marcarValor(indicePregunta: number, valor: boolean): void {
    const actual = (this.respuestas()[indicePregunta]?.valores ?? [])[0] ?? null;
    this.exam.responder(indicePregunta, actual === valor ? null : valor);
  }

  marcarOpcion(indicePregunta: number, opcion: string): void {
    const actual = this.respuestas()[indicePregunta]?.opcion ?? null;
    this.exam.responderOpcion(indicePregunta, actual === opcion ? '' : opcion);
  }

  valorCelda(indicePregunta: number, fila: number): boolean | null {
    const v = this.respuestas()[indicePregunta]?.valores;
    return v?.[fila] ?? null;
  }

  valorUnico(indicePregunta: number): boolean | null {
    return this.respuestas()[indicePregunta]?.valores?.[0] ?? null;
  }

  opcionMarcada(indicePregunta: number): string | null {
    return this.respuestas()[indicePregunta]?.opcion || null;
  }

  esRespondida(indicePregunta: number): boolean {
    const a = this.respuestas()[indicePregunta];
    if (!a) return false;
    if (a.opcion) return true;
    return (a.valores ?? []).some((v) => v !== null && v !== undefined);
  }

  finalizar(): void {
    const pendientes = this.preguntas().length - this.respondidas();
    if (pendientes > 0) {
      const continuar = window.confirm(
        `Te quedan ${pendientes} pregunta(s) sin responder. ¿Deseas finalizar igualmente?`,
      );
      if (!continuar) return;
    }
    this.exam.finalizar();
    this.router.navigate(['/resultado']);
  }

  abandonar(): void {
    if (window.confirm('¿Seguro que quieres salir? Se perderá el progreso del examen.')) {
      this.exam.reiniciar();
    }
  }

  /* --------------------------- utilidades --------------------------- */

  etiquetaTipo(ex: Exercise): string {
    switch (ex.tipo) {
      case 'tabla':
        return 'Tabla de verdad';
      case 'valor':
        return 'Valor de verdad';
      case 'operador':
        return 'Operador principal';
      case 'clasificacion':
        return 'Clasificación';
      case 'concepto':
        return 'Concepto teórico';
      case 'regla':
        return 'Regla de inferencia';
      case 'validez':
        return 'Validez del argumento';
      case 'categorica':
        return 'Proposición categórica';
      case 'falacia':
        return 'Identificación de falacia';
    }
  }

  etiquetaUnidad(unidad: number): string {
    return `Unidad ${unidad}`;
  }

  etiquetaNivel(nivel: number): string {
    return nivel === 1 ? 'Básico' : nivel === 2 ? 'Intermedio' : 'Avanzado';
  }

  describirAsignacion(ex: Exercise): string {
    if (!ex.asignacion) return '';
    return ex.variables.map((v, i) => `${v} = ${ex.asignacion![i] ? 'V' : 'F'}`).join(',  ');
  }
}
