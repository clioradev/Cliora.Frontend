/** Ofrece al navegador un archivo para guardar (exportar paquetes, alertas…). */
export function descargar(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function descargarJson(datos: unknown, nombre: string): void {
  descargar(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }), nombre);
}
