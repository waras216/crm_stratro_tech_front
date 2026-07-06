import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotifyService } from '../../../core/services/notify.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="notify.confirmRequest() as req">
      <div class="fixed inset-0 bg-black/45 backdrop-blur-sm z-[210]" (click)="respond(false)"></div>
      <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[92%] max-w-sm z-[211] shadow-modal modal-in p-6">
        <div class="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold mb-4"
          [ngClass]="req.danger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'">
          {{ req.danger ? '⚠' : '?' }}
        </div>
        <p class="text-base font-bold text-slate-800 m-0">{{ req.title ?? (req.danger ? 'Confirmar acción' : 'Confirmar') }}</p>
        <p class="text-sm text-slate-500 m-0 mt-2 leading-relaxed">{{ req.message }}</p>
        <div class="flex gap-2 mt-6">
          <button (click)="respond(false)"
            class="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            {{ req.cancelText ?? 'Cancelar' }}
          </button>
          <button (click)="respond(true)"
            class="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-colors"
            [ngClass]="req.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'">
            {{ req.confirmText ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </ng-container>
  `,
})
export class ConfirmDialogComponent {
  constructor(public notify: NotifyService) {}
  respond(value: boolean) { this.notify.respondConfirm(value); }
}
