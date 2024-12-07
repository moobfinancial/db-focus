import axios from 'axios';
import { apiClient } from './client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  user: User | null;
  token: string | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('Sending login request with credentials:', credentials);
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Received login response:', response);

      // Ensure we have a valid response
      if (!response?.data) {
        console.error('Received null/undefined response');
        return {
          success: false,
          user: null,
          token: null,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Server returned an invalid response'
          }
        };
      }

      // Handle successful response
      if (response.data.success && response.data.user && response.data.token) {
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
        };
      }

      // Handle error response
      return {
        success: false,
        user: null,
        token: null,
        error: response.data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred'
        }
      };
    } catch (error) {
      console.error('Login request failed:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return {
          success: false,
          user: null,
          token: null,
          error: error.response.data.error
        };
      }
      return {
        success: false,
        user: null,
        token: null,
        error: {
          code: 'REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Login request failed'
        }
      };
    }
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      console.log('Sending signup request with data:', data);
      const response = await apiClient.post('/auth/register', data);
      console.log('Received signup response:', response);

      if (!response) {
        console.error('Received null/undefined response');
        return {
          success: false,
          user: null,
          token: null,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Server returned an invalid response'
          }
        };
      }

      const responseData = response.data;
      console.log('Processing response data:', responseData);

      if (!responseData.success) {
        return {
          success: false,
          user: null,
          token: null,
          error: responseData.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred'
          }
        };
      }

      if (!responseData.user || !responseData.token) {
        console.error('Missing user or token in response:', responseData);
        return {
          success: false,
          user: null,
          token: null,
          error: {
            code: 'INVALID_RESPONSE_FORMAT',
            message: 'Server response missing user or token'
          }
        };
      }

      return {
        success: true,
        user: responseData.user,
        token: responseData.token
      };
    } catch (error) {
      console.error('Signup request error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.log('Axios error response:', error.response.data);
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        user: null,
        token: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      };
    }
  },

  me: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data || response;
    } catch (error) {
      console.error('Me request error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout request error:', error);
      throw error;
    }
  },
};