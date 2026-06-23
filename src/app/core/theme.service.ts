import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = false;

  get isDark(): boolean { return this._dark; }

  init() {
    this._dark = localStorage.getItem('theme') === 'dark';
    this.apply();
  }

  toggle() {
    this._dark = !this._dark;
    localStorage.setItem('theme', this._dark ? 'dark' : 'light');
    this.apply();
  }

  private apply() {
    document.documentElement.classList.toggle('dark', this._dark);
  }
}
