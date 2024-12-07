import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';

// Test component that uses auth context
function TestComponent() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button
          onClick={() => login({ email: 'admin@example.com', password: 'admin123' })}
        >
          Login
        </button>
      )}
    </div>
  );
}

// Custom render helper
function renderWithAuth(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    ),
  });
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('provides authentication context', async () => {
    await act(async () => {
      renderWithAuth(<TestComponent />);
    });
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    await act(async () => {
      renderWithAuth(<TestComponent />);
    });

    const loginButton = screen.getByRole('button', { name: /login/i });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
    });

    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(localStorage.getItem('user')).toBeTruthy();
  });

  it('handles logout', async () => {
    await act(async () => {
      renderWithAuth(<TestComponent />);
    });

    // First login
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toBeInTheDocument();
    });

    // Then logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles failed login', async () => {
    const FailedLoginTest = () => {
      const { login } = useAuth();
      
      const handleFailedLogin = async () => {
        try {
          await login({ email: 'wrong@example.com', password: 'wrongpassword' });
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).toBe('Invalid email or password');
          } else {
            throw new Error('Expected error to be instance of Error');
          }
        }
      };
      
      return <button onClick={handleFailedLogin}>Try Failed Login</button>;
    };
    
    await act(async () => {
      renderWithAuth(<FailedLoginTest />);
    });
    
    const failedLoginButton = screen.getByRole('button', { name: /try failed login/i });
    
    await act(async () => {
      fireEvent.click(failedLoginButton);
    });
    
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
