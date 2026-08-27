import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { MarketingCampana, Cliente } from '../../../models/crm.models';

@Component({ selector: 'app-marketing', standalone: false, templateUrl: './marketing.component.html', styleUrls: ['./marketing.component.scss'] })
export class MarketingComponent implements OnInit {
  campanas: MarketingCampana[] = [];
  clientes: Cliente[] = [];
  search = ''; dialogOpen = false; editingCamp: MarketingCampana | null = null; expandedCamp: number | null = null;
  cargando = false;
  formError = '';

  estadoColors: Record<string, string> = { activa: 'badge-green', pausada: 'badge-amber', finalizada: 'badge-slate' };
  form: { nombre_compania: string; segmento: string; estado: string; fecha_inicio: string; id_clientes: number[] } =
    { nombre_compania: '', segmento: '', estado: 'activa', fecha_inicio: '', id_clientes: [] };

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private notify: NotifyService) {}

  ngOnInit() {
    this.cargar();
    this.crm.cargarClientes().subscribe({ next: res => { this.clientes = res.data ?? []; this.cdr.detectChanges(); } });
  }

  cargar() {
    this.cargando = true;
    // Flush inmediato: si "cargando" queda en `true` sin pasar por un chequeo de Angular,
    // un signal-write ajeno (p. ej. un toast) puede disparar un chequeo global que lo agarra
    // en ese estado transitorio nunca visto antes, y Angular tira NG0100 en modo dev.
    this.cdr.detectChanges();
    this.crm.cargarCampanas().subscribe({
      next: res => { this.campanas = res.data ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  get filtered() {
    return this.campanas.filter(c =>
      c.nombre_compania.toLowerCase().includes(this.search.toLowerCase()) ||
      c.segmento.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  // Selección en bloque
  selectedIds = new Set<number>();
  get allSelected() { return this.filtered.length > 0 && this.filtered.every(c => this.selectedIds.has(c.id)); }
  get bulkLabel() { const n = this.selectedIds.size; return `${n} campaña${n === 1 ? '' : 's'} seleccionada${n === 1 ? '' : 's'}`; }

  toggleSelect(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
  }

  toggleSelectAll() {
    if (this.allSelected) this.selectedIds.clear();
    else this.filtered.forEach(c => this.selectedIds.add(c.id));
  }

  clearSelection() { this.selectedIds.clear(); }

  async bulkDelete() {
    const n = this.selectedIds.size;
    const ok = await this.notify.confirm(`¿Eliminar ${n} campaña${n === 1 ? '' : 's'}? Esta acción no se puede deshacer.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    forkJoin(Array.from(this.selectedIds).map(id => this.crm.deleteCampana(id))).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.cdr.detectChanges();
        this.cargar();
        this.notify.success(`${n} campaña${n === 1 ? '' : 's'} eliminada${n === 1 ? '' : 's'}`);
      },
      error: () => this.notify.error('No se pudieron eliminar algunas campañas'),
    });
  }

  resetForm() { this.form = { nombre_compania: '', segmento: '', estado: 'activa', fecha_inicio: '', id_clientes: [] }; this.editingCamp = null; this.formError = ''; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(camp: MarketingCampana) {
    this.editingCamp = camp;
    this.form = {
      nombre_compania: camp.nombre_compania,
      segmento: camp.segmento,
      estado: camp.estado ?? 'activa',
      fecha_inicio: camp.fecha_inicio ?? '',
      id_clientes: (camp.clientes ?? []).map(c => c.id_cliente),
    };
    this.formError = '';
    this.dialogOpen = true;
  }

  toggleCliente(id: number) {
    const i = this.form.id_clientes.indexOf(id);
    if (i > -1) this.form.id_clientes.splice(i, 1); else this.form.id_clientes.push(id);
  }

  handleSubmit() {
    if (!this.form.nombre_compania.trim()) { this.formError = 'El nombre de la campaña es obligatorio.'; return; }
    if (!this.form.segmento.trim())        { this.formError = 'El segmento es obligatorio.'; return; }
    const data = { ...this.form, fecha_inicio: this.form.fecha_inicio || new Date().toISOString().split('T')[0] };
    const obs = this.editingCamp
      ? this.crm.updateCampana(this.editingCamp.id, data)
      : this.crm.addCampana(data);
    obs.subscribe({
      next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); },
      error: err => { this.formError = err.error?.message ?? 'Error al guardar la campaña'; this.cdr.detectChanges(); },
    });
  }

  async deleteCampana(id: number) {
    const ok = await this.notify.confirm('¿Eliminar esta campaña? Esta acción no se puede deshacer.', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deleteCampana(id).subscribe({
      next: () => { this.cargar(); this.notify.success('Campaña eliminada'); },
      error: () => this.notify.error('No se pudo eliminar la campaña'),
    });
  }

  toggleExpanded(id: number) { this.expandedCamp = this.expandedCamp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
