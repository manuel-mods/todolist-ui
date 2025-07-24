import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, catchError, throwError, from, switchMap } from 'rxjs';
import { Auth, signInWithCustomToken, signOut, User as FirebaseUser, onAuthStateChanged, getIdToken, sendPasswordResetEmail } from '@angular/fire/auth';
import { User } from '../models';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  success: boolean;
  data?: {
    uid: string;
    email: string;
    token: string;
    name?: string;
  };
  error?: string;
  message?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface ResetPasswordRequest {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(Auth);
  private ngZone = inject(NgZone);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenKey = 'authToken';
  private userKey = 'authUser';
  private firebaseUser: FirebaseUser | null = null;
  
  constructor() {
    this.loadStoredUser();
  }
  
  private loadStoredUser(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearStoredAuth();
      }
    }
  }
  
  private storeAuth(response: AuthResponse): void {
    if (response.success && response.data) {
      localStorage.setItem(this.tokenKey, response.data.token);
      
      const user: User = {
        id: response.data.uid,
        email: response.data.email,
        name: response.data.name
      };
      
      localStorage.setItem(this.userKey, JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }
  
  private clearStoredAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }
  
  login(email: string, password: string): Observable<void> {
    const request: LoginRequest = { email, password };
    
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      switchMap(response => {
        if (response.success && response.data?.token) {
          // Sign in with Firebase using the custom token from backend
          return from(signInWithCustomToken(this.auth, response.data.token)).pipe(
            tap(userCredential => {
              this.firebaseUser = userCredential.user;
              this.storeAuth(response);
              this.router.navigate(['/projects']);
            }),
            map(() => void 0)
          );
        } else {
          throw new Error(response.error || 'Login failed');
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        const message = error.error?.error || error.message || 'Login failed';
        return throwError(() => new Error(message));
      })
    );
  }
  
  register(email: string, password: string, name?: string): Observable<void> {
    const request: RegisterRequest = { email, password, name };
    
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request).pipe(
      switchMap(response => {
        if (response.success && response.data?.token) {
          // Sign in with Firebase using the custom token from backend
          return from(signInWithCustomToken(this.auth, response.data.token)).pipe(
            tap(userCredential => {
              this.firebaseUser = userCredential.user;
              this.storeAuth(response);
              this.router.navigate(['/projects']);
            }),
            map(() => void 0)
          );
        } else {
          throw new Error(response.error || 'Registration failed');
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        const message = error.error?.error || error.message || 'Registration failed';
        return throwError(() => new Error(message));
      })
    );
  }
  
  resetPassword(email: string): Observable<void> {
    // Using Firebase reset password instead of backend API
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Firebase password reset error:', error);
        let message = 'Password reset failed';
        
        // Handle specific Firebase error codes
        switch (error.code) {
          case 'auth/user-not-found':
            message = 'No user found with this email address';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
          case 'auth/too-many-requests':
            message = 'Too many requests. Please try again later';
            break;
          default:
            message = error.message || 'Password reset failed';
        }
        
        return throwError(() => new Error(message));
      })
    );
    
    // Commented out: Backend API implementation
    /*
    const request: ResetPasswordRequest = { email };
    
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/reset-password`, request).pipe(
      tap(response => {
        if (!response.success) {
          throw new Error(response.error || 'Password reset failed');
        }
      }),
      map(() => void 0),
      catchError(error => {
        console.error('Password reset error:', error);
        const message = error.error?.error || error.message || 'Password reset failed';
        return throwError(() => new Error(message));
      })
    );
    */
  }
  
  logout(): void {
    this.clearStoredAuth();
    // Sign out from Firebase
    signOut(this.auth).then(() => {
      this.firebaseUser = null;
      this.router.navigate(['/auth/login']);
    }).catch(error => {
      console.error('Firebase sign out error:', error);
      // Navigate anyway
      this.router.navigate(['/auth/login']);
    });
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  async getIdToken(): Promise<string | null> {
    // Get Firebase ID token if user is authenticated
    if (this.auth.currentUser) {
      try {
        return await this.auth.currentUser.getIdToken();
      } catch (error) {
        console.error('Error getting Firebase ID token:', error);
        return null;
      }
    }
    return null;
  }
  
  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }
  
  getUserData(): Observable<User | null> {
    return this.currentUser$;
  }
  
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
  
  checkAuthStatus(): void {
    if (this.isTokenExpired()) {
      this.logout();
    }
  }
  
  getIdTokenObservable(): Observable<string | null> {
    return new Observable((subscriber) => {
      const unsubscribe = this.ngZone.runOutsideAngular(() => {
        return onAuthStateChanged(this.auth, (user) => {
          this.ngZone.run(() => {
            if (user) {
              this.ngZone.runOutsideAngular(() => {
                getIdToken(user).then(
                  (idToken) => {
                    this.ngZone.run(() => {
                      subscriber.next(idToken);
                      subscriber.complete();
                    });
                  },
                  (error) => {
                    this.ngZone.run(() => {
                      subscriber.error(error);
                    });
                  }
                );
              });
            } else {
              subscriber.next(null);
              subscriber.complete();
            }
          });
        });
      });

      return () => unsubscribe();
    });
  }
}