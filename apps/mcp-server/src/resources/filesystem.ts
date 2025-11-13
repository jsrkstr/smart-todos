/**
 * MCP Resources - Filesystem-based tool discovery
 * Exposes tools as readable TypeScript files that agents can discover and read progressively
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Tool file mappings - virtual filesystem structure
 * Maps URI paths to actual file paths
 */
const TOOL_FILES: Record<string, string> = {
  // Root index
  'file:///servers/index.ts': join(__dirname, '../tools-as-code/index.ts'),
  'file:///servers/README.md': join(__dirname, '../tools-as-code/README.md'),

  // Task tools
  'file:///servers/tasks/index.ts': join(__dirname, '../tools-as-code/tasks/index.ts'),

  // User tools
  'file:///servers/users/index.ts': join(__dirname, '../tools-as-code/users/index.ts'),

  // Chat tools
  'file:///servers/chat/index.ts': join(__dirname, '../tools-as-code/chat/index.ts'),

  // Pomodoro tools
  'file:///servers/pomodoro/index.ts': join(__dirname, '../tools-as-code/pomodoro/index.ts'),

  // Internal utilities
  'file:///servers/internal.ts': join(__dirname, '../tools-as-code/internal.ts')
}

/**
 * Gets a list of all available tool files (resources)
 */
export function listToolResources() {
  return Object.entries(TOOL_FILES).map(([uri, _filePath]) => {
    // Determine mime type and description based on path
    const isMarkdown = uri.endsWith('.md')
    const isIndex = uri.includes('index.ts')

    let name: string
    let description: string

    if (uri === 'file:///servers/index.ts') {
      name = 'Tools Index'
      description = 'Main entry point for all Smart Todos tools'
    } else if (uri === 'file:///servers/README.md') {
      name = 'Tools Documentation'
      description = 'Overview of the tools-as-code architecture'
    } else if (uri.includes('/tasks/')) {
      name = 'Task Tools'
      description = 'Functions for managing tasks (create, update, delete, get)'
    } else if (uri.includes('/users/')) {
      name = 'User Tools'
      description = 'Functions for user profile, settings, and psych profile'
    } else if (uri.includes('/chat/')) {
      name = 'Chat Tools'
      description = 'Functions for chat history and messaging'
    } else if (uri.includes('/pomodoro/')) {
      name = 'Pomodoro Tools'
      description = 'Functions for pomodoro session tracking'
    } else if (uri.includes('internal.ts')) {
      name = 'Internal Utilities'
      description = 'Internal functions for calling tools (advanced)'
    } else {
      name = uri.split('/').pop() || uri
      description = `Tool file: ${name}`
    }

    return {
      uri,
      name,
      description,
      mimeType: isMarkdown ? 'text/markdown' : 'text/typescript'
    }
  })
}

/**
 * Reads the content of a tool file by URI
 * @param uri - File URI (e.g., 'file:///servers/tasks/index.ts')
 * @returns File content as string
 */
export function readToolResource(uri: string): string {
  const filePath = TOOL_FILES[uri]

  if (!filePath) {
    throw new Error(`Resource not found: ${uri}`)
  }

  try {
    return readFileSync(filePath, 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to read resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Gets a directory listing (simulated filesystem structure)
 * @param path - Directory path (e.g., '/servers/', '/servers/tasks/')
 * @returns List of files/directories in the path
 */
export function listDirectory(path: string): Array<{ name: string; type: 'file' | 'directory' }> {
  // Normalize path
  const normalizedPath = path.endsWith('/') ? path : `${path}/`

  // Get all URIs that start with this path
  const prefix = `file://${normalizedPath}`
  const items = new Set<string>()

  for (const uri of Object.keys(TOOL_FILES)) {
    if (uri.startsWith(prefix)) {
      const remainder = uri.slice(prefix.length)
      const parts = remainder.split('/')

      if (parts.length === 1) {
        // It's a file in this directory
        items.add(parts[0])
      } else if (parts.length > 1) {
        // It's in a subdirectory
        items.add(parts[0] + '/')
      }
    }
  }

  return Array.from(items)
    .sort()
    .map(name => ({
      name,
      type: name.endsWith('/') ? 'directory' as const : 'file' as const
    }))
}

/**
 * Checks if a resource exists
 * @param uri - Resource URI
 * @returns Whether the resource exists
 */
export function resourceExists(uri: string): boolean {
  return uri in TOOL_FILES
}
