import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Date and time utilities
export const dateUtils = {
  // Get current timestamp
  now: (): number => Date.now(),

  // Format timestamp to readable date
  formatDate: (timestamp: number, locale: string = "en-US"): string => {
    return new Date(timestamp).toLocaleDateString(locale);
  },

  // Format timestamp to readable datetime
  formatDateTime: (timestamp: number, locale: string = "en-US"): string => {
    return new Date(timestamp).toLocaleString(locale);
  },

  // Get start of day timestamp
  startOfDay: (timestamp: number): number => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  },

  // Get end of day timestamp
  endOfDay: (timestamp: number): number => {
    const date = new Date(timestamp);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  },

  // Add days to timestamp
  addDays: (timestamp: number, days: number): number => {
    return timestamp + (days * 24 * 60 * 60 * 1000);
  },

  // Get days between two timestamps
  daysBetween: (start: number, end: number): number => {
    return Math.ceil((end - start) / (24 * 60 * 60 * 1000));
  },

  // Check if date is in the past
  isPast: (timestamp: number): boolean => {
    return timestamp < Date.now();
  },

  // Check if date is in the future
  isFuture: (timestamp: number): boolean => {
    return timestamp > Date.now();
  },

  // Get relative time string (e.g., "2 hours ago")
  getRelativeTime: (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },
};

// String utilities
export const stringUtils = {
  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Convert to title case
  toTitleCase: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Generate slug from string
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Truncate string with ellipsis
  truncate: (str: string, length: number): string => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  },

  // Generate random string
  randomString: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Extract initials from name
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Mask email for privacy
  maskEmail: (email: string): string => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  },
};

// Number utilities
export const numberUtils = {
  // Format currency
  formatCurrency: (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // Format percentage
  formatPercentage: (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  // Format large numbers (e.g., 1.2K, 1.5M)
  formatLargeNumber: (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  // Calculate percentage change
  percentageChange: (oldValue: number, newValue: number): number => {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  },

  // Round to decimal places
  roundTo: (num: number, decimals: number): number => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  // Clamp number between min and max
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },

  // Generate random number between min and max
  randomBetween: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

// Array utilities
export const arrayUtils = {
  // Remove duplicates from array
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)];
  },

  // Group array by key
  groupBy: <T>(arr: T[], key: keyof T): Record<string, T[]> => {
    return arr.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  // Sort array by key
  sortBy: <T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Chunk array into smaller arrays
  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  // Get random item from array
  randomItem: <T>(arr: T[]): T | undefined => {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // Shuffle array
  shuffle: <T>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
};

// Object utilities
export const objectUtils = {
  // Deep clone object
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Pick specific keys from object
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omit specific keys from object
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  // Check if object is empty
  isEmpty: (obj: object): boolean => {
    return Object.keys(obj).length === 0;
  },

  // Merge objects deeply
  deepMerge: <T>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = objectUtils.deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
    return result;
  },
};

// Business logic utilities
export const businessUtils = {
  // Calculate ROI
  calculateROI: (revenue: number, investment: number): number => {
    if (investment === 0) return 0;
    return (revenue - investment) / investment;
  },

  // Calculate conversion rate
  calculateConversionRate: (conversions: number, total: number): number => {
    if (total === 0) return 0;
    return conversions / total;
  },

  // Calculate average deal size
  calculateAverageDealSize: (totalRevenue: number, numberOfDeals: number): number => {
    if (numberOfDeals === 0) return 0;
    return totalRevenue / numberOfDeals;
  },

  // Calculate customer lifetime value
  calculateCLV: (averageOrderValue: number, purchaseFrequency: number, customerLifespan: number): number => {
    return averageOrderValue * purchaseFrequency * customerLifespan;
  },

  // Calculate churn rate
  calculateChurnRate: (customersLost: number, totalCustomers: number): number => {
    if (totalCustomers === 0) return 0;
    return customersLost / totalCustomers;
  },

  // Calculate growth rate
  calculateGrowthRate: (currentValue: number, previousValue: number): number => {
    if (previousValue === 0) return currentValue > 0 ? 1 : 0;
    return (currentValue - previousValue) / previousValue;
  },

  // Generate sales pipeline stages
  getDefaultSalesStages: (): Array<{
    name: string;
    order: number;
    color: string;
    description: string;
  }> => [
    { name: "Lead", order: 1, color: "#3B82F6", description: "Initial contact or inquiry" },
    { name: "Opportunity", order: 2, color: "#8B5CF6", description: "Qualified prospect with potential" },
    { name: "Proposal", order: 3, color: "#F59E0B", description: "Formal proposal submitted" },
    { name: "Negotiation", order: 4, color: "#EF4444", description: "Terms and pricing discussion" },
    { name: "Closed Won", order: 5, color: "#10B981", description: "Deal successfully closed" },
    { name: "Closed Lost", order: 6, color: "#6B7280", description: "Deal lost to competitor or cancelled" },
  ],
};

// Color utilities
export const colorUtils = {
  // Generate random hex color
  randomHex: (): string => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },

  // Get color for status
  getStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      active: '#10B981',
      completed: '#059669',
      draft: '#6B7280',
      scheduled: '#3B82F6',
      paused: '#F59E0B',
      cancelled: '#EF4444',
      'in-progress': '#8B5CF6',
      planning: '#6366F1',
      delayed: '#DC2626',
      lead: '#3B82F6',
      opportunity: '#8B5CF6',
      proposal: '#F59E0B',
      negotiation: '#EF4444',
      'closed-won': '#10B981',
      'closed-lost': '#6B7280',
    };
    return colors[status] || '#6B7280';
  },

  // Get color for priority
  getPriorityColor: (priority: string): string => {
    const colors: Record<string, string> = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
    };
    return colors[priority] || '#6B7280';
  },
};

