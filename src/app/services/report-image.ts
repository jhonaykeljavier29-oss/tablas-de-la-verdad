import { ExamResult, QuestionResult } from '../core/models';

/**
 * Dibujo del reporte como imagen (canvas 2D).
 *
 * Se mantiene como funciones puras que sólo dependen de la API de canvas,
 * para poder reutilizarlas y verificarlas fuera del navegador.
 */

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

/** Paleta (coincide con styles.css). */
const C = {
  text: '#f4efff',
  dim: '#a89fc8',
  purple: '#8b5cf6',
  cyan: '#22d3ee',
  pink: '#f472b6',
  green: '#34d399',
  red: '#fb7185',
  amber: '#fbbf24',
  cardBg: '#171030',
  cardBorder: '#2f2757',
};

const F = {
  brand: "800 22px 'Segoe UI', system-ui, sans-serif",
  title: "800 40px 'Segoe UI', system-ui, sans-serif",
  sub: "500 15px 'Segoe UI', system-ui, sans-serif",
  kpiVal: "800 40px 'Segoe UI', system-ui, sans-serif",
  kpiLbl: "700 11px 'Segoe UI', system-ui, sans-serif",
  section: "800 22px 'Segoe UI', system-ui, sans-serif",
  qTitle: "800 16px 'Segoe UI', system-ui, sans-serif",
  body: "500 15px 'Segoe UI', system-ui, sans-serif",
  bodyBold: "700 15px 'Segoe UI', system-ui, sans-serif",
  mono: "700 17px 'Consolas', 'Cascadia Code', monospace",
  status: "800 15px 'Segoe UI', system-ui, sans-serif",
  footer: "500 13px 'Segoe UI', system-ui, sans-serif",
};

const P = 48;
const INNER_LEFT = 68;
const INNER_RIGHT = 28;

const HEADER_H = 214;
const KPI_H = 108;
const VERDICT_H = 60;
const CARD_GAP = 16;
const SECTION_H = 46;
const FOOTER_H = 78;

type Ctx = CanvasRenderingContext2D;

