import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';

type Frecuencia = 'Diario' | 'Semanal' | 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';

/** Un tramo de tiempo con lo que se logró adentro. */
interface Tramo { etiqueta: string; desde: Date; hasta: Date; logrado: number; actual: boolean; }

/** Cómo viene un objetivo en el período elegido. */
interface Meta {
  id: string;
  titulo: string;
  persona: string;
  unidad: string;
  meta: number;
  logrado: number;
  pct: number;
  estado: 'En progreso' | 'Cerca del objetivo' | 'Objetivo alcanzado' | 'Objetivo superado';
  falta: number;
  record: number;        // el mejor tramo anterior
  superaRecord: boolean;
}

/**
 * Tablero de evolución y desafíos.
 *
 * No cuenta horas ni presencias ni marca a nadie como ausente: muestra qué se
 * propuso cada uno, cuánto lleva y cuánto le falta. La pregunta que contesta no
 * es "¿trabajó?" sino "¿lo estoy logrando, y puedo superar mi mejor marca?".
 *
 * De ahí que la marca personal tenga tanto peso como la meta: competir contra
 * el propio récord empuja sin necesidad de comparar a una persona con otra.
 */
@Component({
  selector: 'app-evolucion',
  templateUrl: './evolucion.component.html',
  styleUrls: ['./evolucion.component.css']
})
export class EvolucionComponent implements OnInit {

  frecuencia: Frecuencia = 'Mensual';
  persona = '';
  cargando = true;
  mensaje = '';

  equipo: string[] = [];
  private objetivos: any[] = [];
  private avances: any[] = [];

