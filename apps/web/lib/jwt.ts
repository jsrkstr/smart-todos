import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export class JWT {
  static async sign(payload: object): Promise<string> {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  }

  static async verify<T>(token: string): Promise<T> {
    return jwt.verify(token, JWT_SECRET) as T
  }
} 