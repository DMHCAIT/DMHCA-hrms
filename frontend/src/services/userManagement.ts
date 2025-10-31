import { supabase } from '../lib/supabase';

// API service for user management operations
class UserManagementService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
  }

  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createEmployee(employeeData: {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role?: 'admin' | 'employee';
    department?: string;
    position?: string;
    phone?: string;
  }) {
    return this.makeRequest('/api/employees/create', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployeePassword(employee_id: string, new_password: string) {
    return this.makeRequest('/api/employees/update-password', {
      method: 'POST',
      body: JSON.stringify({ employee_id, new_password }),
    });
  }

  async deleteEmployee(employee_id: string) {
    return this.makeRequest(`/api/employees/${employee_id}`, {
      method: 'DELETE',
    });
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return response.json();
    } catch (error) {
      return { status: 'ERROR', error: 'API unavailable' };
    }
  }

  // Fallback method for development when backend API is not available
  isApiAvailable(): boolean {
    return !!import.meta.env.VITE_API_BASE_URL;
  }
}

export const userManagementService = new UserManagementService();
export default UserManagementService;