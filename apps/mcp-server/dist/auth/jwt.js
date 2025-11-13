import { jwtVerify } from 'jose';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
export class JWTAuth {
    /**
     * Verify a JWT token and extract the payload
     * @param token - The JWT token to verify
     * @returns The decoded payload with userId
     * @throws Error if token is invalid or expired
     */
    static async verify(token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            if (!payload.userId || typeof payload.userId !== 'string') {
                throw new Error('Invalid token: userId not found');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`JWT verification failed: ${error.message}`);
            }
            throw new Error('JWT verification failed: Unknown error');
        }
    }
    /**
     * Extract and verify token from Authorization header
     * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
     * @returns The decoded payload with userId
     * @throws Error if header format is invalid or token verification fails
     */
    static async verifyFromHeader(authHeader) {
        if (!authHeader) {
            throw new Error('Authorization header is required');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new Error('Invalid Authorization header format. Expected: Bearer <token>');
        }
        const token = parts[1];
        return await this.verify(token);
    }
}
//# sourceMappingURL=jwt.js.map