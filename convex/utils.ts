import { QueryCtx, MutationCtx } from "./_generated/server";

// Date and time utilities
export const DateUtils = {
  /**
   * Get the current timestamp in milliseconds
   */
  now(): number {
    return Date.now();
  },

  /**
   * Get the timestamp for the start of the day
   */
  startOfDay(date: Date = new Date()): number {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay.getTime();
  },

  /**
   * Get the timestamp for the end of the day
   */
  endOfDay(date: Date = new Date()): number {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime();
  },

  /**
   * Get the timestamp for the start of the week (Sunday)
   */
  startOfWeek(date: Date = new Date()): number {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.getTime();
  },

  /**
   * Get the timestamp for the end of the week (Saturday)
   */
  endOfWeek(date: Date = new Date()): number {
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + (6 - date.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek.getTime();
  },

  /**
   * Get the timestamp for the start of the month
   */
  startOfMonth(date: Date = new Date()): number {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return startOfMonth.getTime();
  },

  /**
   * Get the timestamp for the end of the month
   */
  endOfMonth(date: Date = new Date()): number {
    const endOfMonth = new Date(date);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    return endOfMonth.getTime();
  },

  /**
   * Format a timestamp to a human-readable date string
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  },

  /**
   * Format a timestamp to a human-readable date and time string
   */
  formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  },

  /**
   * Get the relative time string (e.g., "2 hours ago")
   */
  getRelativeTimeString(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) {
      return `${years} year${years === 1 ? "" : "s"} ago`;
    } else if (months > 0) {
      return `${months} month${months === 1 ? "" : "s"} ago`;
    } else if (days > 0) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    } else {
      return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
    }
  },

  /**
   * Add days to a timestamp
   */
  addDays(timestamp: number, days: number): number {
    const date = new Date(timestamp);
    date.setDate(date.getDate() + days);
    return date.getTime();
  },

  /**
   * Add hours to a timestamp
   */
  addHours(timestamp: number, hours: number): number {
    return timestamp + (hours * 60 * 60 * 1000);
  },

  /**
   * Add minutes to a timestamp
   */
  addMinutes(timestamp: number, minutes: number): number {
    return timestamp + (minutes * 60 * 1000);
  },

  /**
   * Check if a timestamp is in the past
   */
  isPast(timestamp: number): boolean {
    return timestamp < Date.now();
  },

  /**
   * Check if a timestamp is in the future
   */
  isFuture(timestamp: number): boolean {
    return timestamp > Date.now();
  },

  /**
   * Check if two timestamps are on the same day
   */
  isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date1.toDateString() === date2.toDateString();
  },
};

// Data transformation helpers
export const DataUtils = {
  /**
   * Group an array of objects by a key
   */
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  },

  /**
   * Convert an array of objects to a map by a key
   */
  arrayToMap<T>(array: T[], key: keyof T): Map<string, T> {
    return new Map(array.map(item => [String(item[key]), item]));
  },

  /**
   * Flatten a nested array
   */
  flatten<T>(array: T[][]): T[] {
    return array.reduce((result, item) => result.concat(item), []);
  },

  /**
   * Remove duplicate items from an array
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  },

  /**
   * Remove duplicate objects from an array by a key
   */
  uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },

  /**
   * Sort an array of objects by a key
   */
  sortBy<T>(array: T[], key: keyof T, direction: SortDirection = "asc"): T[] {
    return [...array].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue < bValue) {
        return direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  },

  /**
   * Chunk an array into smaller arrays of specified size
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Pick specific properties from an object
   */
  pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omit specific properties from an object
   */
  omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  /**
   * Deep clone an object
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  },
};

// Pagination utilities
export const PaginationUtils = {
  /**
   * Calculate pagination metadata
   */
  calculatePagination(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      startIndex,
      endIndex,
    };
  },

  /**
   * Apply pagination to an array
   */
  paginateArray<T>(array: T[], page: number, limit: number): PaginatedResult<T> {
    const total = array.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = array.slice(startIndex, endIndex);
    const pagination = this.calculatePagination(page, limit, total);

    return {
      data,
      pagination,
    };
  },

  /**
   * Get default pagination values
   */
  getDefaultPagination(): Pagination {
    return {
      page: 1,
      limit: 10,
    };
  },
};

