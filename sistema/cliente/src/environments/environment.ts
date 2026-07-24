/**
 * Configuración de desarrollo.
 *
 * A diferencia del proyecto de referencia, acá no hay servidor propio ni base
 * de datos: la API es la implementación web del Apps Script, y los datos viven
 * en la planilla de Google.
 */
export const environment = {
  production: false,
  // Implementar ▸ Nueva implementación ▸ Aplicación web ▸ Acceso: cualquiera
  api: 'https://script.google.com/macros/s/AKfycbxJhrmMSBgNo_Go15dNwSiNUj8WYeySmIYtamkQ8DEkDAYFrz8eB74IDqHo8pQ38wfz/exec'
};
