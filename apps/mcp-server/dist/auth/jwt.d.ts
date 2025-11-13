export interface JWTPayload {
    userId: string;
    [key: string]: any;
}
export declare class JWTAuth {
    /**
     * Verify a JWT token and extract the payload
     * @param token - The JWT token to verify
     * @returns The decoded payload with userId
     * @throws Error if token is invalid or expired
     */
    static verify(token: string): Promise<JWTPayload>;
    /**
     * Extract and verify token from Authorization header
     * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
     * @returns The decoded payload with userId
     * @throws Error if header format is invalid or token verification fails
     */
    static verifyFromHeader(authHeader: string | undefined): Promise<JWTPayload>;
}
//# sourceMappingURL=jwt.d.ts.map