import { Component } from '@angular/core';

@Component({
  selector: 'app-erp-crm',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <h2 class="m-0 text-lg font-bold text-slate-800">CRM - Relaciones con Clientes</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">Contactos</p><p class="text-2xl font-bold text-indigo-600 m-0">320</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Oportunidades</p><p class="text-2xl font-bold text-amber-600 m-0">18</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3"><p class="text-xs text-slate-500 m-0">Tickets Abiertos</p><p class="text-2xl font-bold text-red-500 m-0">7</p></div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 scale-in delay-3">
        <h3 class="text-sm font-bold text-slate-700 m-0 mb-4">Interacciones Recientes</h3>
        <div class="flex flex-col gap-3">
          <div *ngFor="let i of interacciones" class="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{{ i.cliente.charAt(0) }}</div>
            <div class="flex-1"><p class="text-sm font-medium text-slate-700 m-0">{{ i.cliente }}</p><p class="text-[10px] text-slate-400 m-0">{{ i.tipo }} - {{ i.asunto }}</p></div>
            <span class="text-[10px] text-slate-400">{{ i.fecha }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ErpCrmComponent {
  interacciones = [
    { cliente: 'TechCorp SA', tipo: 'Llamada', asunto: 'Seguimiento propuesta', fecha: 'Hoy 14:30' },
    { cliente: 'Retail Plus', tipo: 'Email', asunto: 'Cotización enviada', fecha: 'Hoy 10:15' },
    { cliente: 'Innovatech', tipo: 'Reunión', asunto: 'Demo producto', fecha: 'Ayer' },
    { cliente: 'Global Foods', tipo: 'Ticket', asunto: 'Soporte técnico', fecha: 'Hace 2 días' },
  ];
}
