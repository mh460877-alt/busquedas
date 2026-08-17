import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';
import { EmpresaOpcion } from '../../models/adjunto';


interface Evento {
  dia: number;          // día del mes visible
  titulo: string;
  tipo: 'pendiente' | 'finalizada' | 'viaje' | 'cumple' | 'permiso';
  responsable?: string;
  detalle?: string;
  /** Lo que precisa el tipo: "Incompany Clínica Ledesma", por ejemplo. */
  detalleTipo?: string;
  /** Cliente al que corresponde, si lo tiene. Los cumpleaños no tienen. */
  empresaId?: string;
  empresa?: string;
}

interface Celda {
  dia: number | null;   // null = celda vacía de relleno
  hoy: boolean;
  eventos: Evento[];
}

/**
 * Calendario mensual del mundo interno.
 *
 * No inventa datos: lee las tablas que ya se cargan (Pendientes, Viajes,
 * Cumpleaños) y las pinta en su día. Es exactamente lo que pedía el relevamiento:
 * "ver por día, en qué está trabajando cada uno, con nombre y apellido".
 *
 * Los cumpleaños se repiten todos los años (se comparan mes y día, no el año).
 */
@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent implements OnInit {

  ref = new Date();                 // mes que se está viendo
  celdas: Celda[] = [];
  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  pendientes: any[] = [];
  viajes: any[] = [];
  cumples: any[] = [];
  permisos: any[] = [];
  colaboradores: EmpresaOpcion[] = [];

  diaSeleccionado: number | null = null;
  cargando = true;
  mensaje = '';

  // Alta rápida de pendiente desde el calendario.
  nuevo: any | null = null;
  equipo: string[] = [];
  tipos: string[] = [];
  guardando = false;

  /**
   * Filtro por cliente: "mostrame solo el mes de esta empresa".
   * Vacío = todo. Los cumpleaños quedan fuera al filtrar, porque son del equipo
   * y no de un cliente.
   */
  empresas: EmpresaOpcion[] = [];
  filtroEmpresa = '';

  constructor(private api: ApiService, private loginService: LoginService) { }

  ngOnInit(): void {
    this.cargar();
    this.loginService.catalogos().subscribe({
      next: c => {
        this.equipo = c.equipo || [];
        this.tipos = c.tiposPendiente || [];
        this.empresas = c.empresas || [];
        this.colaboradores = c.colaboradores || [];
        this.construir();     // ya se pueden resolver los nombres
      },
      error: () => { }
    });
  }

  nombreEmpresa(id?: string): string {
    if (!id) return '';
    return this.empresas.find(e => e.id === id)?.nombre ?? '';
  }

  nombreColaborador(id?: string): string {
    if (!id) return '';
    return this.colaboradores.find(c => c.id === id)?.nombre ?? '';
  }

  /** Se vuelve a armar la grilla con el cliente elegido. */
  cambiarEmpresa(): void { this.construir(); }

  get empresaElegida(): string { return this.nombreEmpresa(this.filtroEmpresa); }

  private cargar(): void {
    this.cargando = true;
    // Se traen las tres tablas de una sola vez.
    forkJoin({
      pendientes: this.api.listar<any>('Pendientes'),
      viajes: this.api.listar<any>('Viajes'),
      cumples: this.api.listar<any>('Cumpleanos'),
      permisos: this.api.listar<any>('Permisos')
    }).subscribe({
      next: r => {
        this.pendientes = r.pendientes;
        this.viajes = r.viajes;
        this.cumples = r.cumples;
        this.permisos = r.permisos;
        this.cargando = false;
        this.construir();
      },
      error: e => { this.mensaje = e.message; this.cargando = false; this.construir(); }
    });
  }

  private ymd(dia: number): string {
    const m = ('0' + (this.ref.getMonth() + 1)).slice(-2);
    const d = ('0' + dia).slice(-2);
    return `${this.ref.getFullYear()}-${m}-${d}`;
  }

  /** Abre el alta rápida con la fecha del día ya puesta. */
  abrirNuevo(dia: number): void {
    this.nuevo = {
      Titulo: '', Tipo: '', Detalle: '', Responsable: '', Fecha: this.ymd(dia), Estado: 'Pendiente',
      // Si se está mirando un cliente en particular, el pendiente nace suyo.
      EmpresaID: this.filtroEmpresa
    };
  }

  guardarNuevo(): void {
    if (!this.nuevo?.Titulo?.trim()) { this.mensaje = 'Escribí un título.'; return; }
    this.guardando = true;
    this.api.crear('Pendientes', this.nuevo).subscribe({
      next: () => { this.guardando = false; this.nuevo = null; this.mensaje = 'Pendiente agregado'; this.cargar(); },
      error: e => { this.guardando = false; this.mensaje = e.message; }
    });
  }

  get titulo(): string {
    return this.meses[this.ref.getMonth()] + ' ' + this.ref.getFullYear();
  }

  mesAnterior(): void { this.ref = new Date(this.ref.getFullYear(), this.ref.getMonth() - 1, 1); this.diaSeleccionado = null; this.construir(); }
  mesSiguiente(): void { this.ref = new Date(this.ref.getFullYear(), this.ref.getMonth() + 1, 1); this.diaSeleccionado = null; this.construir(); }
  hoy(): void { this.ref = new Date(); this.diaSeleccionado = null; this.construir(); }

  /** Convierte "yyyy-MM-dd" a Date sin líos de zona horaria. */
  private parse(s: string): Date | null {
    if (!s) return null;
    const p = String(s).slice(0, 10).split('-');
    if (p.length !== 3) return null;
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  private construir(): void {
    const anio = this.ref.getFullYear();
    const mes = this.ref.getMonth();
    const ahora = new Date();

    // Eventos que caen en el mes visible, agrupados por día.
    const porDia: { [dia: number]: Evento[] } = {};
    const agregar = (dia: number, ev: Evento) => {
      // Con un cliente elegido, solo entra lo suyo. Un evento sin cliente
      // —un cumpleaños, un pendiente interno— no pertenece a ninguno.
      if (this.filtroEmpresa && String(ev.empresaId || '') !== this.filtroEmpresa) return;
      if (!porDia[dia]) porDia[dia] = [];
      porDia[dia].push(ev);
    };

    this.pendientes.forEach(p => {
      const f = this.parse(p.Fecha);
      if (f && f.getFullYear() === anio && f.getMonth() === mes) {
        const fin = /finaliz/i.test(p.Estado || '');
        agregar(f.getDate(), {
          dia: f.getDate(), titulo: p.Titulo, responsable: p.Responsable,
          tipo: fin ? 'finalizada' : 'pendiente',
          detalle: [p.Tipo, p.Detalle, p.Estado].filter(Boolean).join(' · '),
          detalleTipo: p.Detalle,
          empresaId: p.EmpresaID, empresa: this.nombreEmpresa(p.EmpresaID)
        });
      }
    });

    this.viajes.forEach(v => {
      const f = this.parse(v.FechaSalida);
      if (f && f.getFullYear() === anio && f.getMonth() === mes) {
        agregar(f.getDate(), {
          dia: f.getDate(), titulo: '✈ ' + (v.Destino || 'Viaje'),
          responsable: v.Viajero, tipo: 'viaje', detalle: v.Cliente,
          empresaId: v.EmpresaID, empresa: this.nombreEmpresa(v.EmpresaID)
        });
      }
    });

    this.cumples.forEach(c => {
      const f = this.parse(c.Fecha);
      if (f && f.getMonth() === mes) {   // se repite todos los años: solo importa mes/día
        agregar(f.getDate(), {
          dia: f.getDate(), titulo: '🎂 ' + c.Persona,
          tipo: 'cumple', detalle: c.Tipo
        });
      }
    });

    /**
     * Los permisos se pintan en cada día que dura la licencia, no solo el
     * primero: la pregunta que hay que poder contestar mirando el mes es
     * "¿quién está hoy?", y para eso el rango tiene que verse entero.
     * Los rechazados no se muestran: esa persona trabaja normalmente.
     */
    this.permisos.forEach(p => {
      if (/rechaz/i.test(p.Estado || '')) return;
      const desde = this.parse(p.Desde);
      if (!desde) return;
      const hasta = this.parse(p.Hasta) || desde;

      const persona = this.nombreColaborador(p.ColaboradorID);
      const cursor = new Date(desde);
      while (cursor <= hasta) {
        if (cursor.getFullYear() === anio && cursor.getMonth() === mes) {
          agregar(cursor.getDate(), {
            dia: cursor.getDate(),
            titulo: '🌴 ' + (persona || 'Licencia'),
            responsable: persona,
            tipo: 'permiso',
            detalle: [p.Tipo, p.Estado].filter(Boolean).join(' · '),
            detalleTipo: p.Tipo
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    // Grilla del mes: relleno inicial hasta el día de semana del día 1 (lunes primero).
    const primero = new Date(anio, mes, 1);
    const offset = (primero.getDay() + 6) % 7;   // 0 = lunes
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    const celdas: Celda[] = [];
    for (let i = 0; i < offset; i++) celdas.push({ dia: null, hoy: false, eventos: [] });
    for (let d = 1; d <= diasEnMes; d++) {
      celdas.push({
        dia: d,
        hoy: ahora.getFullYear() === anio && ahora.getMonth() === mes && ahora.getDate() === d,
        eventos: porDia[d] || []
      });
    }
    // Relleno final para completar la última semana.
    while (celdas.length % 7 !== 0) celdas.push({ dia: null, hoy: false, eventos: [] });

    this.celdas = celdas;
  }

  seleccionar(c: Celda): void {
    if (!c.dia) return;
    this.diaSeleccionado = this.diaSeleccionado === c.dia ? null : c.dia;
  }

  get eventosDelDia(): Evento[] {
    if (!this.diaSeleccionado) return [];
    const c = this.celdas.find(x => x.dia === this.diaSeleccionado);
    return c ? c.eventos : [];
  }
}
