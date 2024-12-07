export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

export interface RequestUser {
  id: string;
  email: string;
  role: string;
}
