// API Configuration and Base Service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_PRODUCTION_URL = import.meta.env.VITE_API_PRODUCTION_URL;

// Determine which API URL to use based on environment
const getApiUrl = () => {
  if (import.meta.env.PROD && API_PRODUCTION_URL) {
    return API_PRODUCTION_URL;
  }
  return API_BASE_URL;
};

const API_URL = getApiUrl();

// Base fetch configuration
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Employee API Service
export const employeeAPI = {
  // Get all employees with pagination
  getEmployees: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    department?: string; 
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.department) searchParams.append('department', params.department);

    return apiRequest(`/employees?${searchParams.toString()}`);
  },

  // Get single employee by ID
  getEmployee: async (id: string) => {
    return apiRequest(`/employees/${id}`);
  },

  // Create new employee
  createEmployee: async (employeeData: any) => {
    return apiRequest('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  },

  // Update employee
  updateEmployee: async (id: string, employeeData: any) => {
    return apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    return apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  // Sync employees with biometric device
  syncEmployees: async () => {
    return apiRequest('/api/employees/sync', {
      method: 'POST',
    });
  },
};

// Attendance API Service
export const attendanceAPI = {
  // Get attendance records with filters
  getAttendanceRecords: async (params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return apiRequest(`/attendance?${searchParams.toString()}`);
  },

  // Record attendance from biometric device
  recordAttendance: async (attendanceData: any, token: string) => {
    return apiRequest('/api/attendance/record', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData),
    });
  },

  // Get today's attendance summary
  getTodaysSummary: async () => {
    return apiRequest('/api/attendance/today');
  },

  // Get attendance statistics
  getAttendanceStats: async (params?: { 
    startDate?: string; 
    endDate?: string; 
    department?: string; 
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.department) searchParams.append('department', params.department);

    return apiRequest(`/attendance/stats?${searchParams.toString()}`);
  },
};

// Health check service
export const healthAPI = {
  checkBackend: async () => {
    return apiRequest('/health');
  },
};

// Legacy compatibility - create apiService that matches old interface
export const apiService = {
  // Employee methods (matching old supabase interface)
  getEmployees: employeeAPI.getEmployees,
  getEmployee: employeeAPI.getEmployee,
  createEmployee: employeeAPI.createEmployee,
  updateEmployee: employeeAPI.updateEmployee,
  deleteEmployee: employeeAPI.deleteEmployee,
  
  // Attendance methods
  getAttendanceRecords: attendanceAPI.getAttendanceRecords,
  getAttendance: attendanceAPI.getAttendanceRecords, // Alias for backward compatibility
  getTodaysSummary: attendanceAPI.getTodaysSummary,
  getAttendanceStats: attendanceAPI.getAttendanceStats,
  
  // Health check
  getHealthCheck: healthAPI.checkBackend,
  
  // Department methods (mock for backward compatibility)
  getDepartments: async () => {
    // Mock departments for backward compatibility
    return {
      data: [
        { id: '1', name: 'Human Resources', description: 'HR Department' },
        { id: '2', name: 'Information Technology', description: 'IT Department' },
        { id: '3', name: 'Finance', description: 'Finance Department' },
        { id: '4', name: 'Administration', description: 'Admin Department' },
        { id: '5', name: 'Operations', description: 'Operations Department' }
      ]
    };
  },
  
  // Branches method (mock for backward compatibility)
  getBranches: async () => {
    // Mock branches for backward compatibility
    return {
      data: [
        { id: '1', name: 'Main Office', address: 'DMHCA Main Campus' }
      ]
    };
  }
};

// Export the base API URL for direct usage if needed
export { API_URL };

export default {
  employee: employeeAPI,
  attendance: attendanceAPI,
  health: healthAPI,
};