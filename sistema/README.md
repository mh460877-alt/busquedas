# Sistema de gestión · Escencial Consultora

Angular con la misma estructura que el sistema de Centro de Salud, pero con
**Google Sheets y Apps Script** como base de datos en lugar de Node y MongoDB.

```
sistema/
  servidor/     Apps Script — reemplaza a Express + Mongo
  cliente/      Angular 16 — misma organización que proyFrontend-Grupo8
```

## Equivalencias con el proyecto de referencia

| Centro de Salud | Acá |
|---|---|
| `models/` de mongoose | `servidor/Modelos.gs` — columnas de cada hoja |
| `routes/` + `controllers/` | `servidor/Codigo.gs` + un archivo por entidad |
| JWT (`jwt.config.js`) | `servidor/Auth.gs` — token firmado con HMAC |
| Middleware de permisos | `servidor/Guard.gs` — **valida el rol en el servidor** |
| `services/` de Angular | igual: un servicio por entidad |
| `vigilante.guard.ts` | igual, con `data: { rol: [...] }` por ruta |
| `token-interceptor.service.ts` | igual, pero el token viaja en el cuerpo |

## Instalación

### 1. Servidor

1. Abrí la planilla de Google donde van a vivir los datos.
2. **Extensiones ▸ Apps Script**, y pegá los siete archivos de `servidor/`
   (podés usar `clasp push` desde esa carpeta).
3. Ejecutá una vez `inicializarSistema` — crea las siete hojas.
4. Ejecutá una vez `crearPrimerAdmin` — crea el acceso de dirección.
   **Cambiá la contraseña que está en ese archivo antes de ejecutarlo.**
5. **Implementar ▸ Nueva implementación ▸ Aplicación web**
   - Ejecutar como: yo
   - Acceso: cualquiera
6. Copiá la URL que te da.

### 2. Cliente

```bash
cd cliente
npm install
```

Pegá la URL del paso 6 en `src/environments/environment.ts` y en
`environment.prod.ts`, en el campo `api`.

```bash
npm start                 # desarrollo, en localhost:4200
npm run build             # producción, queda en dist/
```

Lo de `dist/` se publica como sitio estático, igual que hoy.

## Las tres definiciones acordadas

Están aplicadas **en el servidor**, no en la pantalla: aunque alguien pida los
datos por fuera de la aplicación, no los recibe.

| | Definición | Dónde |
|---|---|---|
| 1 | La empresa ve un candidato recién desde terna | `Modelos.gs` → `ETAPAS_VISIBLES_EMPRESA` |
| 2 | La empresa no ve qué consultor lo presentó | `Modelos.gs` → `CAMPOS_OCULTOS` |
| 3 | La empresa no ve el documento | `Modelos.gs` → `CAMPOS_OCULTOS` |

## Diferencias con el sistema anterior

- **Un solo acceso** para los cuatro paneles. Se terminó el `admin/admin123`
  escrito dentro de la página.
- **Las contraseñas se cifran** en el navegador y se guardan con sal. Antes
  estaban en texto plano en la planilla.
- **Nada se lee ni se escribe sin sesión válida.** Antes, cualquiera con la URL
  podía descargar la base de candidatos.
- **Se puede corregir y dar de baja.** Dar de baja no borra: marca inactivo y
  conserva el historial. Eliminar de verdad avisa antes si algo quedaría colgando.
- **Se lee la respuesta del servidor.** Antes se guardaba a ciegas y se avisaba
  éxito sin saber si había funcionado.
- **Queda registro automático** de quién hizo cada cosa, en la hoja de Auditoría.

## Pendiente

- Migrar los datos actuales (7 búsquedas, 10 candidatos, 9 consultores).
- Sumar los módulos de la agenda: pendientes, calendario, proyectos, viajes,
  capacitaciones, cumpleaños y bóveda.
