import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { descargar, nombreArchivoDescarga } from '../../../../core/utils/descargar';
import { EconomiaService } from '../../data-access/economia.service';
import {
  Categoria,
  CategoriaEconomica,
  ContratoAutor,
  DuracionAventura,
  EstadoLectura,
  LecturaAdmin,
  NOMBRE_CATEGORIA,
  NOMBRE_MOTIVO,
  PropuestaDuracion,
} from '../../models/economia.model';
import { duracion, euros, leerMes, leerNumero, nombreMes, numero, porcentaje, valorMes } from '../../utils/formato';

type Pestana = 'resumen' | 'autores' | 'lecturas' | 'duraciones';

@Component({
  selector: 'app-admin-economia',
  imports: [DatePipe],
  templateUrl: './admin-economia.component.html',
  styleUrl: './admin-economia.component.scss',
})
export class AdminEconomiaComponent {
  private readonly economiaService = inject(EconomiaService);

  protected readonly Categoria = Categoria;
  protected readonly EstadoLectura = EstadoLectura;
  protected readonly euros = euros;
  protected readonly numero = numero;
  protected readonly porcentaje = porcentaje;
  protected readonly duracion = duracion;
  protected readonly nombreMes = nombreMes;

  protected readonly pestana = signal<Pestana>('resumen');
  protected readonly pestanas: { valor: Pestana; etiqueta: string }[] = [
    { valor: 'resumen', etiqueta: 'Resumen del mes' },
    { valor: 'autores', etiqueta: 'Autores y pagos' },
    { valor: 'lecturas', etiqueta: 'Lecturas' },
    { valor: 'duraciones', etiqueta: 'Duraciones' },
  ];

  // Mes elegido: por defecto, el anterior (el que toca cerrar).
  private readonly hoy = new Date();
  protected readonly anio = signal(this.hoy.getMonth() === 0 ? this.hoy.getFullYear() - 1 : this.hoy.getFullYear());
  protected readonly mes = signal(this.hoy.getMonth() === 0 ? 12 : this.hoy.getMonth());
  protected readonly valorMes = computed(() => valorMes(this.anio(), this.mes()));

  // --- Resumen
  private readonly resumenResource = rxResource({
    params: () => ({ anio: this.anio(), mes: this.mes() }),
    stream: ({ params }) => this.economiaService.obtenerResumen(params.anio, params.mes),
  });
  protected readonly resumen = this.resumenResource.value;
  protected readonly cargandoResumen = this.resumenResource.isLoading;
  protected readonly errorResumen = this.resumenResource.error;

  private readonly periodosResource = rxResource({ stream: () => this.economiaService.obtenerPeriodos() });
  protected readonly periodos = this.periodosResource.value;

  protected readonly confirmandoCierre = signal(false);
  protected readonly cerrarAction = asyncAction(() => this.economiaService.cerrarMes(this.anio(), this.mes()), {
    onSuccess: () => {
      this.confirmandoCierre.set(false);
      this.resumenResource.reload();
      this.periodosResource.reload();
      this.autoresResource.reload();
    },
    defaultErrorMessage: 'No se ha podido cerrar el mes.',
  });

  protected readonly exportarAction = asyncAction(
    (tipo: 'Movimientos' | 'Liquidacion') => this.economiaService.exportar(tipo, this.anio(), this.mes()),
    {
      onSuccess: (respuesta, tipo) => {
        if (respuesta.body) {
          descargar(
            respuesta.body,
            nombreArchivoDescarga(respuesta.headers.get('Content-Disposition')) ?? `cliora-${tipo.toLowerCase()}.csv`,
          );
        }
      },
      defaultErrorMessage: 'No se ha podido exportar.',
    },
  );

  // --- Autores y pagos
  private readonly autoresResource = rxResource({
    params: () => (this.pestana() === 'autores' ? {} : undefined),
    stream: () => this.economiaService.obtenerAutores(),
  });
  protected readonly autores = this.autoresResource.value;
  private readonly pagosResource = rxResource({
    params: () => (this.pestana() === 'autores' ? {} : undefined),
    stream: () => this.economiaService.obtenerPagos(),
  });
  protected readonly pagos = this.pagosResource.value;

