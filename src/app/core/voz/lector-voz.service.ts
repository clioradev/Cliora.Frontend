import { Injectable, signal } from '@angular/core';

export type EstadoLector = 'parado' | 'leyendo' | 'pausado';

// Chrome corta las locuciones de más de unos 15 segundos: se lee frase a frase y las muy largas se
// parten por una coma o un espacio.
const LARGO_MAXIMO = 220;

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

  private frases: string[] = [];
  private indice = 0;
  private alTerminar: (() => void) | null = null;
  // Cada locución lleva su turno: los eventos de una frase ya cancelada no deben mover la lectura actual.
  private turno = 0;
  private voz: SpeechSynthesisVoice | null = null;

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
  }

  pausar(): void {
    if (this.estado() !== 'leyendo') {
      return;
    }
    this.turno++;
    this.sintesis?.cancel();
    this.estado.set('pausado');
  }

  reanudar(): void {
    if (this.estado() !== 'pausado') {
      return;
    }
    this.estado.set('leyendo');
    this.decirFraseActual();
  }

  parar(): void {
    this.turno++;
    this.sintesis?.cancel();
    this.frases = [];
    this.indice = 0;
    this.alTerminar = null;
    this.estado.set('parado');
  }

  private decirFraseActual(): void {
    const turno = ++this.turno;
    const locucion = new SpeechSynthesisUtterance(this.frases[this.indice]);
    locucion.lang = this.voz?.lang ?? 'es-ES';
    if (this.voz) {
      locucion.voice = this.voz;
    }

    locucion.onend = () => {
      if (turno !== this.turno) {
        return;
      }
      this.indice++;
      if (this.indice < this.frases.length) {
        this.decirFraseActual();
      } else {
        const alTerminar = this.alTerminar;
        this.parar();
        alTerminar?.();
      }
    };
    locucion.onerror = (evento) => {
      if (turno === this.turno) {
        this.parar();
        this.bloqueado.set(evento.error === 'not-allowed');
      }
    };

    this.sintesis!.speak(locucion);
  }

  // Primero el acento de España y, dentro de él, las voces naturales (suelen llevarlo en el nombre).
  private elegirVoz(): void {
    const voces = this.sintesis!.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'));
    const puntuar = (v: SpeechSynthesisVoice) =>
      (v.lang.toLowerCase().replace('_', '-') === 'es-es' ? 2 : 0) +
      (/natural|neural|online|google|premium|enhanced|mejorad/i.test(v.name) ? 1 : 0);
    this.voz = voces.sort((a, b) => puntuar(b) - puntuar(a))[0] ?? null;
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
