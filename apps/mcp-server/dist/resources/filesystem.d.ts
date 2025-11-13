/**
 * MCP Resources - Filesystem-based tool discovery
 * Exposes tools as readable TypeScript files that agents can discover and read progressively
 */
/**
 * Gets a list of all available tool files (resources)
 */
export declare function listToolResources(): {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}[];
/**
 * Reads the content of a tool file by URI
 * @param uri - File URI (e.g., 'file:///servers/tasks/index.ts')
 * @returns File content as string
 */
export declare function readToolResource(uri: string): string;
/**
 * Gets a directory listing (simulated filesystem structure)
 * @param path - Directory path (e.g., '/servers/', '/servers/tasks/')
 * @returns List of files/directories in the path
 */
export declare function listDirectory(path: string): Array<{
    name: string;
    type: 'file' | 'directory';
}>;
/**
 * Checks if a resource exists
 * @param uri - Resource URI
 * @returns Whether the resource exists
 */
export declare function resourceExists(uri: string): boolean;
//# sourceMappingURL=filesystem.d.ts.map