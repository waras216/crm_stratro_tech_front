import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { Cliente, Contacto } from '../../../models/crm.models';

@Component({ selector: 'app-clientes', standalone: false, templateUrl: './clientes.component.html', styleUrls: ['./clientes.component.scss'] })
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  search = ''; filterTipo = 'todos'; dialogOpen = false; editingCliente: Cliente | null = null;
  cargando = false;

  sectorOptions = ['Tecnología', 'Software', 'Fintech', 'Consultoría', 'Retail', 'Salud', 'Educación', 'Manufactura', 'Freelance', 'Otro'];
  form = { nombre: '', telefono: '', email: '', direccion: '', sector_empresarial: 'Tecnología', tipo: 'empresa' as Cliente['tipo'] };

  // Detalle de cliente
  detalleOpen = false;
  detalleCargando = false;
  clienteDetalle: Cliente | null = null;
  detalleTab: 'leads' | 'oportunidades' | 'actividades' | 'contactos' = 'leads';

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.crm.cargarClientes().subscribe({
      next: res => { this.clientes = res.data ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
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

  abrirDetalle(c: Cliente) {
    this.detalleOpen = true;
    this.detalleCargando = true;
    this.clienteDetalle = null;
    this.detalleTab = 'leads';
    this.crm.verCliente(c.id_cliente).subscribe({
      next: res => { this.clienteDetalle = res; this.detalleCargando = false; this.cdr.detectChanges(); },
      error: () => { this.detalleCargando = false; this.cdr.detectChanges(); },
    });
  }

  cerrarDetalle() { this.detalleOpen = false; this.clienteDetalle = null; }

  private refrescarDetalle() {
    if (!this.clienteDetalle) return;
    this.crm.verCliente(this.clienteDetalle.id_cliente).subscribe({
      next: res => { this.clienteDetalle = res; this.cdr.detectChanges(); },
    });
  }

  // Contactos (dentro del detalle de cliente)
  contactoDialogOpen = false;
  editingContacto: Contacto | null = null;
  contactoForm = { nombre: '', apellido_p: '', email: '', telefono: '', cargo: '', principal: false };

  resetContactoForm() {
    this.contactoForm = { nombre: '', apellido_p: '', email: '', telefono: '', cargo: '', principal: false };
    this.editingContacto = null;
  }

  openNewContacto() { this.resetContactoForm(); this.contactoDialogOpen = true; }

  handleEditContacto(ct: Contacto) {
    this.editingContacto = ct;
    this.contactoForm = {
      nombre: ct.nombre, apellido_p: ct.apellido_p ?? '', email: ct.email ?? '',
      telefono: ct.telefono ?? '', cargo: ct.cargo ?? '', principal: !!ct.principal,
    };
    this.contactoDialogOpen = true;
  }

  handleSubmitContacto() {
    if (!this.contactoForm.nombre || !this.clienteDetalle) return;
    const obs = this.editingContacto
      ? this.crm.updateContacto(this.editingContacto.id_contacto, this.contactoForm)
      : this.crm.addContacto({ ...this.contactoForm, id_cliente: this.clienteDetalle.id_cliente });
    obs.subscribe({ next: () => { this.contactoDialogOpen = false; this.resetContactoForm(); this.refrescarDetalle(); } });
  }

  deleteContacto(id: number) { this.crm.deleteContacto(id).subscribe(() => this.refrescarDetalle()); }
  closeContactoDialog() { this.contactoDialogOpen = false; this.resetContactoForm(); }
}
