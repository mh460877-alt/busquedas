import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BusquedaService } from '../../services/busqueda.service';
import { CandidatoService } from '../../services/candidato.service';
import { UsuarioService } from '../../services/usuario.service';
import { ObservacionService } from '../../services/observacion.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { AdjuntoService } from '../../services/adjunto.service';
import { Busqueda } from '../../models/busqueda';
import { Candidato } from '../../models/candidato';
import { Usuario } from '../../models/usuario';
import { Observacion } from '../../models/observacion';
import { Adjunto } from '../../models/adjunto';

/**
 * Carpeta de una búsqueda: el descriptivo y los candidatos presentados.
 * La abren Admin, Interno y Consultor; cada uno ve lo que le corresponde,
 * porque el recorte lo hace el servidor.
 */
@Component({
  selector: 'app-busqueda-detalle',
  templateUrl: './busqueda-detalle.component.html',
  styleUrls: ['./busqueda-detalle.component.css']
})
export class BusquedaDetalleComponent implements OnInit {

  busqueda: Busqueda | null = null;
  candidatos: Candidato[] = [];
  consultores: Usuario[] = [];
  observaciones: Observacion[] = [];
  etapasCandidato: string[] = [];
  cargando = true;
  mensaje = '';

  /** Candidato al que se le está dejando una observación. */
  comentando: Candidato | null = null;
  textoObservacion = '';
  compartirConEmpresa = false;

  /** Enlaces de cada candidato, y el candidato cuyos enlaces se están mirando. */
  enlacesPorCandidato: { [registroId: string]: Adjunto[] } = {};
  enlazando: Candidato | null = null;

  constructor(
    private api: ApiService,
    private busquedaService: BusquedaService,
    private candidatoService: CandidatoService,
    private usuarioService: UsuarioService,
    private observacionService: ObservacionService,
    private loginService: LoginService,
    private storage: StorageService,
    private adjuntos: AdjuntoService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';

    // Todo lo de la carpeta en un solo pedido. Eran seis, de ~2,5 s cada uno.
    this.api.varios(['Busquedas', 'Candidatos', 'Observaciones', 'Usuarios']).subscribe({
      next: r => {
        this.busqueda = (r['Busquedas'] || []).find((b: Busqueda) => b.ID === id) ?? null;
        this.candidatos = (r['Candidatos'] || []).filter((c: Candidato) => c.BusquedaID === id);
        this.observaciones = r['Observaciones'] || [];
        this.consultores = r['Usuarios'] || [];
        this.cargando = false;
        if (!this.busqueda) this.mensaje = 'Esa búsqueda no está a tu alcance.';
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });

    this.loginService.catalogos().subscribe({
      next: c => this.etapasCandidato = c.etapasCandidato, error: () => { }
    });

    this.cargarEnlaces();
  }

  /** Los enlaces de todos los candidatos a la vez, no uno por fila. */
  cargarEnlaces(): void {
    this.adjuntos.listar('Candidatos').subscribe({
      next: lista => this.enlacesPorCandidato = this.adjuntos.agrupar(lista),
      error: () => { }
    });
  }

  enlacesDe(c: Candidato): Adjunto[] {
    return this.enlacesPorCandidato[String(c.ID)] || [];
  }

  abrirEnlaces(c: Candidato): void { this.enlazando = c; }
  cerrarEnlaces(): void { this.enlazando = null; this.cargarEnlaces(); }

  get rol(): string { return this.storage.rol; }
  get puedeEditar(): boolean { return this.rol === 'Admin' || this.rol === 'Interno'; }

  consultor(id?: string): string {
    return this.consultores.find(u => u.ID === id)?.Nombre ?? '—';
  }

  observacionesDe(candidato: Candidato): Observacion[] {
    return this.observaciones.filter(o => o.CandidatoID === candidato.ID);
  }

  cambiarEtapa(c: Candidato, etapa: string): void {
    this.candidatoService.editar(c.ID ?? '', { Etapa: etapa }).subscribe({
      next: () => {
        c.Etapa = etapa;
        this.mensaje = etapa === 'Terna'
          ? 'Etapa actualizada. A partir de terna, la empresa ya puede ver a este candidato.'
          : 'Etapa actualizada.';
      },
      error: e => this.mensaje = e.message
    });
  }

  abrirObservacion(c: Candidato): void {
    this.comentando = c;
    this.textoObservacion = '';
    this.compartirConEmpresa = false;
  }

  guardarObservacion(): void {
    if (!this.comentando?.ID || !this.textoObservacion.trim()) return;
    this.observacionService.crear({
      CandidatoID: this.comentando.ID,
      Texto: this.textoObservacion.trim(),
      Visibilidad: this.compartirConEmpresa ? 'Compartida' : 'Interna'
    }).subscribe({
      next: o => {
        this.observaciones.push(o);
        this.comentando = null;
        this.mensaje = 'Observación guardada';
      },
      error: e => this.mensaje = e.message
    });
  }

  presentar(): void { this.router.navigate(['/presentar', this.busqueda?.ID]); }
  volver(): void {
    this.router.navigate([this.rol === 'Consultor' ? '/mis-busquedas' : '/busquedas']);
  }
}
