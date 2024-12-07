import { render, screen, fireEvent, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

describe('Login Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form', () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    render(<Login />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for success and navigation
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(localStorage.getItem('user')).toBeTruthy();
    });
  });

  it('handles login failure', async () => {
    render(<Login />);
    
    // Fill in the form with incorrect credentials
    await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    
    // Verify no data in localStorage
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('validates required fields', async () => {
    render(<Login />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check for HTML5 validation
    expect(screen.getByLabelText(/email address/i)).toBeInvalid();
    expect(screen.getByLabelText(/password/i)).toBeInvalid();
  });

  it('disables form during submission', async () => {
    render(<Login />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if inputs and button are disabled during submission
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeDisabled();
  });
});
