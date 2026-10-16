/** Saldo y progreso de aventuras gratis (las rayitas de la modal de valorar). */
export interface ProgresoAventuraGratis {
  valoracionesHechas: number;
  valoracionesNecesarias: number;
  aventurasGratis: number;
  /** La valoración que se acaba de guardar ha completado el ciclo. */
  ganadaAhora: boolean;
}
