import { User } from '../types/game';

let cachedCsrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch('/api/csrf-token');
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken || '';
    }
  } catch (e) {
    // Silently continue
  }
  return '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const csrf = await getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (csrf) {
    headers['x-csrf-token'] = csrf;
  }

  // Also pass Bearer token from localStorage if available (in addition to cookies)
  const storedToken = localStorage.getItem('devils_home_token');
  if (storedToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.error || 'Server error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const GUEST_STORAGE_KEY = 'devils_home_guest_data';

export interface GuestProgress {
  coins: number;
  hearts: number;
  maxHearts: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
  unlockedWeapons: string[];
  selectedWeapon: string;
  currentLevel: number;
  highScore: number;
  totalKills: number;
  bossesDefeated: number;
}

export const defaultGuestProgress: GuestProgress = {
  coins: 100,
  hearts: 3,
  maxHearts: 3,
  unlockedCharacters: ['hero_t1'],
  selectedCharacter: 'hero_t1',
  unlockedWeapons: ['runic_blade'],
  selectedWeapon: 'runic_blade',
  currentLevel: 1,
  highScore: 0,
  totalKills: 0,
  bossesDefeated: 0,
};

export const api = {
  getGuestProgress(): GuestProgress {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        return { ...defaultGuestProgress, ...JSON.parse(raw) };
      }
    } catch (e) {}
    return { ...defaultGuestProgress };
  },

  saveGuestProgress(updates: Partial<GuestProgress>): GuestProgress {
    const current = this.getGuestProgress();
    const updated = { ...current, ...updates };
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  },

  clearGuestProgress() {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (e) {}
  },

  async register(params: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    guestProgress?: GuestProgress;
  }): Promise<{ user: User; accessToken: string }> {
    const data = await request<{ user: User; accessToken: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (data.accessToken) {
      localStorage.setItem('devils_home_token', data.accessToken);
    }
    return data;
  },

  async login(params: {
    identifier: string;
    password: string;
    rememberMe?: boolean;
    otp?: string;
  }): Promise<{ user?: User; accessToken?: string; requiresOtp?: boolean; message?: string }> {
    const data = await request<{ user?: User; accessToken?: string; requiresOtp?: boolean; message?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (data.accessToken) {
      localStorage.setItem('devils_home_token', data.accessToken);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('devils_home_token');
    }
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string; simulationCode?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(params: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async saveProgress(updates: {
    coinsDelta?: number;
    score?: number;
    level?: number;
    killsDelta?: number;
    bossDefeated?: boolean;
    selectedCharacter?: string;
    selectedWeapon?: string;
  }): Promise<{ user: User }> {
    return request<{ user: User }>('/api/game/progress', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  async shopPurchase(itemId: string): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>('/api/game/shop-purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  async migrateGuest(guestProgress: GuestProgress): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>('/api/game/migrate-guest', {
      method: 'POST',
      body: JSON.stringify({ guestProgress }),
    });
  },

  async getLeaderboard(): Promise<{ leaderboard: any[] }> {
    return request<{ leaderboard: any[] }>('/api/game/leaderboard');
  },
};
