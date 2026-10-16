import { Injectable, signal } from '@angular/core';

export type EstadoLector = 'parado' | 'leyendo' | 'pausado';

// Chrome corta las locuciones de más de unos 15 segundos: se lee frase a frase y las muy largas se
// parten por una coma o un espacio (con margen para las velocidades lentas).
const LARGO_MAXIMO = 150;

// Cada segundo se vigila la lectura: si el navegador se ha callado sin avisar (pasa en Chrome), se
// sigue con la frase siguiente; y en escritorio se hace pausa/reanudar cada 10 s, el remedio
// conocido para que Chrome no corte (en Android la pausa falla, allí no se hace).
const VIGILANCIA_MS = 1000;
const TICS_MANTENER_VIVA = 10;
const TICS_CALLADO = 2;

/** Velocidad por defecto (en %): la normal del navegador. */
export const VELOCIDAD_LECTURA_POR_DEFECTO = 100;

const CLAVE_VOZ = 'cliora.vozLectura';

export interface VozDisponible {
  id: string;
  nombre: string;
}

function leerVozGuardada(): string | null {
  try {
    return localStorage.getItem(CLAVE_VOZ);
  } catch {
    return null;
  }
}

/**
 * Lectura en voz alta con la síntesis de voz del navegador (Web Speech API): usa las voces que
 * tenga instaladas el dispositivo, sin servidor ni coste. La pausa no usa speechSynthesis.pause()
 * (falla en Android): cancela y, al reanudar, repite la frase en la que se quedó.
 */
@Injectable({ providedIn: 'root' })
export class LectorVozService {
  private readonly sintesis = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

  readonly disponible = this.sintesis !== null;
  readonly estado = signal<EstadoLector>('parado');
  /** El navegador no deja hablar hasta que el usuario toque la página (p. ej. tras un F5). */
  readonly bloqueado = signal(false);

  /** En %, 100 es la velocidad normal del navegador. La fija la preferencia del usuario. */
  readonly velocidad = signal(VELOCIDAD_LECTURA_POR_DEFECTO);

  /**
   * Voces en castellano de este dispositivo, la recomendada primero. Cada dispositivo tiene las
   * suyas, así que la elegida se guarda en el dispositivo y no en la cuenta.
   */
  readonly voces = signal<VozDisponible[]>([]);
  readonly idVozElegida = signal<string | null>(leerVozGuardada());

  private frases: string[] = [];
  private indice = 0;
  private alTerminar: (() => void) | null = null;
  // Cada locución lleva su turno: los eventos de una frase ya cancelada no deben mover la lectura actual.
  private turno = 0;
  private voz: SpeechSynthesisVoice | null = null;
  // Chrome libera la locución si nadie la referencia y entonces nunca avisa de que ha terminado:
  // la lectura se quedaba parada a medio texto.
  private locucionActual: SpeechSynthesisUtterance | null = null;
  private vigilancia: ReturnType<typeof setInterval> | undefined;
  private tics = 0;
  private ticsCallado = 0;
  private readonly esAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  constructor() {
    if (this.sintesis) {
      this.elegirVoz();
      // En Chrome la lista de voces llega más tarde.
      this.sintesis.addEventListener('voiceschanged', () => this.elegirVoz());
    }
  }

  /**
   * Lee los párrafos de principio a fin; corta cualquier lectura anterior. `alTerminar` solo se
   * llama si la lectura llega al final (no si se para, se pausa sin reanudar o se sustituye).
   */
  leer(parrafos: string[], alTerminar?: () => void): void {
    this.parar();
    this.frases = parrafos.flatMap(trocear);
    if (!this.sintesis || this.frases.length === 0) {
      alTerminar?.();
      return;
    }
    this.alTerminar = alTerminar ?? null;
    this.bloqueado.set(false);
    this.estado.set('leyendo');
    this.decirFraseActual();
    this.vigilar();
  }

  pausar(): void {
    if (this.estado() !== 'leyendo') {
      return;
    }
    this.turno++;
    this.dejarDeVigilar();
    this.sintesis?.cancel();
    this.estado.set('pausado');
  }

  reanudar(): void {
    if (this.estado() !== 'pausado') {
      return;
    }
    this.estado.set('leyendo');
    this.decirFraseActual();
    this.vigilar();
  }

  parar(): void {
    this.turno++;
    this.dejarDeVigilar();
    this.sintesis?.cancel();
    this.locucionActual = null;
    this.frases = [];
    this.indice = 0;
    this.alTerminar = null;
    this.estado.set('parado');
  }

