import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TokenInterceptorService } from './services/token-interceptor.service';

import { LoginComponent } from './components/login/login.component';
import { NavComponent } from './components/nav/nav.component';
import { UsuarioListComponent } from './components/usuario-list/usuario-list.component';
import { UsuarioFormComponent } from './components/usuario-form/usuario-form.component';
import { EmpresaListComponent } from './components/empresa-list/empresa-list.component';
import { EmpresaFormComponent } from './components/empresa-form/empresa-form.component';
import { EmpresaFichaComponent } from './components/empresa-ficha/empresa-ficha.component';
import { EnlacesComponent } from './components/enlaces/enlaces.component';
import { AccesosEmpresaComponent } from './components/accesos-empresa/accesos-empresa.component';
import { ObservacionesComponent } from './components/observaciones/observaciones.component';
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

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NavComponent,
    UsuarioListComponent,
    UsuarioFormComponent,
    EmpresaListComponent,
    EmpresaFormComponent,
    EmpresaFichaComponent,
    EnlacesComponent,
    AccesosEmpresaComponent,
    ObservacionesComponent,
    BusquedaListComponent,
    BusquedaFormComponent,
    BusquedaDetalleComponent,
    CandidatoListComponent,
    CandidatoFormComponent,
    MisBusquedasComponent,
    MiProcesoComponent,
    AuditoriaComponent,
    ModuloInternoComponent,
    CalendarioComponent,
    InformesComponent,
    MiCuentaComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
