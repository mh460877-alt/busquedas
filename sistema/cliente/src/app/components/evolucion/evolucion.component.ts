import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';

type Clave = 'Diario' | 'Semanal' | 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';

/** Una ventana de tiempo: de cuándo a cuándo, y cómo se llama. */
interface Ventana { desde: Date; hasta: Date; etiqueta: string; }

/** Un horizonte con todo lo que hace falta para leerlo de un vistazo. */
interface Horizonte {
  clave: Clave;
  titulo: string;
  icono: string;
  ventana: string;
  meta: number;            // 0 = todavía no hay meta puesta acá
  logrado: number;
  pct: number;
  falta: number;
  excedente: number;
  anterior: number;
  evolucion: number;       // contra el período anterior
  mejora: number;          // en %
  record: number;          // la mejor marca previa
  esRecord: boolean;
  proyeccion: number;      // a dónde llega si sigue a este ritmo
  reconocimiento: string;
  partes: { etiqueta: string; valor: number }[];   // de qué se compone
}

/**
 * Tablero de evolución y desafíos.
 *
 * Responde cuatro preguntas y nada más: dónde estoy, qué logré, qué me falta y
 * cuál es mi próximo desafío. No cuenta horas, no marca presencias y no compara
 * a una persona con otra: la referencia es siempre la marca propia.
 *
 * Los seis horizontes se alimentan de los mismos avances. Un avance de hoy suma
 * al día, a la semana, al mes, al trimestre, al semestre y al año a la vez, y
 * por eso el tablero puede mostrar cómo un logro chico empuja al grande.
 */
@Component({
  selector: 'app-evolucion',
  templateUrl: './evolucion.component.html',
  styleUrls: ['./evolucion.component.css']
})
export class EvolucionComponent implements OnInit {

  persona = '';
  objetivoId = '';
  cargando = true;
  mensaje = '';

  equipo: string[] = [];
  objetivos: any[] = [];
  private avances: any[] = [];

  /** El gráfico grande sigue este horizonte. */
  grafico: Clave = 'Mensual';

  private readonly def: { clave: Clave; titulo: string; icono: string; campo: string }[] = [
    { clave: 'Diario',     titulo: 'Desafío diario',      icono: '🏆', campo: 'MetaDiaria' },
    { clave: 'Semanal',    titulo: 'Desafío semanal',     icono: '🚀', campo: 'MetaSemanal' },
    { clave: 'Mensual',    titulo: 'Meta mensual',        icono: '⭐', campo: 'MetaMensual' },
    { clave: 'Trimestral', titulo: 'Evolución trimestral', icono: '📈', campo: 'MetaTrimestral' },
    { clave: 'Semestral',  titulo: 'Reto semestral',      icono: '🔥', campo: 'MetaSemestral' },
    { clave: 'Anual',      titulo: 'Logro anual',         icono: '🏅', campo: 'MetaAnual' }
  ];

