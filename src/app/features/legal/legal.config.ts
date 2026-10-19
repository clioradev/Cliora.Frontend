/**
 * Datos que aparecen en los textos legales (aviso legal, privacidad, cookies y condiciones).
 * Cambiar aquí cualquier dato basta: los textos los leen de este objeto.
 *
 * Lo que va entre corchetes está pendiente. Antes de cobrar de verdad o de abrir Cliora al público
 * hay que rellenarlo (la LSSI exige nombre, NIF y domicilio del titular) y que un profesional
 * revise los textos.
 */
export const DATOS_LEGALES = {
  /** Persona física o empresa responsable de Cliora. */
  titular: 'Artur Ochandorena Blanch',
  /** NIF del titular (el DNI con letra, si es persona física). */
  nif: '[NIF pendiente]',
  /** Domicilio a efectos de notificaciones: puede ser profesional, no tiene por qué ser el de casa. */
  domicilio: '[Domicilio pendiente]',
  /** Inscripción en el Registro Mercantil; solo si el titular es una sociedad. */
  registroMercantil: null as string | null,
  /** Buzón al que pueden escribir los usuarios (debe coincidir con Contacto:EmailSoporte del back). */
  email: 'soporte@cliora.es',
  web: 'cliora.es',
  /** Proveedor que aloja la web, la base de datos y los archivos. */
  alojamiento: 'Microsoft Azure (Microsoft Ireland Operations Ltd.), con servidores en España (región Spain Central)',
  /** Edad mínima para tener cuenta propia (debe coincidir con la validación del registro). */
  edadMinima: 18,
  /** Porcentaje de avance a partir del cual no se devuelve una aventura (parámetro del back). */
  umbralDevolucion: 50,
  /** Días de la prueba gratuita de las suscripciones infantil y juvenil. */
  diasPrueba: 9,
  /** Fecha de la última revisión de los textos: cambiarla al modificarlos. */
  fechaActualizacion: '19 de octubre de 2026',
};
