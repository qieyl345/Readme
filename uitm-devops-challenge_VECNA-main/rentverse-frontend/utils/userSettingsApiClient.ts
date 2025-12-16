import { API_BASE_URL } from './apiConfig';

export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  currency: string;
  timezone: string;
  notifications: Record<string, any>;
  privacy: Record<string, any>;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsInput {
  language?: string;
  currency?: string;
  timezone?: string;
  notifications?: Record<string, any>;
  privacy?: Record<string, any>;
  preferences?: Record<string, any>;
}

class UserSettingsApiClient {
  private baseUrl = `${API_BASE_URL}/api/user-settings`;

  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getCurrentUserSettings(): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user settings');
    }

    const data = await response.json();
    return data.data;
  }

  async updateCurrentUserSettings(settings: UserSettingsInput): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update user settings');
    }

    const data = await response.json();
    return data.data;
  }

  async getUserSettingsByUserId(userId: string): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user settings');
    }

    const data = await response.json();
    return data.data;
  }

  async createUserSettings(settings: UserSettingsInput & { userId: string }): Promise<UserSettings> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create user settings');
    }

    const data = await response.json();
    return data.data;
  }

  async updateUserSettings(userId: string, settings: UserSettingsInput): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update user settings');
    }

    const data = await response.json();
    return data.data;
  }

  async deleteUserSettings(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete user settings');
    }
  }
}

export const userSettingsApiClient = new UserSettingsApiClient();