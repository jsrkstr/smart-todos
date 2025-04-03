import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export class JWT {
  static async sign(payload: object): Promise<string> {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)
    
    return token
  }

  static async verify<T>(token: string): Promise<T> {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as T
  }
} 