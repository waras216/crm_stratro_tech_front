import { trigger, transition, style, animate, query, group } from '@angular/animations';

/**
 * Salida (fade + scale-down) para modales/paneles que usan `.modal-in` en la entrada.
 * Reusa la curva de `modalIn` en styles.scss. Angular la dispara automáticamente
 * cuando el elemento con este trigger es removido por *ngIf.
 */
export const modalLeave = trigger('modalLeave', [
  transition(':leave', [
    animate('180ms cubic-bezier(.16,1,.3,1)', style({ opacity: 0, transform: 'translate(-50%, -50%) scale(0.96)' })),
  ]),
]);

/** Igual que modalLeave pero sin el translate de centrado (paneles no centrados). */
export const panelLeave = trigger('panelLeave', [
  transition(':leave', [
    animate('180ms cubic-bezier(.16,1,.3,1)', style({ opacity: 0, transform: 'scale(0.96)' })),
  ]),
]);

/** Salida para dropdowns/menús que usan `.dropdown-enter` en la entrada. */
export const dropdownLeave = trigger('dropdownLeave', [
  transition(':leave', [
    animate('150ms cubic-bezier(.4,0,.2,1)', style({ opacity: 0, transform: 'scale(0.96) translateY(-4px)' })),
  ]),
]);

/** Salida para el sidebar mobile (`.sidebar-fade` en la entrada). */
export const sidebarLeave = trigger('sidebarLeave', [
  transition(':leave', [
    animate('180ms cubic-bezier(.4,0,.2,1)', style({ opacity: 0 })),
  ]),
]);

/**
 * Fade simple para el <router-outlet> del shell. Reusa el timing de `.fade-up`.
 * Conservador a propósito: solo opacidad, sin desplazamiento ni animación
 * de layout, para no interferir con guards ni con el flujo de navegación.
 */
export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('200ms cubic-bezier(.22,1,.36,1)', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('200ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1 }))], { optional: true }),
    ]),
  ]),
]);

/**
 * Fade + leve slide para cambios de pestaña/vista dentro de una misma página
 * (ej. Kanban ↔ Lista, o tabs de detalle). Se coloca en el contenedor que
 * envuelve los bloques *ngIf que se alternan, con `[@tabFade]="miVariable"`.
 * Más rápido que `routeFade` porque es una transición local, no de navegación.
 */
export const tabFade = trigger('tabFade', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0, transform: 'translateY(4px)' })], { optional: true }),
    group([
      query(':leave', [animate('120ms cubic-bezier(.4,0,.2,1)', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('160ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1, transform: 'translateY(0)' }))], { optional: true }),
    ]),
  ]),
]);