// Filtering utilities
export const FilterUtils = {
  /**
   * Apply a filter to a query
   */
  applyFilter(query: any, field: string, operator: FilterOperator, value: any): any {
    switch (operator) {
      case "eq":
        return query.filter((q: any) => q.eq(q.field(field), value));
      case "neq":
        return query.filter((q: any) => q.neq(q.field(field), value));
      case "gt":
        return query.filter((q: any) => q.gt(q.field(field), value));
      case "gte":
        return query.filter((q: any) => q.gte(q.field(field), value));
      case "lt":
        return query.filter((q: any) => q.lt(q.field(field), value));
      case "lte":
        return query.filter((q: any) => q.lte(q.field(field), value));
      case "in":
        return query.filter((q: any) => {
          if (Array.isArray(value)) {
            return value.some(v => q.eq(q.field(field), v));
          }
          return q.eq(q.field(field), value);
        });
      case "contains":
        return query.filter((q: any) => {
          // For string fields, check if the field contains the value
          return q.gte(q.field(field), value) && q.lt(q.field(field), value + "\uffff");
        });
      default:
        return query;
    }
  },

  /**
   * Apply multiple filters to a query
   */
  applyFilters(query: any, filters: Filter[]): any {
    return filters.reduce((q, filter) => {
      return this.applyFilter(q, filter.field, filter.operator, filter.value);
    }, query);
  },

  /**
   * Filter an array of objects
   */
  filterArray<T>(array: T[], filters: Filter[]): T[] {
    return array.filter(item => {
      return filters.every(filter => {
        const value = (item as any)[filter.field];
        return this.evaluateFilter(value, filter.operator, filter.value);
      });
    });
  },

  /**
   * Evaluate a single filter condition
   */
  evaluateFilter(fieldValue: any, operator: FilterOperator, filterValue: any): boolean {
    switch (operator) {
      case "eq":
        return fieldValue === filterValue;
      case "neq":
        return fieldValue !== filterValue;
      case "gt":
        return fieldValue > filterValue;
      case "gte":
        return fieldValue >= filterValue;
      case "lt":
        return fieldValue < filterValue;
      case "lte":
        return fieldValue <= filterValue;
      case "in":
        return Array.isArray(filterValue) ? filterValue.includes(fieldValue) : fieldValue === filterValue;
      case "contains":
        return typeof fieldValue === "string" && typeof filterValue === "string" 
          ? fieldValue.toLowerCase().includes(filterValue.toLowerCase())
          : false;
      default:
        return true;
    }
  },
};

// Validation utilities
export const ValidationUtils = {
  /**
   * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
   */
  isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === "string") {
      return value.trim() === "";
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }
    
    return false;
  },

  /**
   * Check if a value is not empty
   */
  isNotEmpty(value: any): boolean {
    return !this.isEmpty(value);
  },

  /**
   * Check if a value is a valid email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if a value is a valid URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a value is a valid phone number
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Check if a string is a valid UUID
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Check if a value is a valid number
   */
  isValidNumber(value: any): boolean {
    return typeof value === "number" && !isNaN(value) && isFinite(value);
  },

  /**
   * Check if a value is a positive number
   */
  isPositiveNumber(value: any): boolean {
    return this.isValidNumber(value) && value > 0;
  },

  /**
   * Check if a value is a non-negative number
   */
  isNonNegativeNumber(value: any): boolean {
    return this.isValidNumber(value) && value >= 0;
  },

  /**
   * Check if a string meets minimum length requirement
   */
  hasMinLength(value: string, minLength: number): boolean {
    return typeof value === "string" && value.length >= minLength;
  },

  /**
   * Check if a string doesn't exceed maximum length
   */
  hasMaxLength(value: string, maxLength: number): boolean {
    return typeof value === "string" && value.length <= maxLength;
  },

  /**
   * Check if a string is within length range
   */
  isWithinLengthRange(value: string, minLength: number, maxLength: number): boolean {
    return this.hasMinLength(value, minLength) && this.hasMaxLength(value, maxLength);
  },

  /**
   * Validate required fields in an object
   */
  validateRequiredFields<T>(obj: T, requiredFields: (keyof T)[]): ValidationResult {
    const missingFields: string[] = [];
    
    requiredFields.forEach(field => {
      if (this.isEmpty((obj as any)[field])) {
        missingFields.push(String(field));
      }
    });

    return {
      isValid: missingFields.length === 0,
      errors: missingFields.map(field => `${field} is required`),
    };
  },
};

// Error handling utilities
export const ErrorUtils = {
  /**
   * Create a standardized error response
   */
  createError(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: Date.now(),
    };
  },

  /**
   * Create a validation error
   */
  createValidationError(field: string, message: string): AppError {
    return this.createError("VALIDATION_ERROR", `${field}: ${message}`, { field });
  },

  /**
   * Create a not found error
   */
  createNotFoundError(resource: string, id?: string): AppError {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    return this.createError("NOT_FOUND", message, { resource, id });
  },

  /**
   * Create an unauthorized error
   */
  createUnauthorizedError(message: string = "Unauthorized"): AppError {
    return this.createError("UNAUTHORIZED", message);
  },

  /**
   * Create a forbidden error
   */
  createForbiddenError(message: string = "Forbidden"): AppError {
    return this.createError("FORBIDDEN", message);
  },

  /**
   * Check if an error is of a specific type
   */
  isErrorType(error: any, code: string): boolean {
    return error && error.code === code;
  },
};

// String utilities
export const StringUtils = {
  /**
   * Convert string to camelCase
   */
  toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  },

  /**
   * Convert string to PascalCase
   */
  toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    }).replace(/\s+/g, '');
  },

  /**
   * Convert string to kebab-case
   */
  toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  },

  /**
   * Convert string to snake_case
   */
  toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  },

  /**
   * Capitalize first letter
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Generate a random string
   */
  generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Truncate string with ellipsis
   */
  truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Remove HTML tags from string
   */
  stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, '');
  },

  /**
   * Escape HTML characters
   */
  escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  },
};

// Types for the utilities
export interface Pagination {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type SortDirection = "asc" | "desc";

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface Sort {
  field: string;
  direction: SortDirection;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}