  protected readonly editandoContrato = signal<ContratoAutor | null>(null);
  protected readonly pagando = signal<ContratoAutor | null>(null);
  protected readonly errorFormulario = signal<string | null>(null);

  protected readonly guardarContratoAction = asyncAction(
    (autor: ContratoAutor, datos: Parameters<EconomiaService['guardarContrato']>[1]) =>
      this.economiaService.guardarContrato(autor.idAutor, datos),
    {
      onSuccess: () => {
        this.editandoContrato.set(null);
        this.autoresResource.reload();
      },
      defaultErrorMessage: 'No se ha podido guardar el contrato.',
    },
  );

  protected readonly registrarPagoAction = asyncAction(
    (autor: ContratoAutor, datos: Parameters<EconomiaService['registrarPago']>[1]) =>
      this.economiaService.registrarPago(autor.idAutor, datos),
    {
      onSuccess: () => {
        this.pagando.set(null);
        this.autoresResource.reload();
        this.pagosResource.reload();
      },
      defaultErrorMessage: 'No se ha podido registrar el pago.',
    },
  );

  // --- Lecturas
  protected readonly soloSospechosas = signal(false);
  private readonly lecturasResource = rxResource({
    params: () =>
      this.pestana() === 'lecturas' ? { anio: this.anio(), mes: this.mes(), solo: this.soloSospechosas() } : undefined,
    stream: ({ params }) => this.economiaService.obtenerLecturas(params.anio, params.mes, params.solo),
  });
  protected readonly lecturas = this.lecturasResource.value;
  protected readonly cargandoLecturas = this.lecturasResource.isLoading;
  protected readonly invalidando = signal<number | null>(null);

  protected readonly invalidarAction = asyncAction(
    (lectura: LecturaAdmin, motivo: string) => this.economiaService.invalidarLectura(lectura.idLectura, motivo || null),
    {
      onSuccess: () => {
        this.invalidando.set(null);
        this.lecturasResource.reload();
      },
      defaultErrorMessage: 'No se ha podido invalidar la lectura.',
    },
  );
  protected readonly revalidarAction = asyncAction(
    (lectura: LecturaAdmin) => this.economiaService.revalidarLectura(lectura.idLectura),
    { onSuccess: () => this.lecturasResource.reload(), defaultErrorMessage: 'No se ha podido revalidar la lectura.' },
  );

  // --- Duraciones
  private readonly duracionesResource = rxResource({
    params: () => (this.pestana() === 'duraciones' ? {} : undefined),
    stream: () => this.economiaService.obtenerDuraciones(),
  });
  protected readonly duraciones = this.duracionesResource.value;
  protected readonly cargandoDuraciones = this.duracionesResource.isLoading;
  protected readonly propuestas = signal<Record<number, PropuestaDuracion>>({});
  protected readonly guardadaDuracion = signal<number | null>(null);

  protected readonly proponerAction = asyncAction(
    (aventura: DuracionAventura) => this.economiaService.proponerDuracion(aventura.idAventura),
    {
      onSuccess: (propuesta, aventura) => this.propuestas.update((p) => ({ ...p, [aventura.idAventura]: propuesta })),
      defaultErrorMessage: 'No se ha podido calcular la duración.',
    },
  );
  protected readonly guardarDuracionAction = asyncAction(
    (aventura: DuracionAventura, minutos: number | null) => this.economiaService.guardarDuracion(aventura.idAventura, minutos),
    {
      onSuccess: (_, aventura) => {
        this.guardadaDuracion.set(aventura.idAventura);
        this.duracionesResource.reload();
      },
      defaultErrorMessage: 'No se ha podido guardar la duración.',
    },
  );

  protected nombreCategoria(categoria: Categoria): string {
    return NOMBRE_CATEGORIA[categoria];
  }