  private decirFraseActual(): void {
    const turno = ++this.turno;
    const locucion = new SpeechSynthesisUtterance(this.frases[this.indice]);
    locucion.lang = this.voz?.lang ?? 'es-ES';
    locucion.rate = this.velocidad() / 100;
    if (this.voz) {
      locucion.voice = this.voz;
    }

    locucion.onend = () => {
      if (turno === this.turno) {
        this.siguienteFrase();
      }
    };
    locucion.onerror = (evento) => {
      if (turno === this.turno) {
        this.parar();
        this.bloqueado.set(evento.error === 'not-allowed');
      }
    };

    this.locucionActual = locucion;
    this.ticsCallado = 0;
    this.sintesis!.speak(locucion);
  }

  private siguienteFrase(): void {
    this.indice++;
    if (this.indice < this.frases.length) {
      this.decirFraseActual();
    } else {
      const alTerminar = this.alTerminar;
      this.parar();
      alTerminar?.();
    }
  }

  private vigilar(): void {
    this.dejarDeVigilar();
    this.tics = 0;
    this.vigilancia = setInterval(() => {
      const sintesis = this.sintesis!;
      if (this.estado() !== 'leyendo') {
        return;
      }

      // Callado sin haber avisado del final: se da la frase por leída.
      this.ticsCallado = sintesis.speaking || sintesis.pending ? 0 : this.ticsCallado + 1;
      if (this.ticsCallado >= TICS_CALLADO) {
        this.turno++;
        this.siguienteFrase();
        return;
      }

      if (!this.esAndroid && ++this.tics % TICS_MANTENER_VIVA === 0 && sintesis.speaking) {
        sintesis.pause();
        sintesis.resume();
      }
    }, VIGILANCIA_MS);
  }

  private dejarDeVigilar(): void {
    clearInterval(this.vigilancia);
    this.vigilancia = undefined;
  }

  /** Cambia la voz de este dispositivo; null = la automática. */
  cambiarVoz(idVoz: string | null): void {
    this.idVozElegida.set(idVoz);
    try {
      if (idVoz) {
        localStorage.setItem(CLAVE_VOZ, idVoz);
      } else {
        localStorage.removeItem(CLAVE_VOZ);
      }
    } catch {
      // Sin almacenamiento (modo privado…): vale para esta sesión.
    }
    this.elegirVoz();
  }

  // La elegida por el usuario si sigue instalada; si no, primero el acento de España y, dentro de
  // él, las voces naturales (suelen llevarlo en el nombre).
  private elegirVoz(): void {
    const puntuar = (v: SpeechSynthesisVoice) =>
      (v.lang.toLowerCase().replace('_', '-') === 'es-es' ? 2 : 0) +
      (/natural|neural|online|google|premium|enhanced|mejorad/i.test(v.name) ? 1 : 0);
    const voces = this.sintesis!.getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('es'))
      .sort((a, b) => puntuar(b) - puntuar(a) || a.name.localeCompare(b.name));

    this.voces.set(voces.map((v) => ({ id: v.voiceURI, nombre: `${v.name} (${v.lang})` })));
    this.voz = voces.find((v) => v.voiceURI === this.idVozElegida()) ?? voces[0] ?? null;
  }
}

function trocear(parrafo: string): string[] {
  const frases = parrafo.replace(/\s+/g, ' ').match(/[^.!?…;]+[.!?…;]*[»"”')]*\s*/g) ?? [];
  const trozos: string[] = [];

  for (const frase of frases) {
    let resto = frase.trim();
    while (resto.length > LARGO_MAXIMO) {
      const coma = resto.lastIndexOf(',', LARGO_MAXIMO);
      const corte = coma > LARGO_MAXIMO / 2 ? coma : resto.lastIndexOf(' ', LARGO_MAXIMO);
      const fin = corte > 0 ? corte + 1 : LARGO_MAXIMO;
      trozos.push(resto.slice(0, fin).trim());
      resto = resto.slice(fin).trim();
    }
    if (resto) {
      trozos.push(resto);
    }
  }

  // Las frases cortas seguidas se juntan: entre locuciones hay una pausa que corta el ritmo.
  return trozos.reduce<string[]>((juntos, trozo) => {
    const ultimo = juntos.at(-1);
    if (ultimo !== undefined && ultimo.length + trozo.length < LARGO_MAXIMO) {
      juntos[juntos.length - 1] = `${ultimo} ${trozo}`;
    } else {
      juntos.push(trozo);
    }
    return juntos;
  }, []);
}
