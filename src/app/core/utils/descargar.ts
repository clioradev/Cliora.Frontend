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

/** Nombre del archivo de una cabecera Content-Disposition (filename*=UTF-8''… o filename=…). */
export function nombreArchivoDescarga(cabecera: string | null): string | null {
  const codificado = cabecera?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (codificado) {
    return decodeURIComponent(codificado);
  }
  return cabecera?.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}
