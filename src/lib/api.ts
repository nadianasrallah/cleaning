const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'Request failed';
      if (data.error) {
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (Array.isArray(data.error)) {
          errorMessage = data.error.map((e: any) => e.message || e.path?.join('.') || 'Validation error').join(', ');
        } else if (typeof data.error === 'object') {
          errorMessage = JSON.stringify(data.error);
        }
      }
      throw new Error(errorMessage);
    }

    return data;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export async function apiRequest<T = any>(
  endpoint: string, 
  options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<T> {
  const token = api.getToken();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  companyId: number | null;
  avatarUrl: string | null;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
}

export interface Branding {
  id: number;
  companyId: number;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customDomain: string | null;
}

export interface Service {
  id: number;
  companyId: number;
  name: string;
  description: string | null;
  basePrice: string;
  pricePerBedroom: string | null;
  pricePerBathroom: string | null;
  durationMinutes: number;
  isActive: boolean;
}

export interface Staff {
  id: number;
  userId: number;
  companyId: number;
  role: string;
  hourlyRate: string | null;
  skills: string[];
  isActive: boolean;
}

export interface Client {
  id: number;
  userId: number;
  companyId: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareFeet: number | null;
  isActive: boolean;
}

export interface Booking {
  id: number;
  companyId: number;
  clientId: number;
  serviceId: number;
  staffId: number | null;
  scheduledDate: string;
  status: string;
  totalPrice: string | null;
  frequency: string;
  notes: string | null;
}

export interface Lead {
  id: number;
  companyId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  score: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}
