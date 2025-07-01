import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  
  init = false;
  
  constructor() {}
  
  async ngOnInit() {
    // Initialize Firebase authentication token
    try {
      await firstValueFrom(this.auth.getIdTokenObservable());
    } catch (error) {
      console.error('Error initializing Firebase auth:', error);
    } finally {
      this.init = true;
    }
  }
}
