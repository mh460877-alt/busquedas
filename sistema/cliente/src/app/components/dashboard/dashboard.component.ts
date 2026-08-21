import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';

/** Lo que hizo una persona en el período elegido. */
interface GestionPersona {
  persona: string;
  pendientes: number;
  finalizadas: number;
  proyectos: number;
  capacitaciones: number;
  comunicaciones: number;
  onboarding: number;
  viajes: number;
  candidatos: number;
  total: number;
  cumplimiento: number;   // % de pendientes finalizados
}

type Periodo = 'dia' | 'semana' | 'mes' | 'trimestre' | 'semestre' | 'anio';

/**
 * Tablero de gestión.
 *
 * Contesta la pregunta de la dirección —"¿qué hizo cada una?"— sobre los datos
 * que el equipo ya carga, sin pedirle a nadie que complete un parte aparte.
 * El período se elige y todo se recalcula: del día de hoy al año entero.
 *
 * La cuenta es de gestiones registradas, no de horas ni de esfuerzo. Sirve para
 * ver movimiento y repartir carga, no para medir a la gente con una sola cifra.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  periodo: Periodo = 'mes';
  cargando = true;
  mensaje = '';

  equipo: string[] = [];
  private datos: { [tabla: string]: any[] } = {};

  /**
   * Igual que en el tablero de evolución: la plantilla pide `gestiones` varias
   * veces por ciclo y cada vuelta recorre todas las tablas. Se calcula una vez
   * por período.
   */
  private memoria: { [clave: string]: GestionPersona[] } = {};
  private nombrePorId: { [id: string]: string } = {};

  readonly periodos: { clave: Periodo; etiqueta: string }[] = [
    { clave: 'dia', etiqueta: 'Hoy' },
    { clave: 'semana', etiqueta: 'Semana' },
    { clave: 'mes', etiqueta: 'Mes' },
    { clave: 'trimestre', etiqueta: 'Trimestre' },
    { clave: 'semestre', etiqueta: 'Semestre' },
    { clave: 'anio', etiqueta: 'Año' }
  ];

  constructor(private api: ApiService, private loginService: LoginService) { }

  ngOnInit(): void {
    this.api.llamar<any>('agenda').subscribe({
      next: r => { this.datos = r; this.memoria = {}; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.loginService.catalogos().subscribe({
      next: c => {
        this.equipo = c.equipo || [];
        (c.empresas || []).forEach(e => this.nombrePorId[e.id] = e.nombre);
      },
      error: () => { }
    });
  }

  /* ---------------- Período ---------------- */

  private parse(s: string): Date | null {
    if (!s) return null;
    const p = String(s).slice(0, 10).split('-');
    if (p.length !== 3) return null;
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Desde/hasta del período elegido. `hasta` no se incluye. */
  private rango(): { desde: Date; hasta: Date; etiqueta: string } {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();

    if (this.periodo === 'dia') {
      const d = new Date(y, m, hoy.getDate());
      const f = new Date(d); f.setDate(d.getDate() + 1);
      return { desde: d, hasta: f, etiqueta: 'Hoy, ' + this.fechaTexto(hoy) };
    }
    if (this.periodo === 'semana') {
      const ini = new Date(y, m, hoy.getDate() - ((hoy.getDay() + 6) % 7));
      const fin = new Date(ini); fin.setDate(ini.getDate() + 7);
      return { desde: ini, hasta: fin, etiqueta: 'Semana del ' + this.fechaTexto(ini) };
    }
    if (this.periodo === 'mes') {
      return { desde: new Date(y, m, 1), hasta: new Date(y, m + 1, 1), etiqueta: this.mesLargo(m) + ' ' + y };
    }
    if (this.periodo === 'trimestre') {
      const ini = Math.floor(m / 3) * 3;
      return {
        desde: new Date(y, ini, 1), hasta: new Date(y, ini + 3, 1),
        etiqueta: (Math.floor(m / 3) + 1) + 'º trimestre ' + y
      };
    }
    if (this.periodo === 'semestre') {
      const primero = m < 6;
      return {
        desde: new Date(y, primero ? 0 : 6, 1), hasta: new Date(y, primero ? 6 : 12, 1),
        etiqueta: (primero ? '1º' : '2º') + ' semestre ' + y
      };
    }
    return { desde: new Date(y, 0, 1), hasta: new Date(y + 1, 0, 1), etiqueta: 'Año ' + y };
  }

  private mesLargo(i: number): string {
    return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
            'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i];
  }

  private fechaTexto(d: Date): string {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  get etiquetaPeriodo(): string { return this.rango().etiqueta; }

  private enRango(fecha: string): boolean {
    const r = this.rango();
    const d = this.parse(fecha);
    return !!d && d >= r.desde && d < r.hasta;
  }

  private esDone(estado: string): boolean {
    return /finaliz|complet|cerrad|realiz|cumplid/i.test(estado || '');
  }

  /* ---------------- El tablero ---------------- */

  get gestiones(): GestionPersona[] {
    if (!this.memoria[this.periodo]) {
      this.memoria[this.periodo] = this.calcularGestiones();
    }
    return this.memoria[this.periodo];
  }

  private calcularGestiones(): GestionPersona[] {
    const mapa: { [p: string]: GestionPersona } = {};
    const de = (nombre: string): GestionPersona => {
      const clave = (nombre || 'Sin asignar').trim() || 'Sin asignar';
      if (!mapa[clave]) {
        mapa[clave] = {
          persona: clave, pendientes: 0, finalizadas: 0, proyectos: 0,
          capacitaciones: 0, comunicaciones: 0, onboarding: 0, viajes: 0,
          candidatos: 0, total: 0, cumplimiento: 0
        };
      }
      return mapa[clave];
    };

    // Toda persona del equipo aparece, aunque no haya registrado nada: un cero
    // también es información.
    this.equipo.forEach(p => de(p));

    const tabla = (n: string) => this.datos[n] || [];

    tabla('Pendientes').filter(p => this.enRango(p.Fecha)).forEach(p => {
      const g = de(p.Responsable);
      g.pendientes++;
      if (this.esDone(p.Estado)) g.finalizadas++;
    });
    tabla('Proyectos').filter(p => this.enRango(p.FechaInicio) || this.enRango(p.FechaFin))
      .forEach(p => de(p.Responsable).proyectos++);
    tabla('Capacitaciones').filter(c => this.enRango(c.Fecha))
      .forEach(c => de(c.Facilitador).capacitaciones++);
    tabla('Comunicaciones').filter(c => this.enRango(c.Fecha))
      .forEach(c => de(c.Responsable).comunicaciones++);
    tabla('Onboarding').filter(o => this.enRango(o.Fecha))
      .forEach(o => de(o.Responsable).onboarding++);
    tabla('Viajes').filter(v => this.enRango(v.FechaSalida))
      .forEach(v => de(v.Viajero).viajes++);

    return Object.keys(mapa).map(k => {
      const g = mapa[k];
      g.total = g.pendientes + g.proyectos + g.capacitaciones +
                g.comunicaciones + g.onboarding + g.viajes + g.candidatos;
      g.cumplimiento = g.pendientes ? Math.round(g.finalizadas * 100 / g.pendientes) : 0;
      return g;
    }).sort((a, b) => b.total - a.total);
  }

  /* ---------------- Totales de arriba ---------------- */

  get totales() {
    const g = this.gestiones;
    const sum = (f: (x: GestionPersona) => number) => g.reduce((n, x) => n + f(x), 0);
    const pend = sum(x => x.pendientes);
    return {
      gestiones: sum(x => x.total),
      pendientes: pend,
      finalizadas: sum(x => x.finalizadas),
      cumplimiento: pend ? Math.round(sum(x => x.finalizadas) * 100 / pend) : 0,
      personas: g.filter(x => x.total > 0).length
    };
  }

  get maximo(): number {
    return Math.max(1, ...this.gestiones.map(g => g.total));
  }

  ancho(g: GestionPersona): number { return Math.round(g.total * 100 / this.maximo); }

  /* ---------------- Descarga ---------------- */

  descargar(): void {
    const R = this.etiquetaPeriodo;
    const filas = this.gestiones.map(g => `<tr>
      <td>${g.persona}</td><td>${g.pendientes}</td><td>${g.finalizadas}</td>
      <td><b>${g.cumplimiento}%</b></td><td>${g.proyectos}</td><td>${g.capacitaciones}</td>
      <td>${g.comunicaciones}</td><td>${g.onboarding}</td><td>${g.viajes}</td>
      <td><b>${g.total}</b></td></tr>`).join('');

    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8">
<title>Tablero ${R} · Escencial</title>
<style>
body{font-family:'Segoe UI',sans-serif;color:#2c3e50;max-width:1000px;margin:30px auto;padding:0 20px}
h1{border-bottom:3px solid #3498db;padding-bottom:10px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.9rem}
th{background:#2c3e50;color:#fff;text-align:left;padding:8px 10px;font-size:.72rem;text-transform:uppercase}
td{padding:8px 10px;border-bottom:1px solid #eee}
.pie{margin-top:40px;color:#888;font-size:.8rem;border-top:1px solid #eee;padding-top:12px}
</style></head><body>
<h1>Tablero de gestión · ${R}</h1>
<p>Escencial Consultora · Generado el ${this.fechaTexto(new Date())}</p>
<table>
<thead><tr><th>Persona</th><th>Pendientes</th><th>Finalizadas</th><th>%</th><th>Proyectos</th>
<th>Capacitaciones</th><th>Comunicaciones</th><th>Onboarding</th><th>Viajes</th><th>Total</th></tr></thead>
<tbody>${filas || '<tr><td colspan="10" style="color:#888">Sin registros en el período.</td></tr>'}</tbody>
</table>
<div class="pie">Cuenta gestiones registradas en el sistema. No mide horas ni esfuerzo.</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Tablero_' + R.replace(/[^\w]+/g, '_') + '.html';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
}
