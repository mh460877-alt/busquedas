import { Component, OnInit } from '@angular/core';
import { PortalService } from '../../services/portal.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { Portal, Solicitud, Mensaje } from '../../models/solicitud';
import { Adjunto } from '../../models/adjunto';
import { nuevosPrimero } from '../../models/orden';

/**
 * Los pedidos del cliente.
 *
 * Acá es donde el portal deja de ser una vitrina: el cliente abre un pedido y
 * queda registrado con fecha, tipo y responsable, en lugar de perderse en un
 * WhatsApp. Sobre cada pedido hay una conversación, así la respuesta también
 * queda donde está el pedido.
 */
@Component({
  selector: 'app-portal-solicitudes',
  templateUrl: './portal-solicitudes.component.html',
  styleUrls: ['./portal-solicitudes.component.css']
})
export class PortalSolicitudesComponent implements OnInit {

  p: Portal | null = null;
  cargando = true;
  mensaje = '';
  filtro = '';
  verCerradas = false;

  tipos: string[] = [];
  categorias: string[] = [];
  prioridades: string[] = [];

  /* Alta de un pedido */
  nueva: Solicitud | null = null;
  guardando = false;

  /* Pedido abierto y su conversación */
  abierta: Solicitud | null = null;
  conversacion: Mensaje[] = [];
  textoMensaje = '';
  enviando = false;

  constructor(
    private portal: PortalService,
    private loginService: LoginService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {
    this.cargar();
    this.loginService.catalogos().subscribe({
      next: c => {
        this.tipos = c.tiposSolicitud || [];
        this.categorias = c.categoriasSolicitud || [];
        this.prioridades = c.prioridades || [];
      },
      error: () => { }
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.portal.cargar(true).subscribe({
      next: p => { this.p = p; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get visibles(): Solicitud[] {
    const t = this.filtro.toLowerCase().trim();
    const todas = (this.p?.solicitudes ?? []).filter(s => {
      if (!this.verCerradas && s.Estado === 'Finalizada') return false;
      if (!t) return true;
      return [s.Titulo, s.Tipo, s.Estado, s.Descripcion].join(' ').toLowerCase().includes(t);
    });
    return nuevosPrimero(todas);
  }

  get cerradas(): number {
    return (this.p?.solicitudes ?? []).filter(s => s.Estado === 'Finalizada').length;
  }

  claseEstado(s: Solicitud): string {
    if (s.Estado === 'Finalizada') return 'badge-activa';
    if (s.Estado === 'Pendiente cliente') return 'badge-ambar';
    return 'badge-azul';
  }

  /* ---------------- Alta ---------------- */

  abrirNueva(): void {
    this.mensaje = '';
    this.nueva = {
      Tipo: '', Titulo: '', Descripcion: '',
      Categoria: '', Prioridad: 'Normal',
      ResponsableCliente: this.storage.nombre, FechaEstimada: ''
    };
  }

  cerrarNueva(): void { this.nueva = null; this.mensaje = ''; }

  guardar(): void {
    if (!this.nueva?.Titulo?.trim()) { this.mensaje = 'Poné un título al pedido.'; return; }
    if (!this.nueva?.Tipo) { this.mensaje = 'Elegí de qué tipo es el pedido.'; return; }
    this.guardando = true;
    this.portal.crearSolicitud(this.nueva).subscribe({
      next: () => { this.guardando = false; this.nueva = null; this.cargar(); },
      error: e => { this.guardando = false; this.mensaje = e.message; }
    });
  }

  /* ---------------- Conversación ---------------- */

  abrir(s: Solicitud): void {
    this.abierta = s;
    this.textoMensaje = '';
    this.conversacion = (this.p?.mensajes ?? [])
      .filter(m => m.Entidad === 'Solicitudes' && String(m.RegistroID) === String(s.ID));
  }

  cerrar(): void { this.abierta = null; }

  enlacesDe(s: Solicitud): Adjunto[] {
    return (this.p?.adjuntos ?? [])
      .filter(a => a.Entidad === 'Solicitudes' && String(a.RegistroID) === String(s.ID));
  }

  mensajesDe(s: Solicitud): number {
    return (this.p?.mensajes ?? [])
      .filter(m => m.Entidad === 'Solicitudes' && String(m.RegistroID) === String(s.ID)).length;
  }

  enviar(): void {
    if (!this.abierta?.ID || !this.textoMensaje.trim()) return;
    this.enviando = true;
    this.portal.enviarMensaje('Solicitudes', this.abierta.ID, this.textoMensaje.trim()).subscribe({
      next: m => {
        this.conversacion.push(m);
        this.textoMensaje = '';
        this.enviando = false;
      },
      error: e => { this.enviando = false; this.mensaje = e.message; }
    });
  }

  esMio(m: Mensaje): boolean { return m.RolAutor === 'Empresa'; }
}