  constructor(
    private api: ApiService,
    private loginService: LoginService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {
    // Arranca mirando lo propio: la comparación que importa es con uno mismo.
    this.persona = this.storage.nombre;

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

  /* ---------------- Ventanas de tiempo ---------------- */

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

  private readonly meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  /** La ventana `atras` períodos hacia atrás. 0 es la que está corriendo. */
  private ventana(clave: Clave, atras: number): Ventana {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();

    if (clave === 'Diario') {
      const d = new Date(y, m, hoy.getDate() - atras);
      const f = new Date(d); f.setDate(d.getDate() + 1);
      return { desde: d, hasta: f, etiqueta: d.getDate() + '/' + (d.getMonth() + 1) };
    }
    if (clave === 'Semanal') {
      const ini = new Date(y, m, hoy.getDate() - ((hoy.getDay() + 6) % 7) - atras * 7);
      const fin = new Date(ini); fin.setDate(ini.getDate() + 7);
      return { desde: ini, hasta: fin, etiqueta: 'sem. del ' + ini.getDate() + '/' + (ini.getMonth() + 1) };
    }
    if (clave === 'Mensual') {
      const d = new Date(y, m - atras, 1);
      return {
        desde: d, hasta: new Date(d.getFullYear(), d.getMonth() + 1, 1),
        etiqueta: this.meses[d.getMonth()] + ' ' + d.getFullYear()
      };
    }
    if (clave === 'Trimestral') {
      const ini = new Date(y, Math.floor(m / 3) * 3 - atras * 3, 1);
      return {
        desde: ini, hasta: new Date(ini.getFullYear(), ini.getMonth() + 3, 1),
        etiqueta: 'T' + (Math.floor(ini.getMonth() / 3) + 1) + ' ' + ini.getFullYear()
      };
    }
    if (clave === 'Semestral') {
      const ini = new Date(y, (m < 6 ? 0 : 6) - atras * 6, 1);
      return {
        desde: ini, hasta: new Date(ini.getFullYear(), ini.getMonth() + 6, 1),
        etiqueta: (ini.getMonth() < 6 ? '1er' : '2do') + ' sem. ' + ini.getFullYear()
      };
    }
    const ini = new Date(y - atras, 0, 1);
    return { desde: ini, hasta: new Date(y - atras + 1, 0, 1), etiqueta: String(ini.getFullYear()) };
  }

  /* ---------------- Qué objetivos entran ---------------- */

  /**
   * Lo de la persona elegida, más lo compartido (equipo, área, proyecto,
   * servicio): un objetivo del equipo también es de cada uno.
   */
  get objetivosEnJuego(): any[] {
    return this.objetivos.filter(o => {
      if (this.objetivoId) return String(o.ID) === this.objetivoId;
      if (!this.persona) return true;
      const esPersonal = (o.Ambito || 'Persona') === 'Persona';
      return esPersonal ? o.Colaborador === this.persona : true;
    });
  }

  private logradoEn(desde: Date, hasta: Date): number {
    const ids = this.objetivosEnJuego.map(o => String(o.ID));
    return this.avances
      .filter(a => ids.indexOf(String(a.ObjetivoID)) >= 0)
      .filter(a => { const d = this.parse(a.Fecha); return !!d && d >= desde && d < hasta; })
      .reduce((n, a) => n + this.num(a.Cantidad), 0);
  }

  private metaDe(campo: string): number {
    return this.objetivosEnJuego.reduce((n, o) => n + this.num(o[campo]), 0);
  }

  /** De qué se compone un horizonte: sus tramos más chicos. */
  private partesDe(clave: Clave): { etiqueta: string; valor: number }[] {
    const sub: { [k: string]: { clave: Clave; cuantos: number } } = {
      Semanal:    { clave: 'Diario',  cuantos: 7 },
      Mensual:    { clave: 'Semanal', cuantos: 5 },
      Trimestral: { clave: 'Mensual', cuantos: 3 },
      Semestral:  { clave: 'Mensual', cuantos: 6 },
      Anual:      { clave: 'Mensual', cuantos: 12 }
    };
    const s = sub[clave];
    if (!s) return [];
    const salida = [];
    for (let i = s.cuantos - 1; i >= 0; i--) {
      const v = this.ventana(s.clave, i);
      salida.push({ etiqueta: v.etiqueta, valor: this.logradoEn(v.desde, v.hasta) });
    }
    return salida;
  }

  /* ---------------- Las seis tarjetas ---------------- */

  get horizontes(): Horizonte[] {
    return this.def.map(d => {
      const actual = this.ventana(d.clave, 0);
      const previa = this.ventana(d.clave, 1);

      const meta = this.metaDe(d.campo);
      const logrado = this.logradoEn(actual.desde, actual.hasta);
      const anterior = this.logradoEn(previa.desde, previa.hasta);
      const pct = meta > 0 ? Math.round(logrado * 100 / meta) : 0;

      // La marca a superar sale de los períodos ya cerrados, nunca del que corre.
      let record = 0;
      for (let i = 1; i <= 12; i++) {
        const v = this.ventana(d.clave, i);
        record = Math.max(record, this.logradoEn(v.desde, v.hasta));
      }

      // Proyección: a este ritmo, dónde termina el período.
      const total = actual.hasta.getTime() - actual.desde.getTime();
      const corrido = Math.max(1, Math.min(total, Date.now() - actual.desde.getTime()));
      const proyeccion = Math.round(logrado * total / corrido);

      let reconocimiento = '';
      if (meta > 0 && logrado > meta) reconocimiento = '🚀 ¡Objetivo superado!';
      else if (meta > 0 && logrado >= meta) reconocimiento = '🏆 ¡Objetivo alcanzado!';
      else if (record > 0 && logrado > record) reconocimiento = '🔥 ¡Nuevo récord personal!';
      else if (anterior > 0 && logrado > anterior) reconocimiento = '💪 Mejor que el período anterior';

      return {
        clave: d.clave, titulo: d.titulo, icono: d.icono, ventana: actual.etiqueta,
        meta, logrado, pct,
        falta: Math.max(0, meta - logrado),
        excedente: Math.max(0, logrado - meta),
        anterior,
        evolucion: logrado - anterior,
        mejora: anterior > 0 ? Math.round((logrado - anterior) * 100 / anterior) : 0,
        record, esRecord: record > 0 && logrado > record,
        proyeccion, reconocimiento,
        partes: this.partesDe(d.clave)
      };
    });
  }

  h(clave: Clave): Horizonte {
    return this.horizontes.filter(x => x.clave === clave)[0];
  }

  /* ---------------- Mi próximo desafío ---------------- */

  /**
   * El desafío más cerca de caer. Primero el que está a menos de un paso de su
   * meta; si están todas cubiertas, el récord más alcanzable. Siempre uno solo:
   * un tablero que propone seis cosas a la vez no propone ninguna.
   */
  get proximoDesafio(): { titulo: string; texto: string; icono: string; pct: number } {
    const hs = this.horizontes;

    const record = hs.filter(x => x.esRecord)[0];
    if (record) {
      return {
        icono: '🚀', titulo: '¡Nuevo récord personal!',
        texto: `Tu ${record.titulo.toLowerCase()} va en ${record.logrado}, por encima de tu mejor marca de ${record.record}. Seguí así.`,
        pct: 100
      };
    }

    const faltantes = hs.filter(x => x.meta > 0 && x.falta > 0).sort((a, b) => a.falta - b.falta);
    if (faltantes.length) {
      const f = faltantes[0];
      return {
        icono: '🔥', titulo: 'Tu próximo desafío',
        texto: `Te faltan ${f.falta} para alcanzar tu ${f.titulo.toLowerCase()}.`,
        pct: f.pct
      };
    }

    const marcas = hs.filter(x => x.record > 0 && x.logrado <= x.record)
      .sort((a, b) => (a.record - a.logrado) - (b.record - b.logrado));
    if (marcas.length) {
      const m = marcas[0];
      const falta = m.record - m.logrado;
      const pct = m.record > 0 ? Math.round(m.logrado * 100 / m.record) : 0;
      return {
        icono: '⭐', titulo: 'Superá tu propio resultado',
        texto: `Estás a ${falta} de superar tu mejor ${m.titulo.toLowerCase()} (${m.record}).`,
        pct
      };
    }

    return {
      icono: '🌱', titulo: 'Empezá tu primer desafío',
      texto: 'Cargá un objetivo con su meta y registrá tu primer avance. Desde ahí el tablero te va a mostrar tu evolución.',
      pct: 0
    };
  }

  /** Todos los reconocimientos ganados ahora mismo, sin repetir. */
  get reconocimientos(): string[] {
    const vistos: string[] = [];
    this.horizontes.forEach(h => {
      if (h.reconocimiento && vistos.indexOf(h.reconocimiento) < 0) vistos.push(h.reconocimiento);
    });
    return vistos;
  }

  /* ---------------- La cadena de progresión ---------------- */

  /**
   * Cómo lo de hoy empuja a lo grande: el mismo avance sumando en los seis
   * horizontes a la vez.
   */
  get cadena(): { icono: string; titulo: string; logrado: number; meta: number; pct: number }[] {
    return this.horizontes.map(h => ({
      icono: h.icono, titulo: h.clave, logrado: h.logrado, meta: h.meta, pct: h.pct
    }));
  }

  /* ---------------- El gráfico ---------------- */

  get serie(): { etiqueta: string; valor: number; actual: boolean }[] {
    const cuantos: { [k: string]: number } =
      { Diario: 14, Semanal: 12, Mensual: 12, Trimestral: 8, Semestral: 6, Anual: 5 };
    const n = cuantos[this.grafico] || 12;
    const salida = [];
    for (let i = n - 1; i >= 0; i--) {
      const v = this.ventana(this.grafico, i);
      salida.push({ etiqueta: v.etiqueta, valor: this.logradoEn(v.desde, v.hasta), actual: i === 0 });
    }
    return salida;
  }

  get maximo(): number { return Math.max(1, ...this.serie.map(s => s.valor)); }
  altura(v: number): number { return Math.round(v * 100 / this.maximo); }

  /* ---------------- Ayudas de pantalla ---------------- */

  get frecuencias(): Clave[] { return this.def.map(d => d.clave); }

  clase(h: Horizonte): string {
    if (h.meta <= 0) return 'sinmeta';
    if (h.logrado > h.meta) return 'superado';
    if (h.pct >= 100) return 'alcanzado';
    if (h.pct >= 70) return 'cerca';
    return 'progreso';
  }

  ancho(h: Horizonte): number { return h.meta > 0 ? Math.min(100, h.pct) : 0; }

  anchoParte(p: { valor: number }, h: Horizonte): number {
    const max = Math.max(1, ...h.partes.map(x => x.valor));
    return Math.round(p.valor * 100 / max);
  }
}
