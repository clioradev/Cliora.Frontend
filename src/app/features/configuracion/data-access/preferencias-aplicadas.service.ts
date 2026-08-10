import { Injectable } from '@angular/core';
import { Preferencias } from '../models/preferencias.model';

const TIPOGRAFIA_FUENTES: Record<number, string> = {
  1: "'Literata', Georgia, 'Times New Roman', serif",
  2: "Georgia, 'Times New Roman', Times, serif",
  3: "Consolas, 'Courier New', monospace",
  4: "'Orbitron', 'Segoe UI', sans-serif",
  5: "'MedievalSharp', 'Papyrus', fantasy",
  6: "'Special Elite', 'Courier New', monospace",
};

const TAMANO_FUENTE_VALORES: Record<number, string> = {
  1: '0.95rem',
  2: '1.1rem',
  3: '1.3rem',
  4: '1.55rem',
};

const ESPACIADO_LINEAS_VALORES: Record<number, string> = {
  1: '1.35',
  2: '1.6',
  3: '2',
};

const ANCHO_LECTURA_VALORES: Record<number, string> = {
  1: '30rem',
  2: '42rem',
  3: '56rem',
};

// [claro, oscuro] en cada extremo del slider "Oscurecer fondo" (0% -> 100%).
const FONDO_CLARO: [string, string] = ['#faf8f4', '#c4b8a0'];
const FONDO_OSCURO: [string, string] = ['#4a453c', '#1c1a16'];

@Injectable({ providedIn: 'root' })
export class PreferenciasAplicadasService {
  aplicar(preferencias: Preferencias): void {
    const raiz = document.documentElement;

    if (preferencias.tema === 1) {
      raiz.setAttribute('data-theme', 'light');
    } else if (preferencias.tema === 2) {
      raiz.setAttribute('data-theme', 'dark');
    } else {
      raiz.removeAttribute('data-theme');
    }

    raiz.style.setProperty('--font-reading', TIPOGRAFIA_FUENTES[preferencias.tipografia] ?? TIPOGRAFIA_FUENTES[1]);
    raiz.style.setProperty('--text-reading', TAMANO_FUENTE_VALORES[preferencias.tamanoFuente] ?? TAMANO_FUENTE_VALORES[2]);
    raiz.style.setProperty(
      '--line-height-reading',
      ESPACIADO_LINEAS_VALORES[preferencias.espaciadoLineas] ?? ESPACIADO_LINEAS_VALORES[2],
    );
    raiz.style.setProperty(
      '--content-width-reading',
      ANCHO_LECTURA_VALORES[preferencias.anchoLectura] ?? ANCHO_LECTURA_VALORES[2],
    );

    const esOscuro = this.resolverEsOscuro(preferencias.tema);
    const [inicio, fin] = esOscuro ? FONDO_OSCURO : FONDO_CLARO;
    raiz.style.setProperty('--color-bg', this.interpolarColor(inicio, fin, preferencias.intensidadFondo / 100));

    raiz.toggleAttribute('data-alto-contraste', preferencias.altoContraste);
    raiz.toggleAttribute('data-reducir-animaciones', preferencias.reducirAnimaciones);
  }

  private resolverEsOscuro(tema: number): boolean {
    if (tema === 2) {
      return true;
    }
    if (tema === 1) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private interpolarColor(hexInicio: string, hexFin: string, t: number): string {
    const clamped = Math.min(1, Math.max(0, t));
    const [r1, g1, b1] = this.hexARgb(hexInicio);
    const [r2, g2, b2] = this.hexARgb(hexFin);

    const r = Math.round(r1 + (r2 - r1) * clamped);
    const g = Math.round(g1 + (g2 - g1) * clamped);
    const b = Math.round(b1 + (b2 - b1) * clamped);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexARgb(hex: string): [number, number, number] {
    const limpio = hex.replace('#', '');
    return [parseInt(limpio.slice(0, 2), 16), parseInt(limpio.slice(2, 4), 16), parseInt(limpio.slice(4, 6), 16)];
  }
}