// Search and filter utilities
export const searchUtils = {
  // Simple text search
  searchText: (text: string, query: string): boolean => {
    return text.toLowerCase().includes(query.toLowerCase());
  },

  // Search in object properties
  searchObject: (obj: Record<string, any>, query: string, fields: string[]): boolean => {
    return fields.some(field => {
      const value = obj[field];
      if (typeof value === 'string') {
        return searchUtils.searchText(value, query);
      }
      return false;
    });
  },

  // Filter array by search query
  filterBySearch: <T>(
    items: T[], 
    query: string, 
    searchFields: (keyof T)[]
  ): T[] => {
    if (!query.trim()) return items;
    
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return searchUtils.searchText(value, query);
        }
        return false;
      })
    );
  },

  // Highlight search terms in text
  highlightSearch: (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
};

// Pagination utilities
export const paginationUtils = {
  // Calculate pagination info
  getPaginationInfo: (total: number, page: number, limit: number) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
      start,
      end,
    };
  },

  // Get page slice of array
  getPageSlice: <T>(items: T[], page: number, limit: number): T[] => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return items.slice(start, end);
  },
};

// Error handling utilities
export const errorUtils = {
  // Create standardized error
  createError: (message: string, code?: string, details?: any) => {
    return {
      message,
      code: code || 'UNKNOWN_ERROR',
      details,
      timestamp: Date.now(),
    };
  },

  // Check if error is of specific type
  isErrorType: (error: any, type: string): boolean => {
    return error?.code === type;
  },

  // Format error for user display
  formatErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  },
};

// Type guards and validation helpers
export const typeGuards = {
  // Check if value is defined
  isDefined: <T>(value: T | undefined | null): value is T => {
    return value !== undefined && value !== null;
  },

  // Check if value is string
  isString: (value: any): value is string => {
    return typeof value === 'string';
  },

  // Check if value is number
  isNumber: (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },

  // Check if value is boolean
  isBoolean: (value: any): value is boolean => {
    return typeof value === 'boolean';
  },

  // Check if value is array
  isArray: (value: any): value is any[] => {
    return Array.isArray(value);
  },

  // Check if value is object
  isObject: (value: any): value is object => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  // Check if value is valid ID
  isValidId: (value: any): value is Id<any> => {
    return typeof value === 'string' && value.length > 0;
  },
};
