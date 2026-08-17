import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AdjuntoService } from '../../services/adjunto.service';
import { StorageService } from '../../services/storage.service';
import { Adjunto } from '../../models/adjunto';

/**
 * Los enlaces de un registro, con su nombre.
 *
 * Es un solo componente para todo el sistema: se le dice de qué tabla y de qué
 * registro, y él se encarga. Se usa igual en un pendiente, en una búsqueda, en
 * la ficha de un candidato o en la de un cliente.
 *
 *   <app-enlaces entidad="Pendientes" [registroId]="fila.ID"></app-enlaces>
 *
 * Si quien lo usa ya tiene los enlaces en la mano —la ficha de empresa los trae
 * todos de una— se los pasa por [precargados] y no se hace ninguna llamada más.
 */
@Component({
  selector: 'app-enlaces',
  templateUrl: './enlaces.component.html',
  styleUrls: ['./enlaces.component.css']
})
export class EnlacesComponent implements OnChanges {

  @Input() entidad = '';
  @Input() registroId = '';
  /** Enlaces ya traídos por quien nos usa; si vienen, no se pide nada. */
  @Input() precargados: Adjunto[] | null = null;
  /** Para mostrarlos sin permitir tocarlos (por ejemplo, un panel de solo lectura). */
  @Input() soloLectura = false;

  /** Avisa cuando la lista cambió, para que el de arriba actualice su contador. */
  @Output() cambio = new EventEmitter<void>();

  enlaces: Adjunto[] = [];
  cargando = false;
  mensaje = '';

  agregando = false;
  nuevo: Adjunto = { Entidad: '', RegistroID: '', Titulo: '', URL: '', Nota: '' };
  guardando = false;

  constructor(private adjuntos: AdjuntoService, private storage: StorageService) { }

  ngOnChanges(): void {
    if (this.precargados) {
      this.enlaces = this.precargados;
      return;
    }
    this.cargar();
  }

  cargar(): void {
    if (!this.entidad || !this.registroId) return;
    this.cargando = true;
    this.adjuntos.listar(this.entidad, this.registroId).subscribe({
      next: lista => { this.enlaces = lista; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  abrirNuevo(): void {
    this.agregando = true;
    this.mensaje = '';
    this.nuevo = { Entidad: this.entidad, RegistroID: this.registroId, Titulo: '', URL: '', Nota: '' };
  }

  cancelar(): void { this.agregando = false; this.mensaje = ''; }

  guardar(): void {
    const url = (this.nuevo.URL || '').trim();
    if (!url) { this.mensaje = 'Pegá la dirección del enlace.'; return; }
    if (!/^https?:\/\//i.test(url)) {
      this.mensaje = 'El enlace tiene que empezar con http:// o https://';
      return;
    }

    this.guardando = true;
    this.adjuntos.crear({ ...this.nuevo, URL: url }).subscribe({
      next: creado => {
        this.enlaces.push(creado);
        this.guardando = false;
        this.agregando = false;
        this.mensaje = '';
        this.cambio.emit();
      },
      error: e => { this.guardando = false; this.mensaje = e.message; }
    });
  }

  /**
   * Solo el día, sin la hora.
   * La columna se llama "Fecha", y a las columnas con ese nombre el servidor
   * les devuelve también la hora; acá no aporta nada y ensucia la línea.
   */
  soloDia(fecha?: string): string { return (fecha || '').slice(0, 10); }

  /** Solo quien lo cargó, y Dirección o el equipo interno. */
  puedeQuitar(a: Adjunto): boolean {
    if (this.soloLectura) return false;
    const rol = this.storage.rol;
    return rol === 'Admin' || rol === 'Interno' || String(a.AutorID) === String(this.miId);
  }

  quitar(a: Adjunto): void {
    if (!a.ID) return;
    if (!confirm(`¿Quitar el enlace "${a.Titulo || a.URL}"?`)) return;
    this.adjuntos.quitar(a.ID).subscribe({
      next: () => {
        this.enlaces = this.enlaces.filter(x => x.ID !== a.ID);
        this.cambio.emit();
      },
      error: e => this.mensaje = e.message
    });
  }

  private get miId(): string { return this.storage.leer()?.usuario.id ?? ''; }
}
