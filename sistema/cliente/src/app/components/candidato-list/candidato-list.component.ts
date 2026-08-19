import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CandidatoService } from '../../services/candidato.service';
import { BusquedaService } from '../../services/busqueda.service';
import { UsuarioService } from '../../services/usuario.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { Candidato } from '../../models/candidato';
import { Busqueda } from '../../models/busqueda';
import { Usuario } from '../../models/usuario';
import { nuevosPrimero } from '../../models/orden';
import { ObservacionService } from '../../services/observacion.service';
import { Observacion } from '../../models/observacion';

/** Los candidatos que presentó una misma persona, plegados bajo su nombre. */
interface GrupoConsultor {
  id: string;
  nombre: string;
  candidatos: Candidato[];
  enTerna: number;
}

/** Registro global de candidatos. Lo ven Administración e Interno. */
@Component({
  selector: 'app-candidato-list',
  templateUrl: './candidato-list.component.html',
  styleUrls: ['./candidato-list.component.css']
})
export class CandidatoListComponent implements OnInit {

  candidatos: Candidato[] = [];
  busquedas: Busqueda[] = [];
  usuarios: Usuario[] = [];
  etapas: string[] = [];
  etapasVisiblesEmpresa: string[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  /** Partners con su lista cerrada. Por omisión están todos abiertos. */
  plegados: { [consultorId: string]: boolean } = {};

  /** Comentarios por candidato, y el candidato que se está mirando. */
  observaciones: Observacion[] = [];
  comentando: Candidato | null = null;

  constructor(
    private api: ApiService,
    private candidatoService: CandidatoService,
    private busquedaService: BusquedaService,
    private usuarioService: UsuarioService,
    private loginService: LoginService,
    private observacionService: ObservacionService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  cargar(): void {
    this.cargando = true;
    this.api.varios(['Candidatos', 'Busquedas', 'Usuarios', 'Observaciones']).subscribe({
      next: r => {
        this.candidatos = r['Candidatos'] || [];
        this.busquedas = r['Busquedas'] || [];
        this.usuarios = r['Usuarios'] || [];
        this.observaciones = r['Observaciones'] || [];
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.loginService.catalogos().subscribe({
      next: c => {
        this.etapas = c.etapasCandidato;
        this.etapasVisiblesEmpresa = c.etapasVisiblesEmpresa;
      },
      error: () => { }
    });
  }

  /** Todos los comentarios de una vez, no una llamada por candidato. */
  cargarObservaciones(): void {
    this.observacionService.listar().subscribe({
      next: o => this.observaciones = o,
      error: () => { }
    });
  }

  // (las observaciones llegan con el resto en cargar(); esto solo refresca
  //  después de escribir un comentario)

  observacionesDe(c: Candidato): Observacion[] {
    return this.observaciones.filter(o => String(o.CandidatoID) === String(c.ID));
  }

  abrirObservaciones(c: Candidato): void { this.comentando = c; }
  cerrarObservaciones(): void { this.comentando = null; this.cargarObservaciones(); }

  /**
   * Los candidatos agrupados por quién los presentó.
   *
   * Cada partner ve su propio registro cuando entra; esto es la contracara
   * adentro: de un vistazo, qué presentó cada uno y en qué está.
   */
  get grupos(): GrupoConsultor[] {
    const porConsultor = new Map<string, Candidato[]>();
    this.visibles.forEach(c => {
      const clave = c.ConsultorID || '';
      if (!porConsultor.has(clave)) porConsultor.set(clave, []);
      porConsultor.get(clave)!.push(c);
    });

    const grupos: GrupoConsultor[] = [];
    porConsultor.forEach((candidatos, id) => grupos.push({
      id,
      nombre: id ? this.consultor(id) : 'Sin consultor asignado',
      candidatos,
      enTerna: candidatos.filter(c => this.visibleParaEmpresa(c)).length
    }));

    // Los sin consultor, al final: se ven y se corrigen en vez de perderse.
    return grupos.sort((a, b) => (a.id ? 0 : 1) - (b.id ? 0 : 1));
  }

  trackGrupo(_: number, g: GrupoConsultor): string { return g.id; }

  abierto(id: string): boolean { return this.plegados[id] !== true; }
  alternarGrupo(id: string): void { this.plegados[id] = !this.plegados[id]; }
  plegarTodos(): void { this.grupos.forEach(g => this.plegados[g.id] = true); }
  desplegarTodos(): void { this.plegados = {}; }

  get visibles(): Candidato[] {
    const t = this.filtro.toLowerCase().trim();
    const filtrados = !t ? this.candidatos : this.candidatos.filter(c =>
      [c.DNI, c.Nombre, c.Etapa, this.puesto(c.BusquedaID), this.consultor(c.ConsultorID)]
        .join(' ').toLowerCase().includes(t));
    return nuevosPrimero(filtrados);
  }

  puesto(id?: string): string { return this.busquedas.find(b => b.ID === id)?.Puesto ?? '—'; }
  consultor(id?: string): string { return this.usuarios.find(u => u.ID === id)?.Nombre ?? '—'; }

  /** Deja ver de un vistazo a quién alcanza ya la empresa. */
  visibleParaEmpresa(c: Candidato): boolean {
    return this.etapasVisiblesEmpresa.includes(c.Etapa ?? '');
  }

  cambiarEtapa(c: Candidato, etapa: string): void {
    this.candidatoService.editar(c.ID ?? '', { Etapa: etapa }).subscribe({
      next: () => { c.Etapa = etapa; this.mensaje = 'Etapa actualizada'; },
      error: e => this.mensaje = e.message
    });
  }

  eliminar(c: Candidato): void {
    if (!confirm(`¿Eliminar a ${c.Nombre}? Se borran también sus observaciones.`)) return;
    this.candidatoService.eliminar(c.ID ?? '', true).subscribe({
      next: () => { this.mensaje = 'Candidato eliminado'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  abrir(c: Candidato): void { this.router.navigate(['/busqueda', c.BusquedaID]); }
}
