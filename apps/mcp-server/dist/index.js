#!/usr/bin/env node
import { SmartTodosMCPServer } from './server';
async function main() {
    try {
        const server = new SmartTodosMCPServer();
        await server.start();
    }
    catch (error) {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map