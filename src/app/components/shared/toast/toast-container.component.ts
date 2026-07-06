import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotifyService, ToastType } from '../../../core/services/notify.service';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const STYLES: Record<ToastType, { bg: string; ring: string; icon: string; bar: string }> = {
  success: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', icon: 'bg-emerald-500', bar: 'bg-emerald-400' },
  error:   { bg: 'bg-red-50',     ring: 'ring-red-200',     icon: 'bg-red-500',     bar: 'bg-red-400' },
  info:    { bg: 'bg-indigo-50',  ring: 'ring-indigo-200',  icon: 'bg-indigo-500',  bar: 'bg-indigo-400' },
  warning: { bg: 'bg-amber-50',   ring: 'ring-amber-200',   icon: 'bg-amber-500',   bar: 'bg-amber-400' },
};

const DURATIONS: Record<ToastType, number> = { success: 4.5, info: 4.5, warning: 5.5, error: 6.5 };

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 w-[min(92vw,360px)] pointer-events-none">
      <div *ngFor="let t of notify.toasts()"
        class="toast-in pointer-events-auto relative overflow-hidden rounded-2xl shadow-modal ring-1 flex items-start gap-3 p-3.5"
        [ngClass]="[styles(t.type).bg, styles(t.type).ring]">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          [ngClass]="styles(t.type).icon">{{ icon(t.type) }}</div>
        <div class="min-w-0 flex-1 pr-2">
          <p class="text-sm font-bold text-slate-800 m-0">{{ t.title }}</p>
          <p class="text-xs text-slate-600 m-0 mt-0.5 break-words">{{ t.message }}</p>
        </div>
        <button (click)="notify.dismiss(t.id)"
          class="text-slate-400 hover:text-slate-700 transition-colors text-sm leading-none flex-shrink-0 -mt-0.5">✕</button>
        <div class="absolute bottom-0 left-0 h-0.5 toast-bar" [ngClass]="styles(t.type).bar"
          [style.animation-duration.s]="duration(t.type)"></div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(24px) scale(.96); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastBar {
      from { width: 100%; }
      to   { width: 0%; }
    }
    .toast-in { animation: toastIn .3s cubic-bezier(.16,1,.3,1) both; }
    .toast-bar { animation: toastBar linear forwards; }
  `],
})
export class ToastContainerComponent {
  constructor(public notify: NotifyService) {}
  icon(type: ToastType) { return ICONS[type]; }
  styles(type: ToastType) { return STYLES[type]; }
  duration(type: ToastType) { return DURATIONS[type]; }
}
