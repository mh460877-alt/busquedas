import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { AdjuntoService } from '../../services/adjunto.service';
import { MODULOS } from '../../models/modulos.config';
import { ConfigModulo, CampoModulo } from '../../models/modulo';
import { Adjunto, EmpresaOpcion } from '../../models/adjunto';
import { nuevosPrimero } from '../../models/orden';

/**
 * Componente genérico para los módulos internos (agenda RR.HH.).
 * Todos son tablas CRUD del mismo patrón, así que uno solo los dibuja a todos:
 * la configuración de cada módulo vive en modulos.config.ts.
 *
 * Los permisos los aplica el servidor; acá solo se muestran u ocultan botones.
 */
@Component({
  selector: 'app-modulo-interno',
  templateUrl: './modulo-interno.component.html',
  styleUrls: ['./modulo-interno.component.css']
})
export class ModuloInternoComponent implements OnInit {

  config!: ConfigModulo;
  filas: any[] = [];
  catalogos: any = {};
  permisos: string[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  editando: any | null = null;   // registro en edición (o {} para nuevo)
  esNuevo = false;
  guardando = false;
  verClaves: { [id: string]: boolean } = {};   // mostrar/ocultar en la bóveda

  /** Clientes, para el campo Empresa y para filtrar la tabla por cliente. */
  empresas: EmpresaOpcion[] = [];
  filtroEmpresa = '';

  /** Enlaces de cada fila, traídos todos juntos en una sola llamada. */
  enlacesPorRegistro: { [registroId: string]: Adjunto[] } = {};
  /** Fila cuyos enlaces se están mirando. */
  enlazando: any | null = null;

  /** Carpetas cerradas, cuando el módulo se muestra agrupado. */
  plegados: { [carpeta: string]: boolean } = {};

  constructor(
    private api: ApiService,
    private loginService: LoginService,
    private storage: StorageService,
    private adjuntos: AdjuntoService,
    private ruta: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Se reconfigura al cambiar de módulo sin recrear el componente.
    this.ruta.data.subscribe(() => this.iniciar());
    this.ruta.params.subscribe(() => this.iniciar());
  }

  private iniciar(): void {
    const clave = this.ruta.snapshot.data['modulo'];
    this.config = MODULOS[clave];
    this.editando = null;
    this.enlazando = null;
    this.filtroEmpresa = '';
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.loginService.catalogos().subscribe({
      next: c => {
        this.catalogos = c;
        this.empresas = c.empresas || [];
        this.permisos = (c.permisos && c.permisos[this.config.entidad]) || [];
      },
      error: () => { }
    });
    this.api.listar<any>(this.config.entidad).subscribe({
      next: f => { this.filas = f; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.cargarEnlaces();
  }

  /** Los enlaces de todas las filas, de una sola vez. */
  cargarEnlaces(): void {
    this.adjuntos.listar(this.config.entidad).subscribe({
      next: lista => this.enlacesPorRegistro = this.adjuntos.agrupar(lista),
      error: () => { }
    });
  }

  get rol(): string { return this.storage.rol; }
  puede(accion: string): boolean { return this.permisos.includes(accion); }

  /**
   * Los campos que este rol puede ver. Los marcados como sensibles el servidor
   * directamente no los envía a quien no es Administración; esconderlos acá
   * evita mostrarle casilleros vacíos que parecen datos faltantes.
   */
  get campos(): CampoModulo[] {
    return this.config.campos.filter(c => !c.soloAdmin || this.rol === 'Admin');
  }

  get columnas(): CampoModulo[] { return this.campos.filter(c => c.enTabla); }

  opcionesDe(campo: CampoModulo): string[] {
    if (campo.opciones) return campo.opciones;
    if (campo.catalogo) return this.catalogos[campo.catalogo] || [];
    return [];
  }

  /**
   * Las opciones del desplegable, más el valor que ya tenía el registro si hoy
   * no está en la lista.
   *
   * Cuando se saca una opción del catálogo, los registros viejos siguen con el
   * valor anterior. Sin esto, al abrirlos el desplegable aparecería vacío y con
   * guardar se les borraría el dato sin que nadie lo pida.
   */
  opcionesParaEditar(campo: CampoModulo): string[] {
    const opciones = this.opcionesDe(campo);
    const actual = this.editando ? this.editando[campo.clave] : '';
    if (actual && !opciones.includes(actual)) return [actual].concat(opciones);
    return opciones;
  }

  /** Este módulo se puede vincular a un cliente. */
  get tieneEmpresa(): boolean {
    return this.config.campos.some(c => c.clave === 'EmpresaID');
  }

  nombreEmpresa(id?: string): string {
    if (!id) return '';
    return this.empresas.find(e => e.id === id)?.nombre ?? '';
  }

  /** Opciones de un campo que apunta a otra tabla. */
  opcionesRef(campo: CampoModulo): EmpresaOpcion[] {
    return this.catalogos[campo.refCatalogo || ''] || [];
  }

  /** El nombre detrás de un ID guardado. */
  nombreRef(campo: CampoModulo, id?: string): string {
    if (!id) return '';
    return this.opcionesRef(campo).find(o => o.id === id)?.nombre ?? '';
  }

  enlacesDe(fila: any): Adjunto[] {
    return this.enlacesPorRegistro[String(fila.ID)] || [];
  }

  abrirEnlaces(fila: any): void { this.enlazando = fila; }
  cerrarEnlaces(): void { this.enlazando = null; this.cargarEnlaces(); }

  /** Este módulo se muestra en carpetas. */
  get agrupado(): boolean { return !!this.config.agruparPor; }

  /**
   * Las filas repartidas en carpetas.
   *
   * Una bóveda con veinte accesos en lista corrida obliga a leerla entera para
   * encontrar una casilla de correo. Agrupada, se va derecho a la carpeta.
   * Lo que todavía no tiene carpeta queda junto al final, a la vista, para que
   * se pueda clasificar en lugar de perderse.
   */
  get carpetas(): { nombre: string; filas: any[]; sinClasificar: boolean }[] {
    const campo = this.config.agruparPor!;
    const mapa = new Map<string, any[]>();
    this.visibles.forEach(f => {
      const clave = String(f[campo] || '');
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push(f);
    });

    const salida: { nombre: string; filas: any[]; sinClasificar: boolean }[] = [];
    mapa.forEach((filas, clave) => salida.push({
      nombre: clave || 'Sin carpeta',
      filas,
      sinClasificar: !clave
    }));
    return salida.sort((a, b) =>
      (a.sinClasificar ? 1 : 0) - (b.sinClasificar ? 1 : 0) || a.nombre.localeCompare(b.nombre));
  }

  trackCarpeta(_: number, c: { nombre: string }): string { return c.nombre; }

  abierta(nombre: string): boolean { return this.plegados[nombre] !== true; }
  alternarCarpeta(nombre: string): void { this.plegados[nombre] = !this.plegados[nombre]; }

  get visibles(): any[] {
    const t = this.filtro.toLowerCase().trim();

    return nuevosPrimero(this.filas.filter(f => {
      if (this.filtroEmpresa && String(f['EmpresaID']) !== this.filtroEmpresa) return false;
      if (!t) return true;
      // Los nombres detrás de cada referencia se resuelven para poder buscarlos:
      // en la fila guardada hay un ID, que a nadie le sirve para buscar.
      const refs = this.campos
        .filter(c => c.tipo === 'referencia')
        .map(c => this.nombreRef(c, f[c.clave]))
        .join(' ');
      const texto = this.campos.map(c => f[c.clave]).join(' ') + ' ' + refs;
      return texto.toLowerCase().includes(t);
    }));
  }

  /**
   * El color de una etiqueta, según lo que diga.
   *
   * Antes todas salían azules, así que una tabla con estados mezclados —en
   * curso, finalizado, sin iniciar— se veía igual de punta a punta y había que
   * leer cada celda. El color se deduce del texto y no de una lista fija, para
   * que valga igual en los estados de un proyecto, en la prioridad de un pedido
   * o en cualquier catálogo que se agregue mañana.
   */
  claseBadge(valor: any): string {
    const v = String(valor || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');   // sin acentos

    if (!v) return 'badge-gris';
    // Terminado y bien
    if (/finaliz|complet|aprobad|contratad|cerrad|realizad|tomad|alcanzad/.test(v)) return 'badge-activa';
    // Se cayó o no va más
    if (/rechaz|descartad|cancelad|baja|vencid|urgente/.test(v)) return 'badge-rojo';
    // Frenado, esperando a alguien
    if (/pausa|espera|pendiente|analisis|revision|borrador|solicitad/.test(v)) return 'badge-ambar';
    // Todavía no arrancó
    if (/sin iniciar|sin ver|nueva|nuevo|programad/.test(v)) return 'badge-gris';
    // En movimiento
    if (/curso|proceso|activ|implementa|seguimiento|evaluacion|entrevista/.test(v)) return 'badge-azul';
    // Lo que no encaja en ningún grupo, pero es un valor válido
    return 'badge-morado';
  }

  mostrar(fila: any, campo: CampoModulo): string {
    const v = fila[campo.clave];
    if (campo.tipo === 'password') {
      return this.verClaves[fila.ID] ? (v || '—') : '••••••••';
    }
    if (campo.tipo === 'referencia') {
      return this.nombreRef(campo, v) || '—';
    }
    // El servidor devuelve las columnas llamadas "Fecha" con la hora pegada
    // (2026-08-10 00:00:00). En una agenda la hora no aporta y ensucia.
    if (campo.tipo === 'fecha') {
      return v ? String(v).slice(0, 10) : '—';
    }
    return v || '—';
  }

  alternarClave(fila: any): void { this.verClaves[fila.ID] = !this.verClaves[fila.ID]; }

  nuevo(): void { this.esNuevo = true; this.editando = {}; }

  editar(fila: any): void {
    this.esNuevo = false;
    const copia = { ...fila };
    /**
     * Las fechas vuelven del servidor con la hora pegada, y un <input type="date">
     * no acepta ese formato: mostraba el campo vacío, y al guardar se borraba la
     * fecha que el registro ya tenía.
     */
    this.campos
      .filter(c => c.tipo === 'fecha')
      .forEach(c => { if (copia[c.clave]) copia[c.clave] = String(copia[c.clave]).slice(0, 10); });
    this.editando = copia;
  }
  cerrar(): void { this.editando = null; }

  guardar(): void {
    const faltan = this.campos
      .filter(c => c.requerido && !this.editando[c.clave])
      .map(c => c.etiqueta);
    if (faltan.length) { this.mensaje = 'Faltan: ' + faltan.join(', '); return; }

    this.guardando = true;
    const fin = () => { this.guardando = false; this.editando = null; this.mensaje = 'Guardado'; this.cargar(); };
    const err = (e: Error) => { this.guardando = false; this.mensaje = e.message; };

    if (this.esNuevo) {
      this.api.crear(this.config.entidad, this.editando).subscribe({ next: fin, error: err });
    } else {
      this.api.editar(this.config.entidad, this.editando.ID, this.editando).subscribe({ next: fin, error: err });
    }
  }

  eliminar(fila: any): void {
    if (!confirm('¿Eliminar este registro?')) return;
    this.api.eliminar(this.config.entidad, fila.ID, true).subscribe({
      next: () => { this.mensaje = 'Eliminado'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }
}
