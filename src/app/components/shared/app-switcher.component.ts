import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-switcher',
  standalone: false,
  templateUrl: './app-switcher.component.html',
  styleUrls: ['./app-switcher.component.scss'],
})
export class AppSwitcherComponent {
  open = false;

  constructor(private router: Router) {}

  isActive(path: string): boolean {
    return this.router.url.startsWith('/' + path);
  }

  navigate(path: string) {
    this.router.navigate(['/' + path]);
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }
}
