/** Saca el nombre de archivo de una cabecera Content-Disposition. */
export function nombreDesdeContentDisposition(cabecera: string | null, porDefecto: string): string {
  if (!cabecera) return porDefecto;
  const codificado = /filename\*=UTF-8''([^;]+)/i.exec(cabecera);
  if (codificado?.[1]) return decodeURIComponent(codificado[1]);
  const simple = /filename="?([^";]+)"?/i.exec(cabecera);
  return simple?.[1] ?? porDefecto;
}

/** Dispara la descarga de un Blob con un enlace temporal y libera la URL. */
export function guardarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
