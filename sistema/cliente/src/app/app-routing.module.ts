import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { UsuarioListComponent } from './components/usuario-list/usuario-list.component';
import { UsuarioFormComponent } from './components/usuario-form/usuario-form.component';
import { EmpresaListComponent } from './components/empresa-list/empresa-list.component';
import { EmpresaFormComponent } from './components/empresa-form/empresa-form.component';
import { EmpresaFichaComponent } from './components/empresa-ficha/empresa-ficha.component';
import { BusquedaListComponent } from './components/busqueda-list/busqueda-list.component';
import { BusquedaFormComponent } from './components/busqueda-form/busqueda-form.component';
import { BusquedaDetalleComponent } from './components/busqueda-detalle/busqueda-detalle.component';
import { CandidatoListComponent } from './components/candidato-list/candidato-list.component';
import { CandidatoFormComponent } from './components/candidato-form/candidato-form.component';
import { MisBusquedasComponent } from './components/mis-busquedas/mis-busquedas.component';
import { MiProcesoComponent } from './components/mi-proceso/mi-proceso.component';
import { AuditoriaComponent } from './components/auditoria/auditoria.component';
import { ModuloInternoComponent } from './components/modulo-interno/modulo-interno.component';
import { CalendarioComponent } from './components/calendario/calendario.component';
import { InformesComponent } from './components/informes/informes.component';
import { MiCuentaComponent } from './components/mi-cuenta/mi-cuenta.component';
import { VigilanteGuard } from './vigilante.guard';

/**
 * Cada ruta declara qué rol la puede abrir, igual que en el proyecto de
 * referencia. Los cuatro paneles no son cuatro aplicaciones: son la misma,
 * con distintas rutas habilitadas según quién entra.
 *
 *   Admin      → todo
 *   Interno    → todo menos usuarios y auditoría
 *   Consultor  → sus búsquedas y la carga de candidatos
 *   Empresa    → su proceso
 */
const routes: Routes = [

  { path: 'login', component: LoginComponent },

  /* ---------- Administración ---------- */
  {
    path: 'usuarios', component: UsuarioListComponent,
    data: { rol: ['Admin'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'usuario-form/:id', component: UsuarioFormComponent,
    data: { rol: ['Admin'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'auditoria', component: AuditoriaComponent,
    data: { rol: ['Admin'] }, canActivate: [VigilanteGuard]
  },

  /* ---------- Administración e Interno ---------- */
  {
    path: 'empresas', component: EmpresaListComponent,
    data: { rol: ['Admin', 'Interno'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'empresa-form/:id', component: EmpresaFormComponent,
    data: { rol: ['Admin', 'Interno'] }, canActivate: [VigilanteGuard]
  },
  /* Ficha del cliente: todo lo suyo junto, en una sola pantalla. */
  {
    path: 'empresa/:id', component: EmpresaFichaComponent,
    data: { rol: ['Admin', 'Interno'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'busquedas', component: BusquedaListComponent,
    data: { rol: ['Admin', 'Interno'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'busqueda-form/:id', component: BusquedaFormComponent,
    data: { rol: ['Admin', 'Interno'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'candidatos', component: CandidatoListComponent,
    data: { rol: ['Admin', 'Interno'] }, canActivate: [VigilanteGuard]
  },

  /* ---------- Carpeta de una búsqueda: la abren los tres primeros ---------- */
  {
    path: 'busqueda/:id', component: BusquedaDetalleComponent,
    data: { rol: ['Admin', 'Interno', 'Consultor'] }, canActivate: [VigilanteGuard]
  },

  /* ---------- Panel C · consultores ---------- */
  {
    path: 'mis-busquedas', component: MisBusquedasComponent,
    data: { rol: ['Consultor'] }, canActivate: [VigilanteGuard]
  },
  {
    path: 'presentar/:busquedaId', component: CandidatoFormComponent,
    data: { rol: ['Admin', 'Interno', 'Consultor'] }, canActivate: [VigilanteGuard]
  },

  /* ---------- Panel E · empresas ---------- */
  {
    path: 'mi-proceso', component: MiProcesoComponent,
    data: { rol: ['Empresa'] }, canActivate: [VigilanteGuard]
  },

  /* ---------- Mundo interno · Administración e Interno ---------- */
  { path: 'calendario',     component: CalendarioComponent,    data: { rol: ['Admin','Interno'] },                        canActivate: [VigilanteGuard] },
  { path: 'pendientes',     component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'pendientes' },     canActivate: [VigilanteGuard] },
  { path: 'proyectos',      component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'proyectos' },      canActivate: [VigilanteGuard] },
  { path: 'viajes',         component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'viajes' },         canActivate: [VigilanteGuard] },
  { path: 'onboarding',     component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'onboarding' },     canActivate: [VigilanteGuard] },
  { path: 'capacitaciones', component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'capacitaciones' }, canActivate: [VigilanteGuard] },
  { path: 'comunicaciones', component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'comunicaciones' }, canActivate: [VigilanteGuard] },
  { path: 'cumpleanos',     component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'cumpleanos' },     canActivate: [VigilanteGuard] },
  { path: 'boveda',         component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'boveda' },         canActivate: [VigilanteGuard] },
  { path: 'materiales',     component: ModuloInternoComponent, data: { rol: ['Admin','Interno'], modulo: 'materiales' },     canActivate: [VigilanteGuard] },
  { path: 'informes',       component: InformesComponent,      data: { rol: ['Admin','Interno'] },                          canActivate: [VigilanteGuard] },
  { path: 'mi-cuenta',      component: MiCuentaComponent,       canActivate: [VigilanteGuard] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
