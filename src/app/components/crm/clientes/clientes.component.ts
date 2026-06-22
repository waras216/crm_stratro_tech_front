import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { Cliente } from '../../../models/crm.models';

@Component({ selector: 'app-clientes', standalone: false, templateUrl: './clientes.component.html', styleUrls: ['./clientes.component.scss'] })
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  search = ''; filterTipo = 'todos'; dialogOpen = false; editingCliente: Cliente | null = null;
  cargando = false;

  sectorOptions = ['Tecnología', 'Software', 'Fintech', 'Consultoría', 'Retail', 'Salud', 'Educación', 'Manufactura', 'Freelance', 'Otro'];
  form = { nombre: '', telefono: '', email: '', direccion: '', sector_empresarial: 'Tecnología', tipo: 'empresa' as Cliente['tipo'] };

  constructor(private crm: CrmService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.crm.cargarClientes().subscribe({
      next: res => { this.clientes = res.data ?? []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  get filtered() {
    return this.clientes.filter(c => {
      const ms = c.nombre.toLowerCase().includes(this.search.toLowerCase()) ||
                 (c.email ?? '').toLowerCase().includes(this.search.toLowerCase());
      return ms && (this.filterTipo === 'todos' || c.tipo === this.filterTipo);
    });
  }

  resetForm() { this.form = { nombre: '', telefono: '', email: '', direccion: '', sector_empresarial: 'Tecnología', tipo: 'empresa' }; this.editingCliente = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(c: Cliente) {
    this.editingCliente = c;
    this.form = { nombre: c.nombre, telefono: c.telefono ?? '', email: c.email ?? '', direccion: c.direccion ?? '', sector_empresarial: c.sector_empresarial ?? '', tipo: c.tipo };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre) return;
    const obs = this.editingCliente
      ? this.crm.updateCliente(this.editingCliente.id_cliente, this.form)
      : this.crm.addCliente(this.form);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  deleteCliente(id: number) { this.crm.deleteCliente(id).subscribe(() => this.cargar()); }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
