import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  sidebarCollapsed = signal(false);
  currentUser = signal<User | null>(null);
  showUserMenu = signal(false);
  searchQuery = signal('');

  constructor() {
    this.authService.getUserData().subscribe(user => {
      this.currentUser.set(user);
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    
    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    return user.email ? user.email[0].toUpperCase() : 'U';
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.showUserMenu.set(false);
  }
}