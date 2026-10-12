import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ResultsService } from '../../services/results.service';

/**
 * Pantalla de resultados.
 *
 * Por defecto la nota y el desglose permanecen OCULTOS para evitar trampas
 * (capturas rápidas). El estudiante debe descargar el reporte (TXT/JSON/PDF)
 * para poder consultar su calificación; tras la descarga se revela también en
 * pantalla una síntesis.
 */
@Component({
  selector: 'app-results',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent {
  private readonly exam = inject(ExamService);
  private readonly results = inject(ResultsService);
  private readonly router = inject(Router);

  /** Resultado en memoria (null si se entra sin haber hecho examen). */
  readonly resultado = this.exam.ultimoResultado;

  /** ¿Se ha descargado/desbloqueado ya el reporte? */
  readonly revelado = signal(false);

  readonly descargado = signal(false);

  readonly resumen = computed(() => this.resultado());

  /** Aprobado (nota >= 60/100). */
  readonly aprobado = computed(() => (this.resumen()?.notaSobre100 ?? 0) >= 60);

  /* --------------------------- descargas --------------------------- */

  private desbloquear(nombre: string): void {
    this.descargado.set(true);
    this.revelado.set(true);
    void nombre;
  }

  descargarTXT(): void {
    const r = this.resultado();
    if (!r) return;
    this.results.descargarTXT(r);
    this.desbloquear('txt');
  }

  descargarJSON(): void {
    const r = this.resultado();
    if (!r) return;
    this.results.descargarJSON(r);
    this.desbloquear('json');
  }

  descargarPDF(): void {
    const r = this.resultado();
    if (!r) return;
    this.results.imprimirPDF(r);
    this.desbloquear('pdf');
  }

  /** Genera y descarga el reporte como imagen PNG con el estilo de la página. */
  async descargarImagen(): Promise<void> {
    const r = this.resultado();
    if (!r) return;
    await this.results.descargarImagen(r);
    this.desbloquear('png');
  }

  /** Fuerza la descarga del paquete completo (TXT + JSON). */
  descargarTodo(): void {
    const r = this.resultado();
    if (!r) return;
    this.results.descargarTXT(r);
    setTimeout(() => this.results.descargarJSON(r), 250);
    this.desbloquear('todo');
  }

  /* --------------------------- navegación --------------------------- */

  nuevoExamen(): void {
    this.exam.reiniciar();
    this.router.navigate(['/examen']);
  }
}
