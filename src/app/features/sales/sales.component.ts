import { Component } from '@angular/core';
import { PosComponent } from './components/pos.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [PosComponent],
  template: ` <app-pos></app-pos> `,
  styles: [
    `
      .sales-page {
        min-height: 100vh;
        background-color: #f8f9fa;
      }

      .sales-page h2 {
        color: #333;
        margin: 0;
        padding: 20px 20px 0;
        text-align: center;
        background: linear-gradient(135deg, #8b4513 0%, #a0522d 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `,
  ],
})
export class SalesComponent {}
