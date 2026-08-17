import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { UsuarioService } from '../../services/usuario.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { FichaEmpresa } from '../../models/empresa';
import { Adjunto } from '../../models/adjunto';
import { Usuario } from '../../models/usuario';
import { MODULOS } from '../../models/modulos.config';

/**
 * Ficha de un cliente: todo lo que hicimos y tenemos de esa empresa, junto.
 *
 * Es lo que convierte al sistema en resguardo y no solo en organizador. Antes,
 * para saber qué pasaba con un cliente había que mirar el calendario, después
 * las búsquedas, después los viajes, y los enlaces estaban en un Trello aparte.
 * Acá está todo en una pantalla, y en una sola llamada al servidor.
 */
@Component({
  selector: 'app-empresa-ficha',
  templateUrl: './empresa-ficha.component.html',
  styleUrls: ['./empresa-ficha.component.css']
})
export class EmpresaFichaComponent implements OnInit {

  ficha: FichaEmpresa | null = null;
  cargando = true;
  mensaje = '';

  /** Enlaces agrupados por tabla y registro, para colgarlos donde corresponde. */
  private porRegistro: { [clave: string]: Adjunto[] } = {};

  /** Orden en que se muestran los módulos internos. */
  readonly ordenModulos = [
    'Proyectos', 'Pendientes', 'Viajes', 'Onboarding',
    'Capacitaciones', 'Comunicaciones', 'Materiales'
  ];

  /* ---- Alta de accesos para la gente del cliente ---- */
  altaAcceso: Usuario | null = null;
  claveAcceso = '';
  guardandoAcceso = false;
  mensajeAcceso = '';

  constructor(
    private empresaService: EmpresaService,
    private usuarioService: UsuarioService,
    private loginService: LoginService,
    private storage: StorageService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    this.cargando = true;
    this.empresaService.ficha(id).subscribe({
      next: f => {
        this.ficha = f;
        this.indexarAdjuntos(f.adjuntos || []);
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  private indexarAdjuntos(lista: Adjunto[]): void {
    this.porRegistro = {};
    lista.forEach(a => {
      const clave = a.Entidad + ':' + a.RegistroID;
      if (!this.porRegistro[clave]) this.porRegistro[clave] = [];
      this.porRegistro[clave].push(a);
    });
  }

  enlacesDe(entidad: string, registroId?: string): Adjunto[] {
    return this.porRegistro[entidad + ':' + registroId] || [];
  }

  /* ---------------- Módulos internos ---------------- */

  /** Solo los módulos que tienen algo cargado para este cliente. */
  get modulosConDatos(): string[] {
    if (!this.ficha) return [];
    return this.ordenModulos.filter(e => (this.ficha!.modulos[e] || []).length > 0);
  }

  filasDe(entidad: string): any[] {
    return this.ficha?.modulos[entidad] ?? [];
  }

  /** Título y campos visibles salen de la misma config que dibuja cada módulo. */
  private configDe(entidad: string) {
    const clave = Object.keys(MODULOS).find(k => MODULOS[k].entidad === entidad);
    return clave ? MODULOS[clave] : null;
  }

  tituloDe(entidad: string): string { return this.configDe(entidad)?.titulo ?? entidad; }
  iconoDe(entidad: string): string { return this.configDe(entidad)?.icono ?? 'fa-folder'; }

  /** Las columnas de la tabla, sin la del cliente: acá ya sabemos cuál es. */
  columnasDe(entidad: string) {
    const config = this.configDe(entidad);
    if (!config) return [];
    return config.campos.filter(c => c.enTabla && c.tipo !== 'empresa');
  }

  candidatosDe(busquedaId?: string): any[] {
    return (this.ficha?.candidatos ?? []).filter(c => c.BusquedaID === busquedaId);
  }

  /* ---------------- Totales del encabezado ---------------- */

  get totalRegistros(): number {
    if (!this.ficha) return 0;
    return this.ordenModulos.reduce((n, e) => n + (this.ficha!.modulos[e] || []).length, 0);
  }

  get totalEnlaces(): number { return this.ficha?.adjuntos.length ?? 0; }

  /* ---------------- Accesos del cliente ---------------- */

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  get usuarios(): Usuario[] { return this.ficha?.usuarios ?? []; }

  tieneContrasena(u: Usuario): boolean { return !!(u as any).TieneContrasena; }

  abrirAltaAcceso(): void {
    this.mensajeAcceso = '';
    this.claveAcceso = '';
    // El rol y la empresa ya vienen resueltos: es la ficha de este cliente.
    this.altaAcceso = {
      Nombre: '', Usuario: '', Correo: '',
      Rol: 'Empresa', EmpresaID: this.ficha?.empresa.ID ?? ''
    };
  }

  cerrarAltaAcceso(): void { this.altaAcceso = null; this.mensajeAcceso = ''; }

  async guardarAcceso(): Promise<void> {
    if (!this.altaAcceso?.Nombre?.trim()) {
      this.mensajeAcceso = 'Poné el nombre de la persona.';
      return;
    }
    this.guardandoAcceso = true;

    const hash = this.claveAcceso ? await this.loginService.hashear(this.claveAcceso) : '';

    this.usuarioService.crear(this.altaAcceso).subscribe({
      next: creado => {
        if (!hash) { this.terminarAlta(); return; }
        this.loginService.definirContrasena(hash, creado.ID ?? '').subscribe({
          next: () => this.terminarAlta(),
          error: e => { this.guardandoAcceso = false; this.mensajeAcceso = e.message; }
        });
      },
      error: e => { this.guardandoAcceso = false; this.mensajeAcceso = e.message; }
    });
  }

  private terminarAlta(): void {
    this.guardandoAcceso = false;
    this.altaAcceso = null;
    this.claveAcceso = '';
    this.cargar();
  }

  darDeBajaAcceso(u: Usuario): void {
    if (!confirm(`¿Dar de baja el acceso de ${u.Nombre}? Deja de poder entrar, pero se conserva lo que haya hecho.`)) return;
    this.usuarioService.baja(u.ID ?? '').subscribe({
      next: () => this.cargar(),
      error: e => this.mensaje = e.message
    });
  }

  reactivarAcceso(u: Usuario): void {
    this.usuarioService.editar(u.ID ?? '', { Estado: 'Activo' }).subscribe({
      next: () => this.cargar(),
      error: e => this.mensaje = e.message
    });
  }

  editarAcceso(u: Usuario): void { this.router.navigate(['/usuario-form', u.ID]); }

  abrirBusqueda(id?: string): void { this.router.navigate(['/busqueda', id]); }
  editar(): void { this.router.navigate(['/empresa-form', this.ficha?.empresa.ID]); }
  volver(): void { this.router.navigate(['/empresas']); }
}
