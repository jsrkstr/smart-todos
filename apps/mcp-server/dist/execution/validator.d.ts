/**
 * Code validation and security scanning
 * Detects potentially malicious patterns before execution
 */
import { CodeValidationResult } from './types';
/**
 * Validates code for security issues before execution
 * @param code - The code to validate
 * @param language - Programming language
 * @returns Validation result with details
 */
export declare function validateCode(code: string, language: 'typescript' | 'javascript'): CodeValidationResult;
/**
 * Sanitizes code by removing comments and normalizing whitespace
 * @param code - The code to sanitize
 * @returns Sanitized code
 */
export declare function sanitizeCode(code: string): string;
/**
 * Checks if code has reasonable size limits
 * @param code - The code to check
 * @returns Whether code is within acceptable size
 */
export declare function validateCodeSize(code: string): CodeValidationResult;
//# sourceMappingURL=validator.d.ts.map