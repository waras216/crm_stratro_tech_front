import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  constructor(private theme: ThemeService) {}

  ngOnInit() {
    this.theme.init();
  }
}
