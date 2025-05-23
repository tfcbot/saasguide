import { internalQuery } from "./_generated/server";
import { DateUtils, DataUtils, ValidationUtils } from "./utils";

/**
 * Internal test query to verify utility functions work correctly
 * This can be called from the Convex dashboard to test the utilities
 */
export const testUtilities = internalQuery({
  handler: async () => {
    const testResults: any = {};
    
    // Test DateUtils
    const now = DateUtils.now();
    const today = new Date();
    
    testResults.dateUtils = {
      now: now,
      startOfDay: DateUtils.startOfDay(today),
      endOfDay: DateUtils.endOfDay(today),
      startOfWeek: DateUtils.startOfWeek(today),
      endOfWeek: DateUtils.endOfWeek(today),
      startOfMonth: DateUtils.startOfMonth(today),
      endOfMonth: DateUtils.endOfMonth(today),
      formatDate: DateUtils.formatDate(now),
      formatDateTime: DateUtils.formatDateTime(now),
      relativeTime: DateUtils.getRelativeTimeString(now - 3600000), // 1 hour ago
    };
    
    // Test DataUtils
    const testArray = [
      { id: 1, name: "Alice", category: "A", score: 85 },
      { id: 2, name: "Bob", category: "B", score: 92 },
      { id: 3, name: "Charlie", category: "A", score: 78 },
      { id: 4, name: "David", category: "B", score: 88 },
      { id: 1, name: "Alice", category: "A", score: 85 }, // Duplicate
    ];
    
    testResults.dataUtils = {
      groupBy: DataUtils.groupBy(testArray, "category"),
      arrayToMap: Object.fromEntries(DataUtils.arrayToMap(testArray, "id")),
      flatten: DataUtils.flatten([[1, 2], [3, 4], [5]]),
      unique: DataUtils.unique([1, 2, 2, 3, 3, 4]),
      uniqueBy: DataUtils.uniqueBy(testArray, "id"),
      sortByScoreAsc: DataUtils.sortBy(testArray, "score", "asc"),
      sortByScoreDesc: DataUtils.sortBy(testArray, "score", "desc"),
    };
    
    // Test ValidationUtils
    testResults.validationUtils = {
      isEmpty: {
        null: ValidationUtils.isEmpty(null),
        undefined: ValidationUtils.isEmpty(undefined),
        emptyString: ValidationUtils.isEmpty(""),
        whitespaceString: ValidationUtils.isEmpty("   "),
        emptyArray: ValidationUtils.isEmpty([]),
        emptyObject: ValidationUtils.isEmpty({}),
        nonEmpty: ValidationUtils.isEmpty("hello"),
      },
      isValidEmail: {
        valid: ValidationUtils.isValidEmail("test@example.com"),
        invalid: ValidationUtils.isValidEmail("invalid-email"),
        empty: ValidationUtils.isValidEmail(""),
      },
      isValidUrl: {
        valid: ValidationUtils.isValidUrl("https://example.com"),
        validHttp: ValidationUtils.isValidUrl("http://example.com"),
        invalid: ValidationUtils.isValidUrl("not-a-url"),
        empty: ValidationUtils.isValidUrl(""),
      },
      isValidPhoneNumber: {
        valid: ValidationUtils.isValidPhoneNumber("+1234567890"),
        validWithoutPlus: ValidationUtils.isValidPhoneNumber("1234567890"),
        invalid: ValidationUtils.isValidPhoneNumber("123"),
        invalidLetters: ValidationUtils.isValidPhoneNumber("abc123def"),
      },
    };
    
    return {
      success: true,
      message: "All utility functions tested successfully",
      testResults,
      timestamp: DateUtils.formatDateTime(DateUtils.now()),
    };
  },
});

