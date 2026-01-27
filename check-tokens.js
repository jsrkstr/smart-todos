// Check calendar connection tokens
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTokens() {
  try {
    const connections = await prisma.calendarConnection.findMany({
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        tokenExpiry: true,
        accessToken: true,
        refreshToken: true,
        userId: true
      }
    })

    console.log('📊 Calendar Connections:')
    console.log('========================\n')

    if (connections.length === 0) {
      console.log('❌ No calendar connections found')
      return
    }

    connections.forEach((conn, idx) => {
      console.log(`Connection ${idx + 1}:`)
      console.log(`  ID: ${conn.id}`)
      console.log(`  Provider: ${conn.provider}`)
      console.log(`  Name: ${conn.name}`)
      console.log(`  User ID: ${conn.userId}`)
      console.log(`  Active: ${conn.isActive}`)
      console.log(`  Has Access Token: ${conn.accessToken ? '✅ Yes' : '❌ No'}`)
      console.log(`  Has Refresh Token: ${conn.refreshToken ? '✅ Yes' : '❌ No'}`)
      console.log(`  Token Expiry: ${conn.tokenExpiry || 'Not set'}`)

      if (conn.tokenExpiry) {
        const now = new Date()
        const isExpired = new Date(conn.tokenExpiry) < now
        console.log(`  Token Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`)
      }

      if (conn.accessToken) {
        console.log(`  Access Token (first 50 chars): ${conn.accessToken.substring(0, 50)}...`)
      }
      if (conn.refreshToken) {
        console.log(`  Refresh Token (first 50 chars): ${conn.refreshToken.substring(0, 50)}...`)
      }

      console.log('')
    })

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTokens()
