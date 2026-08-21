import { Component, OnInit } from '@angular/core';
import { BusquedaService } from '../../services/busqueda.service';
import { CandidatoService } from '../../services/candidato.service';
import { ObservacionService } from '../../services/observacion.service';
import { StorageService } from '../../services/storage.service';
import { AdjuntoService } from '../../services/adjunto.service';
import { Busqueda } from '../../models/busqueda';
import { Candidato } from '../../models/candidato';
import { Observacion } from '../../models/observacion';
import { Adjunto } from '../../models/adjunto';

/**
 * Panel E · lo que ve una empresa cliente.
 *
 * Tres definiciones acordadas, que aplica el servidor:
 *   · los candidatos aparecen recién a partir de terna
 *   · no se muestra qué consultor los presentó
 *   · no se envía el documento
 *
 * Lo que sí tiene es un espacio propio para dejar devoluciones, que vuelven
 * al panel interno sin que nadie tenga que reenviar nada.
 */
@Component({
  selector: 'app-mi-proceso',
  templateUrl: './mi-proceso.component.html',
  styleUrls: ['./mi-proceso.component.css']
})
export class MiProcesoComponent implements OnInit {

  busquedas: Busqueda[] = [];
  candidatos: Candidato[] = [];
  observaciones: Observacion[] = [];
  cargando = true;
  mensaje = '';

  comentando: Candidato | null = null;
  texto = '';

  /** Candidato sobre el que se está tomando una decisión. */
  decidiendo: Candidato | null = null;
  decision = '';
  motivo = '';
  guardandoDecision = false;

  /** Todo lo que el equipo adjuntó a cada candidato: informe, CV, referencias. */
  enlacesPorCandidato: { [candidatoId: string]: Adjunto[] } = {};

  constructor(
    private busquedaService: BusquedaService,
    private candidatoService: CandidatoService,
    private observacionService: ObservacionService,
    private adjuntos: AdjuntoService,
    private storage: StorageService
  ) { }

  ngOnInit(): void { this.cargar(); }

  get nombre(): string { return this.storage.nombre; }

  cargar(): void {
    this.cargando = true;
    this.busquedaService.listar().subscribe({
      next: b => { this.busquedas = b; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.candidatoService.listar().subscribe({ next: c => this.candidatos = c, error: () => { } });
    this.observacionService.listar().subscribe({ next: o => this.observaciones = o, error: () => { } });
    /**
     * Los enlaces de los candidatos que esta empresa puede ver. El servidor ya
     * recorta: solo llegan los de sus candidatos, y solo desde terna.
     */
    this.adjuntos.listar('Candidatos').subscribe({
      next: lista => this.enlacesPorCandidato = this.adjuntos.agrupar(lista),
      error: () => { }
    });
  }

  enlacesDe(c: Candidato): Adjunto[] {
    return this.enlacesPorCandidato[String(c.ID)] || [];
  }

  candidatosDe(b: Busqueda): Candidato[] {
    return this.candidatos.filter(c => c.BusquedaID === b.ID);
  }

  observacionesDe(c: Candidato): Observacion[] {
    return this.observaciones.filter(o => o.CandidatoID === c.ID);
  }

  abrirObservacion(c: Candidato): void { this.comentando = c; this.texto = ''; }

  /* ---------------- Qué le pareció el candidato ---------------- */

  abrirDecision(c: Candidato, decision: string): void {
    this.decidiendo = c;
    this.decision = decision;
    this.motivo = '';
    this.mensaje = '';
  }

  cerrarDecision(): void { this.decidiendo = null; }

  confirmarDecision(): void {
    if (!this.decidiendo?.ID) return;
    // Descartar sin decir por qué deja al equipo sin saber qué corregir.
    if (this.decision === 'Descartado' && !this.motivo.trim()) {
      this.mensaje = 'Contanos brevemente por qué lo descartás: nos sirve para la próxima terna.';
      return;
    }
    this.guardandoDecision = true;
    const c = this.decidiendo;
    this.candidatoService.decidir(c.ID!, this.decision, this.motivo.trim()).subscribe({
      next: () => {
        c.DecisionEmpresa = this.decision;
        c.MotivoDecision = this.motivo.trim();
        this.guardandoDecision = false;
        this.decidiendo = null;
        this.mensaje = 'Listo. El equipo de Escencial ya lo ve.';
        this.cargar();
      },
      error: e => { this.guardandoDecision = false; this.mensaje = e.message; }
    });
  }

  claseDecision(c: Candidato): string {
    if (c.DecisionEmpresa === 'Descartado') return 'badge-rojo';
    if (c.DecisionEmpresa === 'Quiere entrevistarlo') return 'badge-activa';
    if (c.DecisionEmpresa === 'En evaluacion') return 'badge-ambar';
    return 'badge-gris';
  }

  descartado(c: Candidato): boolean { return c.DecisionEmpresa === 'Descartado'; }

  guardar(): void {
    if (!this.comentando?.ID || !this.texto.trim()) return;
    this.observacionService.crear({
      CandidatoID: this.comentando.ID,
      Texto: this.texto.trim()
    }).subscribe({
      next: o => {
        this.observaciones.push(o);
        this.comentando = null;
        this.mensaje = 'Gracias. Tu devolución ya le llegó al equipo.';
      },
      error: e => this.mensaje = e.message
    });
  }
}
