/**
 * Comprehensive utility functions and helpers for SaaS Guide application
 * Provides common operations for date/time, data transformation, pagination, filtering, and validation
 */

import { QueryCtx, MutationCtx } from "../_generated/server";

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
   * Check if a date is in the past
   */
  isPast(timestamp: number): boolean {
    return timestamp < Date.now();
  },

  /**
   * Check if a date is in the future
   */
  isFuture(timestamp: number): boolean {
    return timestamp > Date.now();
  },

  /**
   * Check if a date is today
   */
  isToday(timestamp: number): boolean {
    const today = new Date();
    const date = new Date(timestamp);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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
   * Calculate sum of numeric values in an array
   */
  sum(array: number[]): number {
    return array.reduce((sum, value) => sum + value, 0);
  },

  /**
   * Calculate average of numeric values in an array
   */
  average(array: number[]): number {
    return array.length > 0 ? this.sum(array) / array.length : 0;
  },

  /**
   * Find minimum value in an array
   */
  min(array: number[]): number {
    return Math.min(...array);
  },

  /**
   * Find maximum value in an array
   */
  max(array: number[]): number {
    return Math.max(...array);
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
      case "contains":
        return query.filter((q: any) => q.contains(q.field(field), value));
      default:
        return query;
    }
  },

  /**
   * Filter an array by multiple criteria
   */
  filterArray<T>(array: T[], filters: Filter[]): T[] {
    return array.filter(item => {
      return filters.every(filter => {
        const value = (item as any)[filter.field];
        return this.applyFilterToValue(value, filter.operator, filter.value);
      });
    });
  },

  /**
   * Apply a filter operator to a value
   */
  applyFilterToValue(itemValue: any, operator: FilterOperator, filterValue: any): boolean {
    switch (operator) {
      case "eq":
        return itemValue === filterValue;
      case "neq":
        return itemValue !== filterValue;
      case "gt":
        return itemValue > filterValue;
      case "gte":
        return itemValue >= filterValue;
      case "lt":
        return itemValue < filterValue;
      case "lte":
        return itemValue <= filterValue;
      case "contains":
        return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
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
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  },

  /**
   * Check if a string meets minimum length requirement
   */
  hasMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength;
  },

  /**
   * Check if a string doesn't exceed maximum length
   */
  hasMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  },

  /**
   * Check if a number is within a range
   */
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  },

  /**
   * Check if a value is a positive number
   */
  isPositiveNumber(value: number): boolean {
    return typeof value === "number" && value > 0;
  },

  /**
   * Check if a value is a non-negative number
   */
  isNonNegativeNumber(value: number): boolean {
    return typeof value === "number" && value >= 0;
  },

  /**
   * Validate progress percentage (0-100)
   */
  isValidProgress(progress: number): boolean {
    return this.isInRange(progress, 0, 100);
  },

  /**
   * Validate priority (1-5)
   */
  isValidPriority(priority: number): boolean {
    return this.isInRange(priority, 1, 5);
  },

  /**
   * Validate score (1-10)
   */
  isValidScore(score: number): boolean {
    return this.isInRange(score, 1, 10);
  },
};

// String utilities
export const StringUtils = {
  /**
   * Convert string to title case
   */
  toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Convert string to camelCase
   */
  toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  },

  /**
   * Convert string to kebab-case
   */
  toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  },

  /**
   * Convert string to snake_case
   */
  toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  },

  /**
   * Truncate string to specified length
   */
  truncate(str: string, length: number, suffix: string = "..."): string {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - suffix.length) + suffix;
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
   * Generate a slug from a string
   */
  generateSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },
};

// Math utilities
export const MathUtils = {
  /**
   * Round number to specified decimal places
   */
  round(num: number, decimals: number = 2): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  /**
   * Calculate percentage
   */
  percentage(value: number, total: number): number {
    return total === 0 ? 0 : this.round((value / total) * 100);
  },

  /**
   * Clamp a number between min and max values
   */
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Generate a random number between min and max
   */
  randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  /**
   * Generate a random integer between min and max (inclusive)
   */
  randomIntBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

// Authentication utilities
export const AuthUtils = {
  /**
   * Get user by Clerk ID
   */
  async getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },

  /**
   * Require authenticated user
   */
  async requireUser(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User must be logged in");
    }

    const user = await this.getUserByClerkId(ctx, identity.subject);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },

  /**
   * Check if user has permission to access resource
   */
  async hasPermission(
    ctx: QueryCtx | MutationCtx,
    userId: string,
    resourceUserId: string
  ): Promise<boolean> {
    return userId === resourceUserId;
  },

  /**
   * Require user permission for resource
   */
  async requirePermission(
    ctx: QueryCtx | MutationCtx,
    userId: string,
    resourceUserId: string,
    errorMessage: string = "Access denied"
  ): Promise<void> {
    const hasPermission = await this.hasPermission(ctx, userId, resourceUserId);
    if (!hasPermission) {
      throw new Error(errorMessage);
    }
  },
};

// Type definitions
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

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface Sort {
  field: string;
  direction: SortDirection;
}

// Export all utilities as a single object for convenience
export const Utils = {
  Date: DateUtils,
  Data: DataUtils,
  Pagination: PaginationUtils,
  Filter: FilterUtils,
  Validation: ValidationUtils,
  String: StringUtils,
  Math: MathUtils,
  Auth: AuthUtils,
};

export default Utils;
