/**
 * GUARD · Permisos.
 *
 * Equivale al VigilanteGuard del sistema de referencia, con una diferencia
 * importante: acá corre en el servidor. Los datos que un rol no debe ver
 * no se ocultan en la pantalla, directamente no salen de acá.
 *
 * Dos controles encadenados:
 *   1. PERMISOS    · qué acciones puede hacer un rol sobre una tabla
 *   2. PERTENENCIA · de esa tabla, qué filas le corresponden
 */

var PERMISOS = {
  Admin: {
    Usuarios:      ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Empresas:      ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Busquedas:     ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Asignaciones:  ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Candidatos:    ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Observaciones: ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Auditoria:     ['ver'],
    // Mundo interno
    Pendientes:    ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Proyectos:     ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Viajes:        ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Onboarding:    ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Capacitaciones:['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Comunicaciones:['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Cumpleanos:    ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Accesos:       ['ver', 'crear', 'editar', 'baja', 'eliminar'],   // bóveda
    Materiales:    ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    // Nómina
    Colaboradores: ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Permisos:      ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    // Portal del cliente
    Solicitudes:   ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    // Objetivos
    Objetivos:     ['ver', 'crear', 'editar', 'baja', 'eliminar'],
    Avances:       ['ver', 'crear', 'editar', 'baja', 'eliminar']
  },
  Interno: {
    Usuarios:      ['ver'],
    Empresas:      ['ver', 'editar'],
    Busquedas:     ['ver', 'crear', 'editar'],
    Asignaciones:  ['ver', 'crear', 'editar'],
    Candidatos:    ['ver', 'crear', 'editar'],
    Observaciones: ['ver', 'crear', 'editar'],
    Auditoria:     [],
    // Mundo interno: hace el trabajo, pero no elimina
    Pendientes:    ['ver', 'crear', 'editar', 'baja'],
    Proyectos:     ['ver', 'crear', 'editar', 'baja'],
    Viajes:        ['ver', 'crear', 'editar', 'baja'],
    Onboarding:    ['ver', 'crear', 'editar', 'baja'],
    Capacitaciones:['ver', 'crear', 'editar', 'baja'],
    Comunicaciones:['ver', 'crear', 'editar', 'baja'],
    Cumpleanos:    ['ver', 'crear', 'editar', 'baja'],
    Accesos:       ['ver'],   // la bóveda la ve, pero no la toca
    Materiales:    ['ver', 'crear', 'editar', 'baja'],
    // Nómina: trabaja con ella, pero sin los datos de liquidación —el servidor
    // no se los manda— y sin poder borrar legajos.
    Colaboradores: ['ver', 'crear', 'editar', 'baja'],
    Permisos:      ['ver', 'crear', 'editar', 'baja'],
    Solicitudes:   ['ver', 'crear', 'editar', 'baja'],
    Objetivos:     ['ver', 'crear', 'editar', 'baja'],
    Avances:       ['ver', 'crear', 'editar', 'baja']
  },
  Consultor: {
    Usuarios:      [],
    Empresas:      [],
    Busquedas:     ['ver'],
    Asignaciones:  ['ver'],
    Candidatos:    ['ver', 'crear'],
    Observaciones: ['ver', 'crear'],
    Auditoria:     []
  },
  /**
   * El cliente, en su portal. Pide y mira; no toca lo que gestiona Escencial.
   *
   * Puede crear solicitudes pero no editarlas: el estado de un pedido lo mueve
   * quien lo trabaja. Para decir algo sobre un pedido tiene los mensajes.
   */
  Empresa: {
    Usuarios:      [],
    Empresas:      ['ver'],
    Busquedas:     ['ver'],
    Asignaciones:  [],
    Candidatos:    ['ver'],
    Observaciones: ['ver', 'crear'],
    Auditoria:     [],
    Solicitudes:   ['ver', 'crear'],
    Proyectos:     ['ver'],
    Capacitaciones:['ver']
  }
};

/** Corta la ejecución si el rol no puede hacer esa acción sobre esa tabla. */
function exigirPermiso_(sesion, entidad, accion) {
  var delRol = PERMISOS[sesion.rol];
  if (!delRol) throw new Error('Rol desconocido: ' + sesion.rol);
  var permitidas = delRol[entidad] || [];
  if (permitidas.indexOf(accion) < 0) {
    throw new Error('No tenés permiso para ' + accion + ' en ' + entidad);
  }
  return true;
}

/* ======================= REGLAS DE PERTENENCIA ======================= */

/** IDs de las búsquedas que un consultor tiene asignadas. */
function busquedasDelConsultor_(consultorId) {
  return listarTodo_('Asignaciones')
    .filter(function (a) { return String(a.ConsultorID) === String(consultorId); })
    .map(function (a) { return String(a.BusquedaID); });
}

/** IDs de las búsquedas de una empresa. */
function busquedasDeEmpresa_(empresaId) {
  return listarTodo_('Busquedas')
    .filter(function (b) { return String(b.EmpresaID) === String(empresaId); })
    .map(function (b) { return String(b.ID); });
}

/**
 * Recorta un listado a lo que la sesión tiene derecho a ver.
 * Acá se aplican las tres definiciones acordadas para el panel de empresas.
 */
function filtrarPorPertenencia_(sesion, entidad, filas) {
  if (sesion.rol === 'Admin' || sesion.rol === 'Interno') return filas;

  if (sesion.rol === 'Consultor') {
    var mias = busquedasDelConsultor_(sesion.uid);
    if (entidad === 'Busquedas') {
      return filas.filter(function (f) {
        return mias.indexOf(String(f.ID)) >= 0 && String(f.Estado) === 'Activa';
      });
    }
    if (entidad === 'Asignaciones') {
      return filas.filter(function (f) { return String(f.ConsultorID) === String(sesion.uid); });
    }
    if (entidad === 'Candidatos') {
      return filas.filter(function (f) { return String(f.ConsultorID) === String(sesion.uid); });
    }
    if (entidad === 'Observaciones') {
      var propios = filtrarPorPertenencia_(sesion, 'Candidatos', listarTodo_('Candidatos'))
        .map(function (c) { return String(c.ID); });
      return filas.filter(function (f) {
        if (propios.indexOf(String(f.CandidatoID)) < 0) return false;
        /**
         * Mismo criterio que con las empresas: ve las suyas y las que el equipo
         * marcó como compartidas. Una observación "Interna" es una nota del
         * equipo sobre el candidato —a veces sobre por qué no convence—, y
         * mandársela a quien lo presentó es exactamente lo que esa marca evita.
         */
        return String(f.AutorID) === String(sesion.uid) || String(f.Visibilidad) === 'Compartida';
      });
    }
    return [];
  }

  if (sesion.rol === 'Empresa') {
    var suyas = busquedasDeEmpresa_(sesion.empresaId);

    /**
     * Todo lo que lleva EmpresaID se recorta solo: el cliente ve lo suyo y
     * nada más. Vale para sus solicitudes, sus proyectos y sus capacitaciones.
     */
    if (entidad === 'Solicitudes' || ENTIDADES_POR_EMPRESA.indexOf(entidad) >= 0) {
      return filas.filter(function (f) {
        return String(f.EmpresaID) === String(sesion.empresaId);
      });
    }

    if (entidad === 'Empresas') {
      return filas.filter(function (f) { return String(f.ID) === String(sesion.empresaId); });
    }
    if (entidad === 'Busquedas') {
      return filas.filter(function (f) { return String(f.EmpresaID) === String(sesion.empresaId); });
    }
    if (entidad === 'Candidatos') {
      // DEFINICIÓN 1 · antes de terna la empresa no ve al candidato.
      return filas.filter(function (f) {
        return suyas.indexOf(String(f.BusquedaID)) >= 0 &&
               ETAPAS_VISIBLES_EMPRESA.indexOf(String(f.Etapa)) >= 0;
      });
    }
    if (entidad === 'Observaciones') {
      var visibles = filtrarPorPertenencia_(sesion, 'Candidatos', listarTodo_('Candidatos'))
        .map(function (c) { return String(c.ID); });
      return filas.filter(function (f) {
        if (visibles.indexOf(String(f.CandidatoID)) < 0) return false;
        // Ve las suyas y las que el equipo marcó como compartidas.
        return String(f.AutorID) === String(sesion.uid) || String(f.Visibilidad) === 'Compartida';
      });
    }
    return [];
  }

  return [];
}

/** ¿Esta sesión puede tocar este registro puntual? */
function exigirAlcance_(sesion, entidad, id) {
  if (sesion.rol === 'Admin' || sesion.rol === 'Interno') return true;
  var visibles = filtrarPorPertenencia_(sesion, entidad, listarTodo_(entidad));
  var alcanza = visibles.some(function (f) { return String(f.ID) === String(id); });
  if (!alcanza) throw new Error('Ese registro no está a tu alcance');
  return true;
}

/**
 * Validaciones de negocio al crear, según quién crea.
 * Impide, por ejemplo, que un consultor cargue un candidato en una búsqueda ajena.
 */
function validarAlta_(sesion, entidad, datos) {
  if (entidad === 'Candidatos') {
    if (sesion.rol === 'Consultor') {
      var mias = busquedasDelConsultor_(sesion.uid);
      if (mias.indexOf(String(datos.BusquedaID)) < 0) {
        throw new Error('Esa búsqueda no está entre las tuyas');
      }
      datos.ConsultorID = sesion.uid;      // no se acepta lo que mande el navegador
    }
    var repetido = listarTodo_('Candidatos').filter(function (c) {
      return String(c.DNI).trim() === String(datos.DNI).trim();
    });
    if (repetido.length) throw new Error('Ese documento ya está registrado en el sistema');
    if (!datos.Etapa) datos.Etapa = 'En revision';
    if (!datos.FechaCarga) datos.FechaCarga = hoy_();
  }

  if (entidad === 'Observaciones') {
    datos.AutorID = sesion.uid;
    datos.RolAutor = sesion.rol;
    datos.Fecha = hoy_();
    // Lo que escribe una empresa es siempre visible para el equipo.
    if (sesion.rol === 'Empresa') datos.Visibilidad = 'Compartida';
    if (!datos.Visibilidad) datos.Visibilidad = 'Interna';
    exigirAlcance_(sesion, 'Candidatos', datos.CandidatoID);
  }

  if (entidad === 'Busquedas') {
    if (!datos.Etapa) datos.Etapa = 'Relevamiento del perfil';
    if (!datos.Estado) datos.Estado = 'Activa';
    if (!datos.FechaAlta) datos.FechaAlta = hoy_();
  }

  if (entidad === 'Usuarios') {
    if (ROLES.indexOf(datos.Rol) < 0) throw new Error('Rol inválido');
    if (datos.Rol === 'Empresa' && !datos.EmpresaID) {
      throw new Error('Un usuario de empresa necesita tener su empresa asignada');
    }
    if (!datos.Estado) datos.Estado = 'Activo';
  }

  if (entidad === 'Empresas') {
    if (!datos.Estado) datos.Estado = 'Activo';
    if (!datos.FechaAlta) datos.FechaAlta = hoy_();
  }

  if (entidad === 'Avances') {
    datos.AutorID = sesion.uid;
    datos.AutorNombre = sesion.nombre;
    if (!datos.Fecha) datos.Fecha = hoy_();
  }

  if (entidad === 'Objetivos') {
    if (!datos.Estado) datos.Estado = 'Activo';
    if (!datos.Unidad) datos.Unidad = 'Cantidad';
    if (!datos.Ambito) datos.Ambito = datos.Colaborador ? 'Persona' : 'Equipo';
    /**
     * Un objetivo sin ninguna meta no se puede medir. Con una alcanza: los
     * demás horizontes muestran lo acumulado y avisan que ahí no hay meta
     * definida, en lugar de inventar una.
     */
    var metas = ['MetaDiaria', 'MetaSemanal', 'MetaMensual',
                 'MetaTrimestral', 'MetaSemestral', 'MetaAnual', 'Meta'];
    var tieneAlguna = metas.some(function (m) { return Number(datos[m]) > 0; });
    if (!tieneAlguna) throw new Error('Poné al menos una meta: diaria, semanal, mensual, trimestral, semestral o anual');
  }

  if (entidad === 'Solicitudes') {
    /**
     * La empresa del pedido la pone el servidor, no el navegador: un cliente
     * no puede abrir un pedido a nombre de otro. Escencial sí la elige, porque
     * a veces carga el pedido que le llegó por teléfono.
     */
    if (sesion.rol === 'Empresa') datos.EmpresaID = sesion.empresaId;
    if (!datos.EmpresaID) throw new Error('Falta indicar de qué empresa es el pedido');

    datos.AutorID = sesion.uid;
    datos.AutorNombre = sesion.nombre;
    if (!datos.FechaSolicitud) datos.FechaSolicitud = hoy_();
    if (!datos.Estado) datos.Estado = 'Nueva';
    if (!datos.Prioridad) datos.Prioridad = 'Normal';
  }

  return datos;
}

/* ============================ AUDITORÍA ============================ */

/** Se escribe sola en cada movimiento: es el "quién hizo qué". */
function auditar_(sesion, accion, entidad, registroId, detalle) {
  try {
    insertar_('Auditoria', {
      Fecha: new Date(),
      UsuarioID: sesion.uid,
      UsuarioNombre: sesion.nombre,
      Accion: accion,
      Entidad: entidad,
      RegistroID: registroId,
      Detalle: detalle || ''
    });
  } catch (e) {
    // La auditoría nunca debe impedir que la operación principal termine.
  }
}
