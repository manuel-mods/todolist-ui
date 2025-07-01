import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser = signal<User | null>(null);
  isEditing = signal(false);
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.profileForm.patchValue({
          name: user.name || '',
          email: user.email
        });
      }
    });
  }

  toggleEdit(): void {
    this.isEditing.update(v => !v);
    if (!this.isEditing()) {
      // Reset form when canceling
      const user = this.currentUser();
      if (user) {
        this.profileForm.patchValue({
          name: user.name || '',
          email: user.email
        });
      }
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) return;

    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      // TODO: Implement user profile update API call
      // await this.userService.updateProfile(this.profileForm.value);
      
      this.successMessage.set('Profile updated successfully!');
      this.isEditing.set(false);
      
      // Update local user data
      const currentUser = this.currentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          name: this.profileForm.get('name')?.value
        };
        // Update in auth service if method is available
      }
    } catch (error) {
      this.errorMessage.set('Failed to update profile. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async uploadAvatar(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Image size must be less than 5MB');
      return;
    }

    this.loading.set(true);
    try {
      // TODO: Implement avatar upload API call
      // const formData = new FormData();
      // formData.append('avatar', file);
      // await this.userService.uploadAvatar(formData);
      
      this.successMessage.set('Avatar updated successfully!');
    } catch (error) {
      this.errorMessage.set('Failed to upload avatar. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}