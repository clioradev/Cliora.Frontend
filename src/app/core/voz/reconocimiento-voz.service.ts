import { Injectable, signal } from '@angular/core';

// La Web Speech API de reconocimiento no está en los tipos de TypeScript: lo justo para usarla.
interface ResultadoReconocimiento {
  readonly isFinal: boolean;
  readonly length: number;
  [indice: number]: { transcript: string };
}

interface EventoResultado {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [indice: number]: ResultadoReconocimiento };
}

interface Reconocimiento {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((evento: EventoResultado) => void) | null;
  onerror: ((evento: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type ClaseReconocimiento = new () => Reconocimiento;

// Si el reconocimiento se cierra nada más abrirse (sin red un momento, micro aún ocupado por la voz
// que acaba de hablar, Android que corta…), se reintenta esperando cada vez más; solo se rinde tras
// muchos cierres seguidos, para no entrar en un bucle.
const MAXIMO_CIERRES_RAPIDOS = 8;
const CIERRE_RAPIDO_MS = 1500;
const ESPERA_REINTENTO_MS = 400;
const ESPERA_REINTENTO_MAXIMA_MS = 5000;

/**
 * Escucha el micro con el reconocimiento de voz del navegador (Chrome y Edge lo resuelven en sus
 * servidores; Safari, en el dispositivo). Entrega cada frase reconocida con sus alternativas; qué
 * se hace con ella lo decide quien escucha. Chrome corta tras un rato de silencio: se reabre solo.
 */
@Injectable({ providedIn: 'root' })
export class ReconocimientoVozService {
  private readonly Clase: ClaseReconocimiento | null =
    typeof window === 'undefined'
      ? null
      : ((window as unknown as { SpeechRecognition?: ClaseReconocimiento }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: ClaseReconocimiento }).webkitSpeechRecognition ??
        null);

  readonly disponible = this.Clase !== null;
  readonly escuchando = signal(false);
  readonly error = signal<string | null>(null);

  private reconocimiento: Reconocimiento | null = null;
  private inicio = 0;
  private cierresRapidos = 0;
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  /**
   * `retrasoMs`: espera antes de abrir el micro. Justo después de que hable la síntesis de voz, el
   * micro puede seguir ocupado (sobre todo en Android) y el reconocimiento se cerraría al instante.
   */
  escuchar(alOir: (alternativas: string[]) => void, retrasoMs = 0): void {
    this.detener();
    if (!this.Clase) {
      return;
    }

    const reconocimiento = new this.Clase();
    reconocimiento.lang = 'es-ES';
    reconocimiento.continuous = true;
    reconocimiento.interimResults = false;
    reconocimiento.maxAlternatives = 3;

    reconocimiento.onresult = (evento) => {
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const resultado = evento.results[i];
        if (resultado.isFinal && this.reconocimiento === reconocimiento) {
          this.cierresRapidos = 0;
          alOir(Array.from({ length: resultado.length }, (_, j) => resultado[j].transcript));
        }
      }
    };

    reconocimiento.onerror = (evento) => {
      if (this.reconocimiento !== reconocimiento) {
        return;
      }
      if (evento.error === 'not-allowed' || evento.error === 'service-not-allowed') {
        this.error.set('No hay permiso para usar el micrófono.');
        this.detener();
      } else if (evento.error === 'audio-capture') {
        this.error.set('No se encuentra ningún micrófono.');
        this.detener();
      }
      // 'no-speech', 'network', 'aborted'…: se cierra y onend lo reabre.
    };

    reconocimiento.onend = () => {
      if (this.reconocimiento !== reconocimiento) {
        return;
      }
      if (Date.now() - this.inicio >= CIERRE_RAPIDO_MS) {
        this.cierresRapidos = 0;
        this.arrancar(reconocimiento);
        return;
      }
      this.cierresRapidos++;
      if (this.cierresRapidos >= MAXIMO_CIERRES_RAPIDOS) {
        this.error.set('El micrófono se ha cerrado. Pulsa ▶ para volver a intentarlo.');
        this.detener();
        return;
      }
      const espera = Math.min(ESPERA_REINTENTO_MS * 2 ** (this.cierresRapidos - 1), ESPERA_REINTENTO_MAXIMA_MS);
      this.programar(reconocimiento, espera);
    };

    this.reconocimiento = reconocimiento;
    this.error.set(null);
    this.cierresRapidos = 0;
    this.escuchando.set(true);
    this.programar(reconocimiento, retrasoMs);
  }

  /**
   * Pide permiso para el micro sin ponerse a escuchar (al activar el modo manos libres), para que
   * no salte en mitad de una aventura. El permiso es el mismo que usa el reconocimiento de voz.
   */
  async pedirPermiso(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return true;
    }
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      flujo.getTracks().forEach((pista) => pista.stop());
      return true;
    } catch {
      return false;
    }
  }

  detener(): void {
    clearTimeout(this.temporizador);
    const reconocimiento = this.reconocimiento;
    this.reconocimiento = null;
    this.escuchando.set(false);
    reconocimiento?.abort();
  }

  private programar(reconocimiento: Reconocimiento, esperaMs: number): void {
    clearTimeout(this.temporizador);
    if (esperaMs <= 0) {
      this.arrancar(reconocimiento);
      return;
    }
    this.temporizador = setTimeout(() => {
      if (this.reconocimiento === reconocimiento) {
        this.arrancar(reconocimiento);
      }
    }, esperaMs);
  }

  private arrancar(reconocimiento: Reconocimiento): void {
    this.inicio = Date.now();
    try {
      reconocimiento.start();
    } catch {
      // Chrome lanza si la sesión anterior aún no ha terminado de cerrarse: se reintenta como un cierre
      // rápido en lugar de abandonar sin avisar.
      reconocimiento.onend?.();
    }
  }
}
