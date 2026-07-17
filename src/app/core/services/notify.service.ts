import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  removing?: boolean;
}

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ConfirmRequest extends ConfirmOptions {
  message: string;
}

const DEFAULT_TITLES: Record<ToastType, string> = {
  success: 'Listo',
  error: 'Ocurrió un error',
  info: 'Información',
  warning: 'Atención',
};

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private nextId = 1;
  private resolveConfirmFn: ((value: boolean) => void) | null = null;

  readonly toasts = signal<Toast[]>([]);
  readonly confirmRequest = signal<ConfirmRequest | null>(null);

  private push(type: ToastType, message: string, title?: string, duration = 4500): number {
    const toast: Toast = { id: this.nextId++, type, message, title: title ?? DEFAULT_TITLES[type] };
    this.toasts.update(list => [...list, toast]);
    if (duration > 0) setTimeout(() => this.dismiss(toast.id), duration);
    return toast.id;
  }

  success(message: string, title?: string): number { return this.push('success', message, title); }
  error(message: string, title?: string): number { return this.push('error', message, title, 6500); }
  info(message: string, title?: string): number { return this.push('info', message, title); }
  warning(message: string, title?: string): number { return this.push('warning', message, title, 5500); }

  dismiss(id: number) {
    this.toasts.update(list => list.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      this.toasts.update(list => list.filter(t => t.id !== id));
    }, 250);
  }

  /** Reemplazo de `window.confirm` con un diálogo propio; resuelve a true/false. */
  confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise(resolve => {
      this.resolveConfirmFn = resolve;
      this.confirmRequest.set({ message, ...options });
    });
  }

  respondConfirm(value: boolean) {
    this.confirmRequest.set(null);
    this.resolveConfirmFn?.(value);
    this.resolveConfirmFn = null;
  }
}