function wrap(ctx: Ctx, texto: string, font: string, maxW: number): string[] {
  ctx.font = font;
  const palabras = (texto || '').split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > maxW && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [''];
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, radio: number): void {
  const rad = Math.min(radio, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function colorNota(n: number): string {
  return n >= 80 ? C.green : n >= 60 ? C.amber : C.red;
}

function estadoDe(p: QuestionResult): { color: string; texto: string } {
  return p.correcta
    ? { color: C.green, texto: '✓ Correcta' }
    : p.respuestaEstudiante === 'Sin responder'
      ? { color: C.amber, texto: '— Sin responder' }
      : { color: C.red, texto: '✗ Incorrecta' };
}

function altoTarjeta(ctx: Ctx, p: QuestionResult, contentW: number): number {
  const maxW = contentW - INNER_LEFT - INNER_RIGHT;
  const lineas = wrap(ctx, p.exercise.enunciado, F.body, maxW);
  const formula = p.exercise.formula ? 30 : 0;
  return 24 + 20 + 10 + lineas.length * 22 + formula + 48 + 20;
}

/** Calcula la altura total de la imagen para el ancho `W`. */
export function calcularAlturaReporte(ctx: Ctx, r: ExamResult, W: number): number {
  const contentW = W - 2 * P;
  let total = HEADER_H + KPI_H + 28 + VERDICT_H + 32 + SECTION_H + FOOTER_H;
  for (const p of r.preguntas) {
    total += altoTarjeta(ctx, p, contentW) + CARD_GAP;
  }
  return total;
}

/** Dibuja el reporte completo en el contexto dado. */
export function dibujarReporte(ctx: Ctx, r: ExamResult, W: number, totalH: number): void {
  const contentW = W - 2 * P;

  // ---------- Fondo ----------
  const bg = ctx.createLinearGradient(0, 0, W, totalH);
  bg.addColorStop(0, '#160d2e');
  bg.addColorStop(0.5, '#0f0a20');
  bg.addColorStop(1, '#0b0716');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, totalH);

  const glow = (x: number, y: number, radio: number, color: string): void => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radio);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, totalH);
  };
  glow(W * 0.88, -80, 560, 'rgba(139,92,246,0.28)');
  glow(W * 0.02, totalH * 0.35, 480, 'rgba(34,211,238,0.10)');
  glow(W * 0.25, totalH, 560, 'rgba(244,114,182,0.10)');

  // Barra superior degradada.
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, C.purple);
  topBar.addColorStop(0.5, C.cyan);
  topBar.addColorStop(1, C.pink);
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 7);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // ---------- Cabecera ----------
  const marcaGrad = ctx.createLinearGradient(P, 44, P + 46, 90);
  marcaGrad.addColorStop(0, C.purple);
  marcaGrad.addColorStop(1, C.cyan);
  rr(ctx, P, 44, 46, 46, 13);
  ctx.fillStyle = marcaGrad;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = "800 26px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⊨', P + 23, 68);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.font = F.brand;
  ctx.fillStyle = C.text;
  ctx.fillText('Tablas de Verdad', P + 62, 76);

  const tituloGrad = ctx.createLinearGradient(P, 100, P + 460, 160);
  tituloGrad.addColorStop(0, '#a78bfa');
  tituloGrad.addColorStop(0.6, C.cyan);
  tituloGrad.addColorStop(1, C.pink);
  ctx.font = F.title;
  ctx.fillStyle = tituloGrad;
  ctx.fillText('Reporte de Examen', P, 156);

  ctx.font = F.sub;
  ctx.fillStyle = C.dim;
  ctx.fillText(
    `${new Date(r.fecha).toLocaleString('es-ES')}  ·  Fundamentos de Lógica`,
    P,
    186,
  );

  // ---------- KPIs ----------
  const kpis = [
    { valor: `${r.notaSobre100}`, lbl: 'NOTA /100', color: colorNota(r.notaSobre100) },
    { valor: `${r.notaSobre20}`, lbl: 'NOTA /20', color: C.text },
    { valor: `${r.aciertos}`, lbl: 'ACIERTOS', color: C.green },
    { valor: `${r.errores}`, lbl: 'ERRORES', color: C.red },
    { valor: `${r.sinResponder}`, lbl: 'SIN RESPONDER', color: C.amber },
  ];
  const kpiGap = 16;
  const kpiW = (contentW - kpiGap * (kpis.length - 1)) / kpis.length;
  const kpiTop = HEADER_H;
  kpis.forEach((k, i) => {
    const x = P + i * (kpiW + kpiGap);
    rr(ctx, x, kpiTop, kpiW, KPI_H, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.cardBorder;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = F.kpiVal;
    ctx.fillStyle = k.color;
    ctx.fillText(k.valor, x + kpiW / 2, kpiTop + 58);
    ctx.font = F.kpiLbl;
    ctx.fillStyle = C.dim;
    ctx.fillText(k.lbl, x + kpiW / 2, kpiTop + 86);
    ctx.textAlign = 'left';
  });

  // ---------- Veredicto ----------
  const aprobado = r.notaSobre100 >= 60;
  const vColor = aprobado ? C.green : C.red;
  const vTop = kpiTop + KPI_H + 28;
  rr(ctx, P, vTop, contentW, VERDICT_H, 14);
  ctx.fillStyle = aprobado ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = vColor;
  ctx.stroke();
  ctx.font = "800 19px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = vColor;
  ctx.textAlign = 'center';
  ctx.fillText(
    aprobado ? '¡Aprobada! Buen trabajo' : 'No aprobada. ¡A repasar y volver a intentarlo!',
    P + contentW / 2,
    vTop + 38,
  );
  ctx.textAlign = 'left';

  // ---------- Sección ----------
  const secTop = vTop + VERDICT_H + 32;
  ctx.font = F.section;
  ctx.fillStyle = C.text;
  ctx.fillText('Desglose de respuestas', P, secTop + 20);

  // ---------- Tarjetas ----------
  let cy = secTop + SECTION_H;
  r.preguntas.forEach((p, i) => {
    const ex = p.exercise;
    const cardH = altoTarjeta(ctx, p, contentW);
    const cardX = P;
    const { color: stColor, texto: stTexto } = estadoDe(p);

    rr(ctx, cardX, cy, contentW, cardH, 16);
    ctx.fillStyle = C.cardBg;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.cardBorder;
    ctx.stroke();

    ctx.save();
    rr(ctx, cardX, cy, contentW, cardH, 16);
    ctx.clip();
    ctx.fillStyle = stColor;
    ctx.fillRect(cardX, cy, 5, cardH);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cardX + 40, cy + 34, 17, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139,92,246,0.25)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.purple;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "800 15px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText(String(i + 1), cardX + 40, cy + 35);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const innerLeft = cardX + INNER_LEFT;
    const innerRight = cardX + contentW - INNER_RIGHT;
    const maxW = innerRight - innerLeft;

    let ty = cy + 24;
    ctx.font = F.qTitle;
    ctx.fillStyle = C.text;
    ctx.fillText(
      `Pregunta ${i + 1} · ${TIPO_LABEL[ex.tipo] ?? ex.tipo} · U${ex.unidad}`,
      innerLeft,
      ty + 15,
    );

    ctx.textAlign = 'right';
    ctx.font = F.status;
    ctx.fillStyle = stColor;
    ctx.fillText(stTexto, innerRight, ty + 15);
    ctx.textAlign = 'left';

    ty += 30;

    ctx.font = F.body;
    ctx.fillStyle = C.dim;
    const lineas = wrap(ctx, ex.enunciado, F.body, maxW);
    for (const ln of lineas) {
      ctx.fillText(ln, innerLeft, ty + 15);
      ty += 22;
    }

    if (ex.formula) {
      ctx.font = F.mono;
      ctx.fillStyle = '#a5f3fc';
      ctx.fillText(ex.formula, innerLeft, ty + 20);
      ty += 30;
    }

    const valorTuColor = p.correcta
      ? C.green
      : p.respuestaEstudiante === 'Sin responder'
        ? C.amber
        : C.red;
    ctx.font = F.bodyBold;
    ctx.fillStyle = C.dim;
    ctx.fillText('Tu respuesta:', innerLeft, ty + 15);
    ctx.font = F.body;
    ctx.fillStyle = valorTuColor;
    ctx.fillText(p.respuestaEstudiante, innerLeft + 118, ty + 15);
    ty += 24;

    ctx.font = F.bodyBold;
    ctx.fillStyle = C.dim;
    ctx.fillText('Correcta:', innerLeft, ty + 15);
    ctx.font = F.body;
    ctx.fillStyle = C.green;
    ctx.fillText(p.respuestaEsperada, innerLeft + 118, ty + 15);
    ty += 24;

    cy += cardH + CARD_GAP;
  });

  // ---------- Pie ----------
  const fy = cy + 8;
  ctx.strokeStyle = C.cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(P, fy);
  ctx.lineTo(W - P, fy);
  ctx.stroke();
  ctx.font = F.footer;
  ctx.fillStyle = C.dim;
  ctx.fillText(`Generado automáticamente · ${new Date().toLocaleString('es-ES')}`, P, fy + 28);
  ctx.textAlign = 'right';
  ctx.fillText('tablas-de-la-verdad.vercel.app', W - P, fy + 28);
  ctx.textAlign = 'left';
}
