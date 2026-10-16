import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { LectorVozService } from '../../../../core/voz/lector-voz.service';
import { interpretarOrden } from '../../../../core/voz/ordenes-voz';
import { ReconocimientoVozService } from '../../../../core/voz/reconocimiento-voz.service';
import { PreferenciasAplicadasService } from '../../../configuracion/data-access/preferencias-aplicadas.service';
import { AdminService } from '../../../admin/data-access/admin.service';
import { AutorService } from '../../../autor/data-access/autor.service';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { PartidaService } from '../../data-access/partida.service';

@Component({
  selector: 'app-final',
  imports: [ValoracionModalComponent],
  templateUrl: './final.component.html',
  styleUrl: './final.component.scss',
})
export class FinalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);
  private readonly autorService = inject(AutorService);
  private readonly adminService = inject(AdminService);

  private readonly idFinal = Number(this.route.snapshot.paramMap.get('idFinal'));

  protected readonly preview = this.route.snapshot.queryParamMap.get('preview') === 'true';
  private readonly idAventuraQuery = this.route.snapshot.queryParamMap.get('idAventura');
  private readonly esAdmin = this.route.snapshot.queryParamMap.get('admin') === 'true';
  private readonly idVersionAventuraQuery = this.route.snapshot.queryParamMap.get('idVersionAventura');

  private readonly finalResource = rxResource({
    stream: () => this.partidaService.getFinal(this.idFinal),
  });
  protected readonly final = this.finalResource.value;
  protected readonly loading = this.finalResource.isLoading;
  protected readonly error = computed(() => this.finalResource.error() !== undefined);

  protected readonly idAventuraFinalizada = signal<number | null>(null);
  protected readonly previsualizacionTerminada = signal(false);

  // Igual que en la partida: con lectura automática o manos libres se lee el final a los 2 s y, en
  // manos libres, se escucha «Finalizar».
  protected readonly lector = inject(LectorVozService);
  protected readonly reconocimiento = inject(ReconocimientoVozService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);
  private temporizadorLectura: ReturnType<typeof setTimeout> | undefined;

  private readonly manosLibres = computed(
    () => this.preferenciasAplicadas.manosLibres() && this.lector.disponible && this.reconocimiento.disponible,
  );

  constructor() {
    effect(() => {
      const final = this.final();
      untracked(() => {
        if (final && (this.preferenciasAplicadas.lecturaAutomatica() || this.manosLibres())) {
          this.temporizadorLectura = setTimeout(() => this.leerFinal(), 2000);
        }
      });
    });

    inject(DestroyRef).onDestroy(() => this.pararLectura());
  }

  protected leerFinal(): void {
    this.pararLectura();
    const final = this.final();
    if (!final) {
      return;
    }

    const manosLibres = this.manosLibres();
    const parrafos = [final.texto];
    if (manosLibres) {
      parrafos.push('Di finalizar para terminar la aventura.');
    }
    this.lector.leer(parrafos, () => {
      if (manosLibres) {
        this.reconocimiento.escuchar((alternativas) => {
          const orden = interpretarOrden(alternativas);
          if (orden?.tipo === 'finalizar' || orden?.tipo === 'continuar') {
            this.finalizarAventura();
          } else if (orden?.tipo === 'repetir') {
            this.leerFinal();
          }
        });
      }
    });
  }

  private pararLectura(): void {
    clearTimeout(this.temporizadorLectura);
    this.lector.parar();
    this.reconocimiento.detener();
  }

  private readonly finalizarAction = asyncAction(() => this.partidaService.finalizarAventura(this.idFinal), {
    onSuccess: (respuesta) => {
      if (this.preview) {
        this.previsualizacionTerminada.set(true);
      } else {
        this.idAventuraFinalizada.set(respuesta.idAventura);
      }
      this.pararLectura();
      if (this.manosLibres()) {
        this.lector.leer([this.preview ? 'Previsualización terminada.' : 'Aventura terminada. Puedes valorarla en la pantalla.']);
      }
    },
    defaultErrorMessage: 'No se ha podido finalizar la aventura.',
  });
  protected readonly finalizando = this.finalizarAction.loading;
  protected readonly finalizarError = this.finalizarAction.error;

  protected finalizarAventura(): void {
    this.finalizarAction.run();
  }

  protected onValoracionCerrada(): void {
    void this.router.navigate(['/']);
  }

  protected volverAlEditor(): void {
    if (this.esAdmin) {
      if (!this.idVersionAventuraQuery) {
        return;
      }
      const idVersionAventura = Number(this.idVersionAventuraQuery);
      this.adminService.detenerPrevisualizacionVersion(idVersionAventura).subscribe();
      void this.router.navigate(['/admin/aventuras']);
      return;
    }

    if (!this.idAventuraQuery) {
      return;
    }
    const idAventura = Number(this.idAventuraQuery);
    this.autorService.detenerPrevisualizacion(idAventura).subscribe();
    void this.router.navigate(['/autor/aventura', idAventura], { queryParams: { tab: 'contenido' } });
  }
}
