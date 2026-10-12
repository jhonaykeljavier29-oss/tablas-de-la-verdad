import { Injectable } from '@angular/core';
import { ExamResult, QuestionResult } from '../core/models';
import { calcularAlturaReporte, dibujarReporte } from './report-image';

/** Descripciones legibles de los tipos de pregunta para los reportes. */
const TIPO_LABEL: Record<string, string> = {
  tabla: 'Tabla de verdad',
  valor: 'Valor de verdad',
  operador: 'Operador principal',
  clasificacion: 'Clasificación',
  concepto: 'Concepto teórico',
  regla: 'Regla de inferencia',
  validez: 'Validez del argumento',
  categorica: 'Proposición categórica',
  falacia: 'Identificación de falacia',
};

/** Nombres de las unidades. */
const UNIDAD_LABEL: Record<number, string> = {
  1: 'I · Fundamentos',
  2: 'II · Proposicional',
  3: 'III · Categórica y Falacias',
  4: 'IV · Aplicación en Ingeniería',
};

/**
 * Genera y descarga los reportes del examen (TXT, JSON, PNG y PDF vía impresión).
 * El puntaje nunca se muestra en pantalla automáticamente: sólo a través de
 * la descarga, lo que dificulta las capturas rápidas o las trampas.
 */
@Injectable({ providedIn: 'root' })
export class ResultsService {
  /** Nombre de archivo con marca de tiempo. */
  private nombreArchivo(ext: string): string {
    const d = new Date();
    const sello = `${d.getFullYear()}-${this.dos(d.getMonth() + 1)}-${this.dos(d.getDate())}_` +
      `${this.dos(d.getHours())}-${this.dos(d.getMinutes())}`;
    return `resultado-tablas-verdad_${sello}.${ext}`;
  }

  private dos(n: number): string {
    return n.toString().padStart(2, '0');
  }

  /* ------------------------------ TXT ------------------------------ */

  /** Construye el reporte en texto plano estructurado. */
  construirTexto(r: ExamResult): string {
    const lineas: string[] = [];
    const sep = '='.repeat(60);

    lineas.push(sep);
    lineas.push('   REPORTE DE EXAMEN - TABLAS DE LA VERDAD');
    lineas.push(sep);
    lineas.push(`Fecha: ${new Date(r.fecha).toLocaleString('es-ES')}`);
    lineas.push('');
    lineas.push(`Nota final ........: ${r.notaSobre100}/100  (${r.notaSobre20}/20)`);
    lineas.push(`Preguntas .........: ${r.total}`);
    lineas.push(`Aciertos ..........: ${r.aciertos}`);
    lineas.push(`Errores ...........: ${r.errores}`);
    lineas.push(`Sin responder .....: ${r.sinResponder}`);
    lineas.push('');
    lineas.push(sep);
    lineas.push('   DESGLOSE DE RESPUESTAS');
    lineas.push(sep);

    r.preguntas.forEach((p, i) => {
      lineas.push(...this.bloquePregunta(p, i + 1));
    });

    lineas.push('');
    lineas.push(sep);
    lineas.push('Fin del reporte.');
    lineas.push(sep);
    return lineas.join('\r\n');
  }

  private bloquePregunta(p: QuestionResult, numero: number): string[] {
    const ex = p.exercise;
    const estado = p.correcta
      ? '[OK]'
      : p.respuestaEstudiante === 'Sin responder'
        ? '[--]'
        : '[X]';
    const l: string[] = [];
    l.push('');
    l.push(`${estado} Pregunta ${numero} - ${TIPO_LABEL[ex.tipo] ?? ex.tipo} (nivel ${ex.nivel})`);
    l.push(`    Unidad    : ${UNIDAD_LABEL[ex.unidad] ?? ex.unidad}`);
    l.push(`    Enunciado : ${ex.enunciado}`);
    l.push(`    Proposición: ${ex.formula || '—'}   |   Variables: ${ex.variables.join(', ') || '—'}`);
    l.push(`    Tu respuesta: ${p.respuestaEstudiante}`);
    l.push(`    Respuesta correcta: ${p.respuestaEsperada}`);
    if (p.detalle?.length) {
      const aciertosCelda = p.detalle.filter((d) => d.marcado === d.esperado).length;
      l.push(`    Celdas correctas: ${aciertosCelda}/${p.detalle.length}`);
    }
    return l;
  }

  /* ------------------------------ JSON ------------------------------ */

