import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CandidatoService } from '../../services/candidato.service';
import { BusquedaService } from '../../services/busqueda.service';
import { UsuarioService } from '../../services/usuario.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { Candidato } from '../../models/candidato';
import { Busqueda } from '../../models/busqueda';
import { Usuario } from '../../models/usuario';
import { nuevosPrimero } from '../../models/orden';

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

  constructor(
    private candidatoService: CandidatoService,
    private busquedaService: BusquedaService,
    private usuarioService: UsuarioService,
    private loginService: LoginService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  cargar(): void {
    this.cargando = true;
    this.candidatoService.listar().subscribe({
      next: c => { this.candidatos = c; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.busquedaService.listar().subscribe({ next: b => this.busquedas = b, error: () => { } });
    this.usuarioService.listar().subscribe({ next: u => this.usuarios = u, error: () => { } });
    this.loginService.catalogos().subscribe({
      next: c => {
        this.etapas = c.etapasCandidato;
        this.etapasVisiblesEmpresa = c.etapasVisiblesEmpresa;
      },
      error: () => { }
    });
  }

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
