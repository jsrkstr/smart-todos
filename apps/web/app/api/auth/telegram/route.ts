import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { JWT } from '@/lib/jwt'
import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME

function validateTelegramHash(data: any): boolean {
  const secret = crypto.createHash('sha256')
    .update(BOT_TOKEN!)
    .digest()

  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n')

  const hash = crypto.createHmac('sha256', secret)
    .update(checkString)
    .digest('hex')

  return data.hash === hash
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const data = Object.fromEntries(searchParams.entries())

  if (!data.hash) {
    // Generate Telegram login widget URL
    const botUrl = `https://t.me/${BOT_USERNAME}?start=auth`
    return NextResponse.redirect(botUrl)
  }

  try {
    // Validate hash
    if (!validateTelegramHash(data)) {
      throw new Error('Invalid hash')
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: `${data.id}@telegram.com` },
      update: {},
      create: {
        email: `${data.id}@telegram.com`,
        name: data.first_name + (data.last_name ? ` ${data.last_name}` : ''),
        principles: [],
        inspirations: []
      }
    })

    // Generate JWT
    const jwt = await JWT.sign({ userId: user.id })
    
    // Set cookie
    cookies().set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    // Redirect to home or onboarding
    if (user.principles.length === 0) {
      return NextResponse.redirect('/onboarding')
    }
    return NextResponse.redirect('/')
  } catch (error) {
    console.error('Telegram OAuth error:', error)
    return NextResponse.redirect('/login?error=oauth_failed')
  }
} 