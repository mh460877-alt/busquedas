import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';

interface KpiPersona { persona: string; asignadas: number; cumplidas: number; pct: number; }
interface BarraMes { mes: string; busquedas: number; candidatos: number; pendientes: number; total: number; }

/**
 * Informes y análisis del mundo interno.
 *
 * Tres cosas que pedía el relevamiento, sobre los mismos datos que ya se cargan:
 *   · Cumplimiento por persona (KPI): cuánto de lo asignado se finalizó.
 *   · Temporadas: en qué meses hay más movimiento (alta/baja).
 *   · Descargar informe del período (mes / semestre / año) para el balance.
 */
@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent implements OnInit {

  pendientes: any[] = [];
  busquedas: any[] = [];
  candidatos: any[] = [];
  viajes: any[] = [];
  cargando = true;
  mensaje = '';

  periodo: 'semana' | 'mes' | 'semestre' | 'anio' = 'mes';
  meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    forkJoin({
      pendientes: this.api.listar<any>('Pendientes'),
      busquedas: this.api.listar<any>('Busquedas'),
      candidatos: this.api.listar<any>('Candidatos'),
      viajes: this.api.listar<any>('Viajes')
    }).subscribe({
      next: r => {
        this.pendientes = r.pendientes; this.busquedas = r.busquedas;
        this.candidatos = r.candidatos; this.viajes = r.viajes;
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  private parse(s: string): Date | null {
    if (!s) return null;
    const p = String(s).slice(0, 10).split('-');
    if (p.length !== 3) return null;
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  private esDone(estado: string): boolean { return /finaliz|complet|cerrad|realiz|cumplid/i.test(estado || ''); }

  /* ---------------- KPIs de cumplimiento ---------------- */
  get kpis(): KpiPersona[] {
    const porPersona: { [p: string]: { a: number; c: number } } = {};
    this.pendientes.forEach(p => {
      const persona = (p.Responsable || 'Sin asignar').trim();
      if (!porPersona[persona]) porPersona[persona] = { a: 0, c: 0 };
      porPersona[persona].a++;
      if (this.esDone(p.Estado)) porPersona[persona].c++;
    });
    return Object.keys(porPersona).map(persona => {
      const { a, c } = porPersona[persona];
      return { persona, asignadas: a, cumplidas: c, pct: a ? Math.round(c * 100 / a) : 0 };
    }).sort((x, y) => y.pct - x.pct);
  }

  /* ---------------- Temporadas (por mes del año en curso) ---------------- */
  get temporadas(): BarraMes[] {
    const anio = new Date().getFullYear();
    const filas: BarraMes[] = this.meses.map(m => ({ mes: m, busquedas: 0, candidatos: 0, pendientes: 0, total: 0 }));
    const sumar = (fecha: string, campo: 'busquedas' | 'candidatos' | 'pendientes') => {
      const d = this.parse(fecha);
      if (d && d.getFullYear() === anio) { filas[d.getMonth()][campo]++; filas[d.getMonth()].total++; }
    };
    this.busquedas.forEach(b => sumar(b.FechaAlta, 'busquedas'));
    this.candidatos.forEach(c => sumar(c.FechaCarga, 'candidatos'));
    this.pendientes.forEach(p => sumar(p.Fecha, 'pendientes'));
    return filas;
  }

  get maxTemporada(): number {
    return Math.max(1, ...this.temporadas.map(t => t.total));
  }

  altura(valor: number): number { return Math.round(valor * 100 / this.maxTemporada); }

  /* ---------------- Rango del período seleccionado ---------------- */
  private rango(): { desde: Date; hasta: Date; etiqueta: string } {
    const hoy = new Date();
    const y = hoy.getFullYear();
    if (this.periodo === 'semana') {
      const ini = new Date(hoy); const wd = (hoy.getDay() + 6) % 7;
      ini.setDate(hoy.getDate() - wd); ini.setHours(0, 0, 0, 0);
      const fin = new Date(ini); fin.setDate(ini.getDate() + 7);
      return { desde: ini, hasta: fin, etiqueta: 'Semana en curso' };
    }
    if (this.periodo === 'mes') {
      return { desde: new Date(y, hoy.getMonth(), 1), hasta: new Date(y, hoy.getMonth() + 1, 1), etiqueta: this.mesLargo(hoy.getMonth()) + ' ' + y };
    }
    if (this.periodo === 'semestre') {
      const primerSem = hoy.getMonth() < 6;
      return {
        desde: new Date(y, primerSem ? 0 : 6, 1),
        hasta: new Date(y, primerSem ? 6 : 12, 1),
        etiqueta: (primerSem ? '1º' : '2º') + ' semestre ' + y
      };
    }
    return { desde: new Date(y, 0, 1), hasta: new Date(y + 1, 0, 1), etiqueta: 'Año ' + y };
  }

  private mesLargo(i: number): string {
    return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i];
  }

  private enRango(fecha: string, r: { desde: Date; hasta: Date }): boolean {
    const d = this.parse(fecha);
    return !!d && d >= r.desde && d < r.hasta;
  }

  /** Lo realizado en el período, para la vista previa y la descarga. */
  get resumenPeriodo(): { etiqueta: string; pendientes: any[]; finalizadas: any[]; viajes: any[]; candidatos: any[] } {
    const r = this.rango();
    return {
      etiqueta: r.etiqueta,
      pendientes: this.pendientes.filter(p => this.enRango(p.Fecha, r) && !this.esDone(p.Estado)),
      finalizadas: this.pendientes.filter(p => this.enRango(p.Fecha, r) && this.esDone(p.Estado)),
      viajes: this.viajes.filter(v => this.enRango(v.FechaSalida, r)),
      candidatos: this.candidatos.filter(c => this.enRango(c.FechaCarga, r))
    };
  }

  /* ---------------- Descarga ---------------- */
  descargar(): void {
    const R = this.resumenPeriodo;
    const filas = (arr: any[], cols: [string, (x: any) => string][]) =>
      arr.length ? arr.map(x => '<tr>' + cols.map(c => '<td>' + (c[1](x) || '') + '</td>').join('') + '</tr>').join('')
                 : `<tr><td colspan="${cols.length}" style="color:#888">Sin registros.</td></tr>`;

    const kpiRows = this.kpis.map(k =>
      `<tr><td>${k.persona}</td><td>${k.asignadas}</td><td>${k.cumplidas}</td><td><b>${k.pct}%</b></td></tr>`).join('');

    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8">
<title>Informe ${R.etiqueta} · Escencial</title>
<style>
body{font-family:'Segoe UI',sans-serif;color:#2c3e50;max-width:900px;margin:30px auto;padding:0 20px}
h1{color:#2c3e50;border-bottom:3px solid #3498db;padding-bottom:10px}
h2{color:#2c3e50;margin-top:30px;font-size:1.1rem}
table{width:100%;border-collapse:collapse;margin:10px 0 20px;font-size:.9rem}
th{background:#2c3e50;color:#fff;text-align:left;padding:8px 10px;font-size:.75rem;text-transform:uppercase}
td{padding:8px 10px;border-bottom:1px solid #eee}
.pie{margin-top:40px;color:#888;font-size:.8rem;border-top:1px solid #eee;padding-top:12px}
</style></head><body>
<h1>Informe · ${R.etiqueta}</h1>
<p>Escencial Consultora · Generado el ${this.hoyTexto()}</p>

<h2>Cumplimiento por persona</h2>
<table><thead><tr><th>Responsable</th><th>Asignadas</th><th>Cumplidas</th><th>%</th></tr></thead>
<tbody>${kpiRows || '<tr><td colspan="4" style="color:#888">Sin datos.</td></tr>'}</tbody></table>

<h2>Realizado en el período (${R.finalizadas.length})</h2>
<table><thead><tr><th>Fecha</th><th>Actividad</th><th>Responsable</th></tr></thead>
<tbody>${filas(R.finalizadas, [['f', x => x.Fecha], ['t', x => x.Titulo], ['r', x => x.Responsable]])}</tbody></table>

<h2>Pendiente del período (${R.pendientes.length})</h2>
<table><thead><tr><th>Fecha</th><th>Actividad</th><th>Responsable</th><th>Estado</th></tr></thead>
<tbody>${filas(R.pendientes, [['f', x => x.Fecha], ['t', x => x.Titulo], ['r', x => x.Responsable], ['e', x => x.Estado]])}</tbody></table>

<h2>Viajes (${R.viajes.length})</h2>
<table><thead><tr><th>Viajero</th><th>Destino</th><th>Salida</th><th>Regreso</th></tr></thead>
<tbody>${filas(R.viajes, [['v', x => x.Viajero], ['d', x => x.Destino], ['s', x => x.FechaSalida], ['r', x => x.FechaRegreso]])}</tbody></table>

<h2>Candidatos presentados (${R.candidatos.length})</h2>
<table><thead><tr><th>Nombre</th><th>Etapa</th><th>Fecha</th></tr></thead>
<tbody>${filas(R.candidatos, [['n', x => x.Nombre], ['e', x => x.Etapa], ['f', x => x.FechaCarga]])}</tbody></table>

<div class="pie">Documento generado automáticamente por el sistema de gestión de Escencial Consultora.</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Informe_' + R.etiqueta.replace(/[^\w]+/g, '_') + '.html';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  private hoyTexto(): string {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}
