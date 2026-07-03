import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { MarketingCampana, Cliente } from '../../../models/crm.models';

@Component({ selector: 'app-marketing', standalone: false, templateUrl: './marketing.component.html', styleUrls: ['./marketing.component.scss'] })
export class MarketingComponent implements OnInit {
  campanas: MarketingCampana[] = [];
  clientes: Cliente[] = [];
  search = ''; dialogOpen = false; editingCamp: MarketingCampana | null = null; expandedCamp: number | null = null;
  cargando = false;

  estadoColors: Record<string, string> = { activa: 'badge-green', pausada: 'badge-amber', finalizada: 'badge-slate' };
  form: { nombre_compania: string; segmento: string; estado: string; fecha_inicio: string; id_clientes: number[] } =
    { nombre_compania: '', segmento: '', estado: 'activa', fecha_inicio: '', id_clientes: [] };

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
    this.crm.cargarClientes().subscribe({ next: res => { this.clientes = res.data ?? []; this.cdr.detectChanges(); } });
  }

  cargar() {
    this.cargando = true;
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

  resetForm() { this.form = { nombre_compania: '', segmento: '', estado: 'activa', fecha_inicio: '', id_clientes: [] }; this.editingCamp = null; }
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
    this.dialogOpen = true;
  }

  toggleCliente(id: number) {
    const i = this.form.id_clientes.indexOf(id);
    if (i > -1) this.form.id_clientes.splice(i, 1); else this.form.id_clientes.push(id);
  }

  handleSubmit() {
    if (!this.form.nombre_compania || !this.form.segmento) return;
    const data = { ...this.form, fecha_inicio: this.form.fecha_inicio || new Date().toISOString().split('T')[0] };
    const obs = this.editingCamp
      ? this.crm.updateCampana(this.editingCamp.id, data)
      : this.crm.addCampana(data);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  deleteCampana(id: number) { this.crm.deleteCampana(id).subscribe(() => this.cargar()); }
  toggleExpanded(id: number) { this.expandedCamp = this.expandedCamp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
