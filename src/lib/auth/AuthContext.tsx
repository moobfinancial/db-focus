import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { authApi } from '@/lib/api/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }, redirect?: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const updateUser = useCallback((newUser: User | null) => {
    setUser(newUser);
  }, []);

  return {
    user,
    loading,
    setLoading,
    updateUser,
    toast
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading,
    setLoading,
    updateUser,
    toast
  } = useAuthState();

  // Check auth status on mount only
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (!mounted) return;

      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            updateUser(parsedUser);
          } else {
            // Invalid user data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        if (mounted) {
          updateUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [updateUser, setLoading]); // Only run on mount and when these callbacks change

  const login = async (credentials: { email: string; password: string }, redirect?: string) => {
    try {
      const response = await authApi.login(credentials);
      console.log('Auth response:', response);
      
      if (!response.success || !response.user || !response.token) {
        const errorMessage = response.error?.message || 'Login failed';
        console.error('Login failed:', errorMessage, response);
        throw new Error(errorMessage);
      }

      // Store user and token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Verify token is stored
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }
      
      updateUser(response.user);

      toast({
        title: "Success",
        description: "Welcome back!"
      });

      // Small delay to ensure token is available for subsequent requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (redirect) {
        window.location.href = redirect;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any potentially corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      updateUser(null);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unknown error occurred";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signup = async (data: { email: string; password: string; name: string }) => {
    try {
      const response = await authApi.signup(data);
      console.log('Signup response:', response);
      
      if (!response.success || !response.user) {
        const errorMessage = response.error?.message || 'Signup failed: Invalid response from server';
        console.error('Signup failed:', errorMessage, response);
        throw new Error(errorMessage);
      }

      // Validate user data before storing
      if (!response.user.id || !response.user.email) {
        console.error('Invalid user data:', response.user);
        throw new Error('Signup failed: Invalid user data');
      }

      // Store user and token
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      updateUser(response.user);

      toast({
        title: "Success",
        description: "Account created successfully!"
      });

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Signup error:', error);
      // Clear any potentially corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      updateUser(null);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    updateUser(null);
    toast({
      title: "Success",
      description: "You have been logged out"
    });
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}