  readonly frecuencias: Frecuencia[] =
    ['Diario', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual'];

  /** Cuántos tramos hacia atrás dibuja el gráfico según la frecuencia. */
  private readonly tramosPorFrecuencia: { [f: string]: number } = {
    Diario: 14, Semanal: 12, Mensual: 12, Trimestral: 8, Semestral: 6, Anual: 5
  };

  constructor(private api: ApiService, private loginService: LoginService) { }

  ngOnInit(): void {
    this.api.llamar<any>('metas').subscribe({
      next: r => {
        this.objetivos = (r.objetivos || []).filter((o: any) => o.Estado !== 'Cerrado');
        this.avances = r.avances || [];
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.loginService.catalogos().subscribe({
      next: c => this.equipo = c.equipo || [],
      error: () => { }
    });
  }

  /* ---------------- Fechas ---------------- */

  private parse(s: string): Date | null {
    if (!s) return null;
    const p = String(s).slice(0, 10).split('-');
    if (p.length !== 3) return null;
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  private num(v: any): number {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  /** El tramo número `atras` hacia atrás, contando 0 como el actual. */
  private tramo(atras: number): { desde: Date; hasta: Date; etiqueta: string } {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (this.frecuencia === 'Diario') {
      const d = new Date(y, m, hoy.getDate() - atras);
      const f = new Date(d); f.setDate(d.getDate() + 1);
      return { desde: d, hasta: f, etiqueta: d.getDate() + '/' + (d.getMonth() + 1) };
    }
    if (this.frecuencia === 'Semanal') {
      const lunes = new Date(y, m, hoy.getDate() - ((hoy.getDay() + 6) % 7) - atras * 7);
      const fin = new Date(lunes); fin.setDate(lunes.getDate() + 7);
      return { desde: lunes, hasta: fin, etiqueta: lunes.getDate() + '/' + (lunes.getMonth() + 1) };
    }
    if (this.frecuencia === 'Mensual') {
      const d = new Date(y, m - atras, 1);
      return { desde: d, hasta: new Date(d.getFullYear(), d.getMonth() + 1, 1), etiqueta: meses[d.getMonth()] };
    }
    if (this.frecuencia === 'Trimestral') {
      const ini = new Date(y, Math.floor(m / 3) * 3 - atras * 3, 1);
      return {
        desde: ini, hasta: new Date(ini.getFullYear(), ini.getMonth() + 3, 1),
        etiqueta: 'T' + (Math.floor(ini.getMonth() / 3) + 1) + ' ' + String(ini.getFullYear()).slice(2)
      };
    }
    if (this.frecuencia === 'Semestral') {
      const ini = new Date(y, (m < 6 ? 0 : 6) - atras * 6, 1);
      return {
        desde: ini, hasta: new Date(ini.getFullYear(), ini.getMonth() + 6, 1),
        etiqueta: (ini.getMonth() < 6 ? '1S ' : '2S ') + String(ini.getFullYear()).slice(2)
      };
    }
    const ini = new Date(y - atras, 0, 1);
    return { desde: ini, hasta: new Date(y - atras + 1, 0, 1), etiqueta: String(ini.getFullYear()) };
  }

  /* ---------------- Cálculo ---------------- */

  private objetivosVisibles(): any[] {
    return this.objetivos.filter(o => !this.persona || o.Colaborador === this.persona);
  }

  private logradoEn(objetivoId: string, desde: Date, hasta: Date): number {
    return this.avances
      .filter(a => String(a.ObjetivoID) === String(objetivoId))
      .filter(a => { const d = this.parse(a.Fecha); return !!d && d >= desde && d < hasta; })
      .reduce((n, a) => n + this.num(a.Cantidad), 0);
  }

  /** La evolución: un tramo por barra, del más viejo al actual. */
  get tramos(): Tramo[] {
    const cuantos = this.tramosPorFrecuencia[this.frecuencia] || 12;
    const ids = this.objetivosVisibles().map(o => String(o.ID));
    const salida: Tramo[] = [];
    for (let i = cuantos - 1; i >= 0; i--) {
      const t = this.tramo(i);
      const logrado = ids.reduce((n, id) => n + this.logradoEn(id, t.desde, t.hasta), 0);
      salida.push({ etiqueta: t.etiqueta, desde: t.desde, hasta: t.hasta, logrado, actual: i === 0 });
    }
    return salida;
  }

  get maximo(): number { return Math.max(1, ...this.tramos.map(t => t.logrado)); }
  altura(t: Tramo): number { return Math.round(t.logrado * 100 / this.maximo); }

  /** Cada objetivo con su avance en el tramo actual y su marca a superar. */
  get metas(): Meta[] {
    const actual = this.tramo(0);
    const cuantos = this.tramosPorFrecuencia[this.frecuencia] || 12;

    return this.objetivosVisibles().map(o => {
      const meta = this.num(o.Meta);
      const logrado = this.logradoEn(o.ID, actual.desde, actual.hasta);
      const pct = meta > 0 ? Math.round(logrado * 100 / meta) : 0;

      // La marca a superar: el mejor tramo anterior, sin contar el que corre.
      let record = 0;
      for (let i = 1; i < cuantos; i++) {
        const t = this.tramo(i);
        record = Math.max(record, this.logradoEn(o.ID, t.desde, t.hasta));
      }

      let estado: Meta['estado'] = 'En progreso';
      if (pct >= 100 && logrado > meta) estado = 'Objetivo superado';
      else if (pct >= 100) estado = 'Objetivo alcanzado';
      else if (pct >= 70) estado = 'Cerca del objetivo';

      return {
        id: o.ID, titulo: o.Titulo, persona: o.Colaborador || 'Del equipo',
        unidad: o.Unidad || '', meta, logrado, pct, estado,
        falta: Math.max(0, meta - logrado),
        record, superaRecord: record > 0 && logrado > record
      };
    }).sort((a, b) => b.pct - a.pct);
  }

  get totales() {
    const m = this.metas;
    const suma = (f: (x: Meta) => number) => m.reduce((n, x) => n + f(x), 0);
    const meta = suma(x => x.meta);
    const logrado = suma(x => x.logrado);
    return {
      objetivos: m.length,
      logrado, meta,
      pct: meta > 0 ? Math.round(logrado * 100 / meta) : 0,
      alcanzados: m.filter(x => x.pct >= 100).length,
      superados: m.filter(x => x.estado === 'Objetivo superado').length,
      records: m.filter(x => x.superaRecord).length
    };
  }

  get etiquetaTramo(): string { return this.tramo(0).etiqueta; }

  clase(m: Meta): string {
    if (m.estado === 'Objetivo superado') return 'superado';
    if (m.estado === 'Objetivo alcanzado') return 'alcanzado';
    if (m.estado === 'Cerca del objetivo') return 'cerca';
    return 'progreso';
  }

  /** La barra no pasa del 100% aunque el logro sí: el exceso se cuenta aparte. */
  ancho(m: Meta): number { return Math.min(100, m.pct); }
}
