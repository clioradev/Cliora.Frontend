import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { AdminService } from '../../data-access/admin.service';
import { CatTipoUniversoAdmin } from '../../models/admin.model';

@Component({
  selector: 'app-tipos-universo',
  imports: [ReactiveFormsModule, IconoComponent],
  templateUrl: './tipos-universo.component.html',
  styleUrl: './tipos-universo.component.scss',
})
export class TiposUniversoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);

  private readonly tiposResource = rxResource({
    stream: () => this.adminService.obtenerTiposUniverso(),
    defaultValue: [] as CatTipoUniversoAdmin[],
  });
  protected readonly tipos = this.tiposResource.value;
  protected readonly cargando = this.tiposResource.isLoading;

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: [''],
  });

  private readonly crearAction = asyncAction(
    (nombre: string, descripcion: string | null) => this.adminService.crearTipoUniverso({ nombre, descripcion }),
    {
      onSuccess: () => {
        this.form.reset();
        this.tiposResource.reload();
      },
      defaultErrorMessage: 'No se ha podido crear el tipo de universo.',
    },
  );
  protected readonly creando = this.crearAction.loading;
  protected readonly errorCrear = this.crearAction.error;

  protected crear(): void {
    if (this.form.invalid) {
      return;
    }

    const { nombre, descripcion } = this.form.getRawValue();
    this.crearAction.run(nombre.trim(), descripcion.trim() || null);
  }

  protected readonly filaEnCurso = signal<number | null>(null);

  private readonly subirImagenAction = asyncAction(
    (tipo: CatTipoUniversoAdmin, archivo: File) => this.adminService.subirImagenTipoUniverso(tipo.id, archivo),
    {
      onSuccess: () => {
        this.filaEnCurso.set(null);
        this.tiposResource.reload();
      },
      onError: () => this.filaEnCurso.set(null),
      defaultErrorMessage: 'No se ha podido subir la imagen.',
    },
  );
  protected readonly subiendoImagen = this.subirImagenAction.loading;
  protected readonly errorImagen = this.subirImagenAction.error;

  protected seleccionarImagen(tipo: CatTipoUniversoAdmin, files: FileList | null): void {
    const archivo = files?.[0];
    if (archivo) {
      this.filaEnCurso.set(tipo.id);
      this.subirImagenAction.run(tipo, archivo);
    }
  }

  protected filaEnCursoDe(tipo: CatTipoUniversoAdmin): boolean {
    return this.filaEnCurso() === tipo.id && this.subiendoImagen();
  }
}