  /** Construye el reporte en JSON (datos crudos + metadatos). */
  construirJSON(r: ExamResult): string {
    const payload = {
      examen: 'Tablas de la Verdad - Lógica proposicional',
      generado: new Date().toISOString(),
      resumen: {
        notaSobre100: r.notaSobre100,
        notaSobre20: r.notaSobre20,
        total: r.total,
        aciertos: r.aciertos,
        errores: r.errores,
        sinResponder: r.sinResponder,
      },
      preguntas: r.preguntas.map((p, i) => ({
        numero: i + 1,
        tipo: p.exercise.tipo,
        nivel: p.exercise.nivel,
        proposicion: p.exercise.formula,
        variables: p.exercise.variables,
        correcta: p.correcta,
        respuestaEstudiante: p.respuestaEstudiante,
        respuestaCorrecta: p.respuestaEsperada,
      })),
    };
    return JSON.stringify(payload, null, 2);
  }

  /* --------------------------- Descargas --------------------------- */

  descargarTXT(r: ExamResult): void {
    this.descargar(this.construirTexto(r), this.nombreArchivo('txt'), 'text/plain;charset=utf-8');
  }

  descargarJSON(r: ExamResult): void {
    this.descargar(this.construirJSON(r), this.nombreArchivo('json'), 'application/json');
  }

  /** Genera el reporte como imagen PNG con el estilo de la página y lo descarga. */
  async descargarImagen(r: ExamResult): Promise<void> {
    const blob = await this.generarImagen(r);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.nombreArchivo('png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Renderiza el reporte en un canvas con la estética del sitio y devuelve el PNG. */
  private generarImagen(r: ExamResult): Promise<Blob> {
    const W = 1000;
    const dpr = 2;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const totalH = calcularAlturaReporte(ctx, r, W);
    canvas.width = W * dpr;
    canvas.height = Math.ceil(totalH) * dpr;
    ctx.scale(dpr, dpr);
    dibujarReporte(ctx, r, W, totalH);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen.'))),
        'image/png',
      );
    });
  }

  /** Abre una ventana imprimible para guardar como PDF desde el navegador. */
  imprimirPDF(r: ExamResult): void {
    const ventana = window.open('', '_blank', 'width=900,height=1000');
    if (!ventana) return;
    ventana.document.write(this.construirHTML(r));
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
  }

  private descargar(contenido: string, nombre: string, tipo: string): void {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** HTML autocontenido para impresión / PDF. */
  private construirHTML(r: ExamResult): string {
    const filas = r.preguntas
      .map((p, i) => {
        const color = p.correcta ? '#1f9d55' : p.respuestaEstudiante === 'Sin responder' ? '#b7791f' : '#c53030';
        const simbolo = p.correcta ? '&#10003;' : p.respuestaEstudiante === 'Sin responder' ? '&#8212;' : '&#10007;';
        return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${TIPO_LABEL[p.exercise.tipo] ?? p.exercise.tipo}</strong><br>
            <code>${this.escapar(p.exercise.formula)}</code><br>
            <small>${this.escapar(p.exercise.variables.join(', '))}</small></td>
          <td>${this.escapar(p.respuestaEstudiante)}</td>
          <td>${this.escapar(p.respuestaEsperada)}</td>
          <td style="color:${color};font-weight:700;text-align:center">${simbolo}</td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
      <title>Resultado - Tablas de la Verdad</title>
      <style>
        body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a202c;padding:28px;}
        h1{font-size:22px;margin:0 0 4px;}
        .meta{color:#4a5568;font-size:13px;margin-bottom:16px;}
        .resumen{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:18px;}
        .kpi{border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;text-align:center;}
        .kpi b{display:block;font-size:20px;}
        .kpi span{font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:.5px;}
        table{width:100%;border-collapse:collapse;font-size:12.5px;}
        th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top;}
        th{background:#f7fafc;text-transform:uppercase;font-size:11px;letter-spacing:.5px;}
        code{background:#edf2f7;padding:1px 5px;border-radius:4px;font-size:12px;}
        @media print{button{display:none}}
      </style></head><body>
      <h1>Resultado del Examen &mdash; Tablas de la Verdad</h1>
      <div class="meta">Generado el ${new Date(r.fecha).toLocaleString('es-ES')}</div>
      <div class="resumen">
        <div class="kpi"><b>${r.notaSobre100}</b><span>Nota /100</span></div>
        <div class="kpi"><b>${r.notaSobre20}</b><span>Nota /20</span></div>
        <div class="kpi"><b>${r.aciertos}</b><span>Aciertos</span></div>
        <div class="kpi"><b>${r.errores}</b><span>Errores</span></div>
        <div class="kpi"><b>${r.sinResponder}</b><span>Sin responder</span></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Pregunta</th><th>Tu respuesta</th><th>Correcta</th><th></th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      </body></html>`;
  }

  private escapar(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
