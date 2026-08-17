import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ObservacionService } from '../../services/observacion.service';
import { StorageService } from '../../services/storage.service';
import { Observacion } from '../../models/observacion';

/**
 * Comentarios y avances sobre un candidato.
 *
 * Cada observación se guarda como Interna o Compartida, y de eso depende quién
 * la lee: una Interna la ve solo el equipo; una Compartida la ven además la
 * empresa y el consultor que presentó al candidato. La marca no es un detalle
 * estético —es la diferencia entre una nota nuestra y un mensaje al partner—,
 * así que el formulario lo dice con todas las letras.
 */
@Component({
  selector: 'app-observaciones',
  templateUrl: './observaciones.component.html',
  styleUrls: ['./observaciones.component.css']
})
export class ObservacionesComponent implements OnChanges {

  @Input() candidatoId = '';
  /** Las de este candidato, si quien nos usa ya las tiene traídas. */
  @Input() precargadas: Observacion[] | null = null;

  @Output() cambio = new EventEmitter<void>();

  observaciones: Observacion[] = [];
  cargando = false;
  mensaje = '';

  texto = '';
  compartir = false;
  guardando = false;

  constructor(
    private observacionService: ObservacionService,
    private storage: StorageService
  ) { }

  ngOnChanges(): void {
    if (this.precargadas) { this.observaciones = this.precargadas; return; }
    this.cargar();
  }

  cargar(): void {
    if (!this.candidatoId) return;
    this.cargando = true;
    this.observacionService.listar().subscribe({
      next: lista => {
        this.observaciones = lista.filter(o => String(o.CandidatoID) === String(this.candidatoId));
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get puedeCompartir(): boolean {
    const rol = this.storage.rol;
    return rol === 'Admin' || rol === 'Interno';
  }

  guardar(): void {
    if (!this.texto.trim()) { this.mensaje = 'Escribí algo antes de guardar.'; return; }
    this.guardando = true;

    this.observacionService.crear({
      CandidatoID: this.candidatoId,
      Texto: this.texto.trim(),
      Visibilidad: this.compartir ? 'Compartida' : 'Interna'
    }).subscribe({
      next: creada => {
        this.observaciones.push(creada);
        this.texto = '';
        this.compartir = false;
        this.guardando = false;
        this.mensaje = '';
        this.cambio.emit();
      },
      error: e => { this.guardando = false; this.mensaje = e.message; }
    });
  }
}
