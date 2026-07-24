/**
 * PRUEBAS · Crea un usuario por cada rol, para probar los cuatro paneles.
 *
 * Se ejecuta a mano desde el editor o el menú. Todos con la misma contraseña:
 *   prueba123
 *
 * Son cuentas de prueba: borralas antes de usar el sistema en serio, desde el
 * panel de Usuarios o ejecutando borrarActoresDePrueba.
 */

var CLAVE_PRUEBA = 'prueba123';

function crearActoresDePrueba() {
  var informe = [];

  // Contraseña: se guarda igual que si la hubiera tipeado alguien en el login.
  function conClave(datos) {
    var salt = Utilities.getUuid();
    datos.Salt = salt;
    datos.Hash = sha256_(salt + sha256_(CLAVE_PRUEBA));
    datos.Estado = 'Activo';
    return datos;
  }

  function existe(id) {
    return listarTodo_('Usuarios').some(function (u) {
      return String(u.Usuario).toLowerCase() === id;
    });
  }

  /* Empresa de prueba, para engancharle el usuario Empresa. */
  var empresaId;
  var empresaPrueba = listarTodo_('Empresas').filter(function (e) {
    return e.Nombre === 'Empresa Demo (prueba)';
  })[0];
  if (empresaPrueba) {
    empresaId = empresaPrueba.ID;
  } else {
    var creada = insertar_('Empresas', {
      Nombre: 'Empresa Demo (prueba)',
      Linea: 'Seleccion y reclutamiento',
      Contacto: 'Contacto Demo',
      Email: 'demo@empresa-prueba.com',
      Estado: 'Activo',
      FechaAlta: hoy_()
    });
    empresaId = creada.ID;
    informe.push('Empresa de prueba creada.');
  }

  var actores = [
    { Usuario: 'admin.prueba',     Nombre: 'Admin Prueba',     Correo: 'admin@prueba.com',     Rol: 'Admin' },
    { Usuario: 'interno.prueba',   Nombre: 'Interno Prueba',   Correo: 'interno@prueba.com',   Rol: 'Interno' },
    { Usuario: 'consultor.prueba', Nombre: 'Consultor Prueba', Correo: 'consultor@prueba.com', Rol: 'Consultor' },
    { Usuario: 'empresa.prueba',   Nombre: 'Empresa Prueba',   Correo: 'empresa@prueba.com',   Rol: 'Empresa', EmpresaID: empresaId }
  ];

  actores.forEach(function (a) {
    if (existe(a.Usuario.toLowerCase())) {
      informe.push('Ya existía: ' + a.Usuario);
      return;
    }
    insertar_('Usuarios', conClave(a));
    informe.push('Creado: ' + a.Usuario + ' (' + a.Rol + ')');
  });

  var texto = informe.join('\n') +
    '\n\nTodos entran con la contraseña:  ' + CLAVE_PRUEBA +
    '\nUsuarios: admin.prueba · interno.prueba · consultor.prueba · empresa.prueba';
  Logger.log(texto);
  return texto;
}

function crearActoresYMostrar() {
  var r = crearActoresDePrueba();
  SpreadsheetApp.getUi().alert('Actores de prueba', r, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Borra las cuatro cuentas de prueba y la empresa demo. */
function borrarActoresDePrueba() {
  var usuarios = ['admin.prueba', 'interno.prueba', 'consultor.prueba', 'empresa.prueba'];
  var borrados = 0;
  listarTodo_('Usuarios').forEach(function (u) {
    if (usuarios.indexOf(String(u.Usuario).toLowerCase()) >= 0) {
      eliminar_('Usuarios', u.ID); borrados++;
    }
  });
  listarTodo_('Empresas').forEach(function (e) {
    if (e.Nombre === 'Empresa Demo (prueba)') eliminar_('Empresas', e.ID);
  });
  return 'Cuentas de prueba borradas: ' + borrados;
}
