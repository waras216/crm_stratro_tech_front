import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white px-4">
      <div class="text-center">
        <h1 class="text-8xl font-bold text-indigo-400">404</h1>
        <p class="mt-4 text-xl text-slate-300">Página no encontrada</p>
        <a routerLink="/crm/dashboard"
           class="inline-block mt-8 px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 transition-colors">
          Volver al inicio
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
