import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpEnvio } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-scm',
  standalone: false,
  templateUrl: './scm.component.html',
  styleUrls: ['./scm.component.scss'],
  animations: [modalLeave],
})
export class ErpScmComponent implements OnInit {
  envios: ErpEnvio[] = [];
  cargando = true;

  dialogOpen = false;
  saving = false;
  error = '';
  form = { destino: '', transportista: '', eta: '' };

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarEnvios().subscribe();
    this.erpService.envios$.subscribe(data => { this.envios = data; this.cargando = false; this.cdr.detectChanges(); });
  }

  get enTransito() { return this.envios.filter(e => e.estado === 'en_transito'); }
  get entregados() { return this.envios.filter(e => e.estado === 'entregado').length; }

  openNew() {
    this.form = { destino: '', transportista: '', eta: '' };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.destino || !this.form.transportista) { this.error = 'Destino y transportista son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addEnvio({
      destino: this.form.destino,
      transportista: this.form.transportista,
      eta: this.form.eta || 'Por confirmar',
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el envío. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  marcarEntregado(id: number) {
    this.erpService.updateEnvio(id, { estado: 'entregado' }).subscribe({
      next: () => this.cdr.detectChanges(),
      error: (err) => console.error(err),
    });
  }

  async eliminar(envio: ErpEnvio) {
    const ok = await this.notify.confirm(`¿Eliminar el envío a "${envio.destino}"? Podrás restaurarlo desde la papelera.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteEnvio(envio.id).subscribe({
      next: () => { this.notify.success('Envío eliminado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar el envío'); console.error(err); },
    });
  }

  papeleraOpen = false;
  papelera: ErpEnvio[] = [];

  abrirPapelera() {
    this.papeleraOpen = true;
    this.erpService.cargarPapeleraEnvios().subscribe(data => { this.papelera = data; this.cdr.detectChanges(); });
  }

  restaurar(id: number) {
    this.erpService.restaurarEnvio(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(e => e.id !== id); this.notify.success('Envío restaurado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo restaurar el envío'); console.error(err); },
    });
  }
}