  protected nombreMotivo(lectura: LecturaAdmin): string {
    if (lectura.estado === EstadoLectura.Invalidada) {
      return `Invalidada${lectura.motivoInvalidacion ? ': ' + lectura.motivoInvalidacion : ''}`;
    }
    return lectura.estado === EstadoLectura.Valida ? 'Válida' : NOMBRE_MOTIVO[lectura.motivo];
  }

  protected esSuscripcion(c: CategoriaEconomica): boolean {
    return c.categoria !== Categoria.Adulto;
  }

  protected onMesChange(evento: Event): void {
    const mes = leerMes((evento.target as HTMLInputElement).value);
    if (mes) {
      this.anio.set(mes.anio);
      this.mes.set(mes.mes);
      this.confirmandoCierre.set(false);
      this.cerrarAction.reset();
    }
  }

  protected irAMes(anio: number, mes: number): void {
    this.anio.set(anio);
    this.mes.set(mes);
    this.pestana.set('resumen');
  }

  protected onSoloSospechosas(evento: Event): void {
    this.soloSospechosas.set((evento.target as HTMLInputElement).checked);
  }

  protected abrirContrato(autor: ContratoAutor): void {
    this.errorFormulario.set(null);
    this.pagando.set(null);
    this.editandoContrato.set(autor);
  }

  protected abrirPago(autor: ContratoAutor): void {
    this.errorFormulario.set(null);
    this.editandoContrato.set(null);
    this.pagando.set(autor);
  }

  protected guardarContrato(
    autor: ContratoAutor,
    adulto: string,
    iva: string,
    irpf: string,
    esCliora: boolean,
    nombreFiscal: string,
    nif: string,
    notas: string,
  ): void {
    const porcentajes = [leerNumero(adulto), leerNumero(iva), leerNumero(irpf)];
    if (porcentajes.some((p) => p === null || p > 100)) {
      this.errorFormulario.set('Los porcentajes deben ser números entre 0 y 100.');
      return;
    }
    this.errorFormulario.set(null);
    this.guardarContratoAction.run(autor, {
      porcentajeAdulto: porcentajes[0]!,
      porcentajeIva: porcentajes[1]!,
      porcentajeIrpf: porcentajes[2]!,
      esCliora,
      nombreFiscal: nombreFiscal.trim() || null,
      nif: nif.trim() || null,
      notas: notas.trim() || null,
    });
  }

  protected registrarPago(autor: ContratoAutor, importe: string, fecha: string, referencia: string, notas: string): void {
    const valor = leerNumero(importe);
    if (valor === null || valor <= 0) {
      this.errorFormulario.set('Escribe el importe que se descuenta del saldo (por ejemplo 25,50).');
      return;
    }
    this.errorFormulario.set(null);
    this.registrarPagoAction.run(autor, {
      importe: Math.round(valor * 100) / 100,
      fecha: fecha ? new Date(fecha + 'T12:00:00Z').toISOString() : null,
      referencia: referencia.trim() || null,
      notas: notas.trim() || null,
    });
  }

  /** IVA, IRPF y transferencia que saldrían con el importe escrito (orientativo, lo calcula el servidor). */
  protected previsionPago(autor: ContratoAutor, importe: string): string {
    const valor = leerNumero(importe);
    if (valor === null) {
      return '';
    }
    const iva = (valor * autor.porcentajeIva) / 100;
    const irpf = (valor * autor.porcentajeIrpf) / 100;
    return `IVA ${euros(iva)} · IRPF ${euros(irpf)} · a transferir ${euros(valor + iva - irpf)}`;
  }

  protected guardarDuracion(aventura: DuracionAventura, texto: string): void {
    const minutos = leerNumero(texto);
    if (minutos === null || minutos < 1 || !Number.isInteger(minutos)) {
      this.errorFormulario.set(`${aventura.titulo}: escribe los minutos (un número entero).`);
      return;
    }
    this.errorFormulario.set(null);
    this.guardadaDuracion.set(null);
    this.guardarDuracionAction.run(aventura, minutos);
  }
}
