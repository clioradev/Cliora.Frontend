export interface PasoTutorial {
  /**
   * Elementos a resaltar, por orden de preferencia (se usa el primero que exista). Sin ninguno, o
   * si no aparece a tiempo, la burbuja sale centrada.
   */
  objetivos?: string[];
  titulo?: string;
  texto: string;
  /** Para seguir hay que pulsar el elemento resaltado: no hay botón «Siguiente». */
  pulsar?: boolean;
  /**
   * Qué parte del elemento se deja a la vista si no cabe entero (en el móvil, la estantería o los
   * bloques de Preferencias son más altos que la pantalla). Por defecto, el centro.
   */
  alinear?: ScrollLogicalPosition;
  /** Adónde ir si no se ha podido pulsar (el elemento no estaba) y se sigue con «Siguiente». */
  ruta?: string;
}

const tutorial = (nombre: string) => `[data-tutorial="${nombre}"]`;

// Textos cortos: una idea por burbuja. Los pasos del menú son los de un usuario normal.
export const PASOS_TUTORIAL: PasoTutorial[] = [
  {
    titulo: '¡Te damos la bienvenida a Cliora!',
    texto: 'Aquí tú decides cómo sigue cada historia. Te enseñamos lo básico en un minuto.',
  },
  {
    objetivos: [tutorial('universo')],
    titulo: 'Universos',
    texto: 'Un universo es un mundo con sus propias historias. Sus aventuras se agrupan en campañas, que se juegan en orden.',
  },
  {
    objetivos: [tutorial('favorito')],
    titulo: 'Favoritos',
    texto: 'Dale al pulgar para marcar un universo como favorito: tus favoritos salen siempre primero.',
  },
  {
    objetivos: [tutorial('estanteria'), tutorial('aventura')],
    alinear: 'end',
    titulo: 'Los colores de las aventuras',
    texto:
      'Verde: puedes jugarla. Azul: ya la terminaste. Rojo: aún no está disponible (es de pago o te falta terminar la anterior). Las doradas son libros: se leen pasando página.',
  },
  {
    objetivos: [tutorial('precio'), tutorial('campana-precio'), tutorial('aventura')],
    titulo: 'Comprar aventuras',
    texto:
      'La primera aventura de cada campaña es gratis. Las demás llevan candado: añádelas al carrito con su botón, o la campaña entera, más barata, desde su título. Y valorando aventuras ganas aventuras gratis.',
  },
  {
    objetivos: [tutorial('buscador')],
    titulo: 'Buscar',
    texto: 'Busca por título. El botón de al lado filtra por favoritos, tipo de universo o cantidad de decisiones.',
  },
  {
    objetivos: [tutorial('nav-continuar')],
    titulo: 'Continuar',
    texto: 'Te devuelve a la última aventura que estabas jugando, justo donde la dejaste.',
  },
  {
    objetivos: [tutorial('nav-universos')],
    titulo: 'Universos',
    texto: 'Te trae a esta lista. Cuando añadas algo al carrito, aparecerá aquí al lado.',
  },
  {
    objetivos: [tutorial('nav-mas')],
    texto: 'Pulsa «Más» para ver el resto de opciones.',
    pulsar: true,
  },
  {
    objetivos: [tutorial('menu-mas')],
    texto:
      'Aquí tienes qué es Cliora, cómo publicar tus propias historias, tu cuenta, tus preferencias, la contraseña y cerrar sesión.',
  },
  {
    objetivos: ['.mas-menu a[href="/configuracion/preferencias"]'],
    texto: 'Por último, pulsa «Preferencias» para dejarlo todo a tu gusto.',
    pulsar: true,
    ruta: '/configuracion/preferencias',
  },
  {
    objetivos: [tutorial('pref-apariencia')],
    alinear: 'start',
    titulo: 'Apariencia',
    texto: 'Tema, letra, espaciado, ancho y fondo: así se verán las historias. Los cambios se ven al momento.',
  },
  {
    objetivos: [tutorial('pref-voz')],
    alinear: 'start',
    titulo: 'Voz y velocidad',
    texto: 'Las aventuras también se escuchan. Elige la voz y la velocidad, y pulsa «Probar» para oírla.',
  },
  {
    objetivos: [tutorial('pref-lectura')],
    alinear: 'start',
    titulo: 'Escuchar las aventuras',
    texto:
      'Lectura automática: cada página se lee sola al entrar. Manos libres: además lee las opciones y eliges en voz alta, diciendo «Elijo la primera».',
  },
  {
    objetivos: [tutorial('pref-guardar')],
    texto: 'Cuando cambies algo, pulsa «Guardar».',
  },
  {
    titulo: '¡Listo!',
    texto: 'Ya puedes empezar tu primera aventura. Si quieres repasar esto, tienes el tutorial al final de Preferencias.',
  },
];
