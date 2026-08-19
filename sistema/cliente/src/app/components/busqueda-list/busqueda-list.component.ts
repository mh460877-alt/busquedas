import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BusquedaService } from '../../services/busqueda.service';
import { EmpresaService } from '../../services/empresa.service';
import { UsuarioService } from '../../services/usuario.service';
import { AsignacionService } from '../../services/asignacion.service';
import { StorageService } from '../../services/storage.service';
import { Busqueda } from '../../models/busqueda';
import { Empresa } from '../../models/empresa';
import { Usuario } from '../../models/usuario';
import { Asignacion } from '../../models/asignacion';
import { nuevosPrimero } from '../../models/orden';

/** Las búsquedas de un cliente, plegadas bajo su nombre. */
interface GrupoEmpresa {
  id: string;
  nombre: string;
  busquedas: Busqueda[];
  activas: number;
}

@Component({
  selector: 'app-busqueda-list',
  templateUrl: './busqueda-list.component.html',
  styleUrls: ['./busqueda-list.component.css']
})
export class BusquedaListComponent implements OnInit {

  busquedas: Busqueda[] = [];
  empresas: Empresa[] = [];
  consultores: Usuario[] = [];
  asignaciones: Asignacion[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  /** Búsqueda cuya asignación se está editando. */
  asignando: Busqueda | null = null;
  seleccionados: string[] = [];

  /** Clientes con su lista cerrada. Por omisión están todos abiertos. */
  plegados: { [empresaId: string]: boolean } = {};

  constructor(
    private api: ApiService,
    private busquedaService: BusquedaService,
    private empresaService: EmpresaService,
    private usuarioService: UsuarioService,
    private asignacionService: AsignacionService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  cargar(): void {
    this.cargando = true;
    // Las cuatro tablas en un solo pedido: antes eran cuatro viajes de ~2,5 s.
    this.api.varios(['Busquedas', 'Empresas', 'Usuarios', 'Asignaciones']).subscribe({
      next: r => {
        this.busquedas = r['Busquedas'] || [];
        this.empresas = r['Empresas'] || [];
        this.consultores = (r['Usuarios'] || [])
          .filter((u: Usuario) => u.Rol === 'Consultor' && u.Estado !== 'Baja');
        this.asignaciones = r['Asignaciones'] || [];
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get visibles(): Busqueda[] {
    const t = this.filtro.toLowerCase().trim();
    const filtradas = !t ? this.busquedas : this.busquedas.filter(b =>
      [b.Puesto, b.Provincia, b.Etapa, b.Estado, this.empresa(b.EmpresaID)]
        .join(' ').toLowerCase().includes(t));
    return nuevosPrimero(filtradas);
  }

  /**
   * Las búsquedas agrupadas bajo el nombre de su cliente.
   *
   * Los clientes van ordenados por lo último que se cargó para cada uno, y las
   * búsquedas de adentro también: lo más reciente arriba. Las que todavía no
   * tienen empresa asignada caen juntas al final, para que se vean y se puedan
   * corregir en lugar de quedar perdidas entre las demás.
   */
  get grupos(): GrupoEmpresa[] {
    const porEmpresa = new Map<string, Busqueda[]>();
    this.visibles.forEach(b => {
      const clave = b.EmpresaID || '';
      if (!porEmpresa.has(clave)) porEmpresa.set(clave, []);
      porEmpresa.get(clave)!.push(b);
    });

    const grupos: GrupoEmpresa[] = [];
    porEmpresa.forEach((busquedas, id) => grupos.push({
      id,
      nombre: id ? this.empresa(id) : 'Sin empresa asignada',
      busquedas,
      activas: busquedas.filter(b => b.Estado === 'Activa').length
    }));

    // `visibles` ya viene de lo más nuevo a lo más viejo, así que el orden en
    // que aparecieron los clientes es el que corresponde. Los huérfanos, últimos.
    return grupos.sort((a, b) => (a.id ? 0 : 1) - (b.id ? 0 : 1));
  }

  /**
   * Sin esto, como `grupos` arma objetos nuevos en cada ciclo de detección,
   * Angular los tomaría por distintos y volvería a dibujar todas las tablas una
   * y otra vez. Con el id alcanza para que reconozca que son los mismos.
   */
  trackGrupo(_: number, g: GrupoEmpresa): string { return g.id; }

  abierto(id: string): boolean {
    // Sin nada elegido, se abren todos: con pocos clientes esconder todo estorba.
    return this.plegados[id] !== true;
  }

  alternarGrupo(id: string): void {
    this.plegados[id] = !this.plegados[id];
  }

  plegarTodos(): void {
    this.grupos.forEach(g => this.plegados[g.id] = true);
  }

  desplegarTodos(): void {
    this.plegados = {};
  }

  empresa(id?: string): string {
    return this.empresas.find(e => e.ID === id)?.Nombre ?? '—';
  }

  verFicha(id: string): void { this.router.navigate(['/empresa', id]); }

  nombresAsignados(busqueda: Busqueda): string {
    const ids = this.asignacionService.consultoresDe(this.asignaciones, busqueda.ID ?? '');
    const nombres = ids
      .map(id => this.consultores.find(c => c.ID === id)?.Nombre)
      .filter((n): n is string => !!n);
    return nombres.length ? nombres.join(', ') : 'Sin asignar';
  }

  abrirAsignacion(busqueda: Busqueda): void {
    this.asignando = busqueda;
    this.seleccionados = this.asignacionService.consultoresDe(this.asignaciones, busqueda.ID ?? '');
  }

  alternar(consultorId: string): void {
    const i = this.seleccionados.indexOf(consultorId);
    if (i >= 0) { this.seleccionados.splice(i, 1); } else { this.seleccionados.push(consultorId); }
  }

  guardarAsignacion(): void {
    if (!this.asignando?.ID) return;
    this.asignacionService.asignar(this.asignando.ID, this.seleccionados).subscribe({
      next: () => { this.asignando = null; this.mensaje = 'Asignación guardada'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  cambiarEstado(b: Busqueda): void {
    const estado = b.Estado === 'Activa' ? 'Deshabilitada' : 'Activa';
    this.busquedaService.editar(b.ID ?? '', { Estado: estado }).subscribe({
      next: () => { b.Estado = estado; this.mensaje = 'Estado actualizado'; },
      error: e => this.mensaje = e.message
    });
  }

  /**
   * Dar de baja no borra: cierra la búsqueda y conserva el trabajo hecho.
   * Eliminar de verdad solo se ofrece si nada quedó colgando de ella.
   */
  darDeBaja(b: Busqueda): void {
    if (!confirm(`¿Cerrar la búsqueda "${b.Puesto}"? Los candidatos presentados se conservan.`)) return;
    this.busquedaService.baja(b.ID ?? '').subscribe({
      next: () => { this.mensaje = 'Búsqueda cerrada'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  eliminar(b: Busqueda): void {
    this.busquedaService.eliminar(b.ID ?? '').subscribe({
      next: r => {
        if (r?.requiereConfirmacion) {
          if (confirm(r.mensaje + '\n\n¿Eliminar igual?')) {
            this.busquedaService.eliminar(b.ID ?? '', true).subscribe({
              next: () => { this.mensaje = 'Búsqueda eliminada'; this.cargar(); },
              error: e => this.mensaje = e.message
            });
          }
          return;
        }
        this.mensaje = 'Búsqueda eliminada';
        this.cargar();
      },
      error: e => this.mensaje = e.message
    });
  }

  abrir(b: Busqueda): void { this.router.navigate(['/busqueda', b.ID]); }
  nueva(): void { this.router.navigate(['/busqueda-form', 'nueva']); }
  editar(b: Busqueda): void { this.router.navigate(['/busqueda-form', b.ID]); }
}
