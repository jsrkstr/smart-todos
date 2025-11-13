/**
 * Code validation and security scanning
 * Detects potentially malicious patterns before execution
 */

import { CodeValidationResult } from './types'

/**
 * Dangerous patterns that should be blocked
 * These patterns can be used for malicious purposes
 */
const DANGEROUS_PATTERNS = [
  // Process and system access
  { pattern: /process\.exit/i, description: 'Process termination' },
  { pattern: /process\.kill/i, description: 'Process killing' },
  { pattern: /require\s*\(\s*['"]child_process['"]/i, description: 'Child process spawning' },
  { pattern: /require\s*\(\s*['"]fs['"]/i, description: 'Filesystem access (use virtual fs instead)' },
  { pattern: /require\s*\(\s*['"]net['"]/i, description: 'Network access' },
  { pattern: /require\s*\(\s*['"]http['"]/i, description: 'HTTP access' },
  { pattern: /require\s*\(\s*['"]https['"]/i, description: 'HTTPS access' },

  // Dynamic code execution
  { pattern: /\beval\s*\(/i, description: 'Dynamic code evaluation' },
  { pattern: /Function\s*\(/i, description: 'Dynamic function construction' },
  { pattern: /new\s+Function/i, description: 'Dynamic function construction' },

  // Module loading
  { pattern: /require\s*\(\s*['"]vm['"]/i, description: 'VM module access' },
  { pattern: /require\s*\(\s*['"]vm2['"]/i, description: 'VM2 module access' },

  // Dangerous globals
  { pattern: /\bglobal\./i, description: 'Global object access' },
  { pattern: /\bprocess\s*\[/i, description: 'Process object manipulation' },
]

/**
 * Allowed imports - whitelist of safe modules
 */
const ALLOWED_IMPORTS = [
  'fs/promises', // Virtual filesystem (mounted as tmpfs)
  '/servers/', // Tool imports
]

/**
 * Validates code for security issues before execution
 * @param code - The code to validate
 * @param language - Programming language
 * @returns Validation result with details
 */
export function validateCode(
  code: string,
  language: 'typescript' | 'javascript'
): CodeValidationResult {
  const violations: string[] = []

  // Check for dangerous patterns
  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      violations.push(description)
    }
  }

  // Check imports/requires
  const importMatches = code.match(
    /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g
  )

  if (importMatches) {
    for (const match of importMatches) {
      const moduleMatch = match.match(/['"]([^'"]+)['"]/)
      if (moduleMatch) {
        const moduleName = moduleMatch[1]

        // Check if it's an allowed import
        const isAllowed = ALLOWED_IMPORTS.some(allowed =>
          moduleName.startsWith(allowed)
        )

        if (!isAllowed && !moduleName.startsWith('.')) {
          violations.push(`Unauthorized module import: ${moduleName}`)
        }
      }
    }
  }

  // Return validation result
  if (violations.length > 0) {
    return {
      valid: false,
      reason: 'Code contains potentially dangerous patterns',
      violations
    }
  }

  return {
    valid: true
  }
}

/**
 * Sanitizes code by removing comments and normalizing whitespace
 * @param code - The code to sanitize
 * @returns Sanitized code
 */
export function sanitizeCode(code: string): string {
  // Remove single-line comments
  let sanitized = code.replace(/\/\/.*$/gm, '')

  // Remove multi-line comments
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '')

  // Normalize whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Checks if code has reasonable size limits
 * @param code - The code to check
 * @returns Whether code is within acceptable size
 */
export function validateCodeSize(code: string): CodeValidationResult {
  const MAX_CODE_SIZE = 100000 // 100KB
  const MAX_LINES = 5000

  if (code.length > MAX_CODE_SIZE) {
    return {
      valid: false,
      reason: `Code exceeds maximum size of ${MAX_CODE_SIZE} bytes`
    }
  }

  const lines = code.split('\n').length
  if (lines > MAX_LINES) {
    return {
      valid: false,
      reason: `Code exceeds maximum of ${MAX_LINES} lines`
    }
  }

  return {
    valid: true
  }
}
