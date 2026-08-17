/**
 * Orden de los listados: lo último cargado, arriba.
 *
 * Toda hoja del sistema guarda MarcaTiempo en el momento de insertar la fila,
 * así que sirve para cualquier tabla sin tener que saber cuál es su campo de
 * fecha. El formato es "yyyy-MM-dd HH:mm:ss", que se ordena bien como texto.
 *
 * Devuelve una copia: ordenar la lista original haría que Angular la reordene
 * mientras se está dibujando.
 */
export function nuevosPrimero<T extends { MarcaTiempo?: string }>(filas: T[]): T[] {
  return filas.slice().sort((a, b) =>
    String(b.MarcaTiempo ?? '').localeCompare(String(a.MarcaTiempo ?? '')));
}
