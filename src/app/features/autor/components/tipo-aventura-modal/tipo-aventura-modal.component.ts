import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { InformeImportacion } from '../../models/autor.model';

@Component({
  selector: 'app-tipo-aventura-modal',
  imports: [ModalComponent],
  templateUrl: './tipo-aventura-modal.component.html',
  styleUrl: './tipo-aventura-modal.component.scss',
})
export class TipoAventuraModalComponent {
  private readonly autorService = inject(AutorService);

  /** Campaña sobre la que se crea la aventura (tanto manual como importada). */
  readonly idCampana = input.required<number>();

  readonly cerrado = output<void>();
  readonly elegido = output<boolean>();
  readonly importado = output<InformeImportacion>();

  private readonly inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');

  /** Informe de la última importación intentada (exito=false incluye sus errores). */
  protected readonly informe = signal<InformeImportacion | null>(null);

  protected elegir(esLibro: boolean): void {
    this.elegido.emit(esLibro);
  }

  protected abrirSelectorArchivo(): void {
    this.inputArchivo()?.nativeElement.click();
  }

  private readonly importarAction = asyncAction((archivo: File) => this.autorService.importarAventura(this.idCampana(), archivo), {
    onSuccess: (informeRecibido) => {
      this.informe.set(informeRecibido);
      if (informeRecibido.exito) {
        this.importado.emit(informeRecibido);
      }
    },
    defaultErrorMessage: 'No se ha podido importar el paquete.',
  });
  protected readonly importando = this.importarAction.loading;
  protected readonly errorImportar = this.importarAction.error;

  protected seleccionarArchivo(files: FileList | null): void {
    const archivo = files?.[0];
    if (!archivo) {
      return;
    }
    this.informe.set(null);
    this.importarAction.run(archivo);
    // Permite volver a elegir el mismo archivo tras un intento fallido sin recargar la página.
    const input = this.inputArchivo()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }
}
