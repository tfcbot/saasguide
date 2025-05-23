import { QueryCtx, MutationCtx } from "./_generated/server";

// Types for the utilities
export interface Pagination {
  page?: number;
  limit?: number;
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
};

// Pagination utilities
export const PaginationUtils = {
  /**
   * Apply pagination to a query result
   * Note: This is a simplified version that works with collected results
   * For more complex pagination, use Convex's built-in pagination methods
   */
  paginateResults<T>(
    data: T[],
    pagination: Pagination
  ): { data: T[]; total: number; hasMore: boolean } {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const paginatedData = data.slice(skip, skip + limit);
    
    return {
      data: paginatedData,
      total: data.length,
      hasMore: skip + paginatedData.length < data.length,
    };
  },
};

// Filtering utilities
export const FilterUtils = {
  /**
   * Apply filters to an array of data
   * For database queries, use Convex's built-in filter methods directly
   */
  applyArrayFilter<T>(data: T[], field: keyof T, operator: FilterOperator, value: any): T[] {
    return data.filter(item => {
      const fieldValue = item[field];
      
      switch (operator) {
        case "eq":
          return fieldValue === value;
        case "neq":
          return fieldValue !== value;
        case "gt":
          return fieldValue > value;
        case "gte":
          return fieldValue >= value;
        case "lt":
          return fieldValue < value;
        case "lte":
          return fieldValue <= value;
        case "in":
          return Array.isArray(value) && value.includes(fieldValue);
        case "contains":
          return typeof fieldValue === "string" && typeof value === "string" && 
                 fieldValue.toLowerCase().includes(value.toLowerCase());
        default:
          return true;
      }
    });
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
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  },
};
