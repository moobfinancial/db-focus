// Utility function to get environment variables across different environments
export function getEnvVar(viteKey: string, nextKey?: string): string {
  // First, check Vite environment
  if (import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  
  // Then, check if we're in a server-side Next.js environment
  if (typeof window === 'undefined' && process && process.env) {
    return process.env[nextKey || viteKey] || '';
  }
  
  // If in browser and Next.js environment, use window.__NEXT_DATA__
  if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
    const nextData = (window as any).__NEXT_DATA__;
    return nextData.env[nextKey || viteKey] || '';
  }
  
  // Fallback
  return '';
}

// Helper function to safely parse environment variables
export function parseEnvVar(key: string, defaultValue: string = ''): string {
  return getEnvVar(key) || defaultValue;
}

// Helper function to parse boolean environment variables
export function parseEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key).toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

// Helper function to parse numeric environment variables
export function parseEnvNumber(key: string, defaultValue: number = 0): number {
  const value = getEnvVar(key);
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
