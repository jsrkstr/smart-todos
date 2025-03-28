export interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  name?: string;
  email?: string;
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
