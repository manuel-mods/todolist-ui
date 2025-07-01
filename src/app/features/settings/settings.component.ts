import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NotificationSettings {
  emailNotifications: boolean;
  taskReminders: boolean;
  projectUpdates: boolean;
  weeklyDigest: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  allowProjectInvites: boolean;
  showOnlineStatus: boolean;
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  activeTab = signal('notifications');
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  notifications = signal<NotificationSettings>({
    emailNotifications: true,
    taskReminders: true,
    projectUpdates: false,
    weeklyDigest: true
  });

  privacy = signal<PrivacySettings>({
    profileVisibility: 'private',
    allowProjectInvites: true,
    showOnlineStatus: false
  });

  display = signal<DisplaySettings>({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  tabs = [
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'privacy', label: 'Privacy & Security', icon: 'fas fa-shield-alt' },
    { id: 'display', label: 'Display & Language', icon: 'fas fa-palette' },
    { id: 'integrations', label: 'Integrations', icon: 'fas fa-plug' }
  ];

  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];

  dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY'
  ];

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  async saveNotificationSettings(): Promise<void> {
    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      // TODO: Implement API call to save notification settings
      // await this.settingsService.updateNotifications(this.notifications());
      
      this.successMessage.set('Notification settings saved successfully!');
    } catch (error) {
      this.errorMessage.set('Failed to save notification settings. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async savePrivacySettings(): Promise<void> {
    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      // TODO: Implement API call to save privacy settings
      // await this.settingsService.updatePrivacy(this.privacy());
      
      this.successMessage.set('Privacy settings saved successfully!');
    } catch (error) {
      this.errorMessage.set('Failed to save privacy settings. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveDisplaySettings(): Promise<void> {
    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      // TODO: Implement API call to save display settings
      // await this.settingsService.updateDisplay(this.display());
      
      this.successMessage.set('Display settings saved successfully!');
    } catch (error) {
      this.errorMessage.set('Failed to save display settings. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  updateNotificationSetting(key: keyof NotificationSettings, value: boolean): void {
    this.notifications.update(settings => ({ ...settings, [key]: value }));
  }

  updatePrivacySetting(key: keyof PrivacySettings, value: any): void {
    this.privacy.update(settings => ({ ...settings, [key]: value }));
  }

  updateDisplaySetting(key: keyof DisplaySettings, value: string): void {
    this.display.update(settings => ({ ...settings, [key]: value }));
  }

  clearCache(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.successMessage.set('Cache cleared successfully!');
  }

  exportData(): void {
    // TODO: Implement data export functionality
    this.successMessage.set('Data export will be available soon!');
  }

  resetToDefaults(): void {
    this.notifications.set({
      emailNotifications: true,
      taskReminders: true,
      projectUpdates: false,
      weeklyDigest: true
    });

    this.privacy.set({
      profileVisibility: 'private',
      allowProjectInvites: true,
      showOnlineStatus: false
    });

    this.display.set({
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    });

    this.successMessage.set('Settings reset to defaults!');
  }

  onNotificationChange(key: keyof NotificationSettings, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateNotificationSetting(key, target.checked);
  }

  onPrivacyChange(key: keyof PrivacySettings, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.updatePrivacySetting(key, target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value);
  }

  onDisplayChange(key: keyof DisplaySettings, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateDisplaySetting(key, target.value);
  }
}