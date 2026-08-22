import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotifyService } from '../../../core/services/notify.service';
import { modalLeave } from '../animations';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  animations: [modalLeave],
  template: `
    <ng-container *ngIf="notify.confirmRequest() as req">
      <div class="backdrop-fade fixed inset-0 bg-black/45 backdrop-blur-sm z-[210]" (click)="respond(false)"></div>
      <div [@modalLeave] class="modal-in fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[92%] max-w-sm z-[211] shadow-modal p-6">
        <div class="icon-badge w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold mb-4"
          [ngClass]="[req.danger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600', req.danger ? 'icon-danger-pulse' : '']">
          {{ req.danger ? '⚠' : '?' }}
        </div>
        <p class="text-base font-bold text-slate-800 m-0">{{ req.title ?? (req.danger ? 'Confirmar acción' : 'Confirmar') }}</p>
        <p class="text-sm text-slate-500 m-0 mt-2 leading-relaxed">{{ req.message }}</p>
        <div class="flex gap-2 mt-6">
          <button (click)="respond(false)"
            class="btn-dialog flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            {{ req.cancelText ?? 'Cancelar' }}
          </button>
          <button (click)="respond(true)"
            class="btn-dialog flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-colors"
            [ngClass]="req.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'">
            {{ req.confirmText ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    @keyframes backdropFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalPop {
      from { opacity: 0; transform: translate(-50%, -46%) scale(.9); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes iconPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,.35); }
      50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(220,38,38,0); }
    }
    .backdrop-fade { animation: backdropFade .2s ease both; }
    .modal-in { animation: modalPop .3s cubic-bezier(.34,1.56,.64,1) both; }
    .icon-badge { transition: transform .2s ease; }
    .icon-danger-pulse { animation: iconPulse 1.6s ease-in-out .3s infinite; }
    .btn-dialog { transition: transform .15s ease, box-shadow .15s ease; }
    .btn-dialog:hover { transform: translateY(-1px); }
    .btn-dialog:active { transform: translateY(0) scale(.97); }
  `],
})
export class ConfirmDialogComponent {
  constructor(public notify: NotifyService) {}
  respond(value: boolean) { this.notify.respondConfirm(value); }
}
