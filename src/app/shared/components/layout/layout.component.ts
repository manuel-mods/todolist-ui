import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SearchService, SearchResult } from '../../../core/services/search.service';
import { TaskStatus } from '../../../core/models';
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
  private searchService = inject(SearchService);
  
  sidebarCollapsed = signal(false);
  currentUser = signal<User | null>(null);
  showUserMenu = signal(false);
  searchQuery = '';
  searchResults = signal<SearchResult | null>(null);
  showSearchResults = signal(false);
  isSearching = signal(false);
  
  private searchSubject = new Subject<string>();
  
  // Make TaskStatus available to template
  readonly TaskStatus = TaskStatus;

  constructor() {
    this.authService.getUserData().subscribe(user => {
      this.currentUser.set(user);
    });
    
    this.setupSearch();
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

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.showSearchResults.set(false);
          return of(null);
        }
        this.isSearching.set(true);
        return this.searchService.globalSearch(query).pipe(
          catchError(error => {
            console.error('Error searching:', error);
            return of(null);
          })
        );
      })
    ).subscribe(results => {
      this.isSearching.set(false);
      if (results) {
        this.searchResults.set(results);
        this.showSearchResults.set(true);
      } else {
        this.searchResults.set(null);
        this.showSearchResults.set(false);
      }
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  selectSearchResult(type: 'task' | 'project', id: number): void {
    this.showSearchResults.set(false);
    this.searchQuery = '';
    
    if (type === 'task') {
      // Navigate to project and highlight task - for now just go to project
      const result = this.searchResults();
      const task = result?.tasks.find(t => t.id === id);
      if (task) {
        this.router.navigate(['/projects', task.projectId]);
      }
    } else {
      this.router.navigate(['/projects', id]);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.set(null);
    this.showSearchResults.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown');
    const searchContainer = target.closest('.search-container');
    
    if (!dropdown) {
      this.showUserMenu.set(false);
    }
    
    if (!searchContainer) {
      this.showSearchResults.set(false);
    }
  }
}