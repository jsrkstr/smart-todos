// Test if the Google token has calendar access
const { PrismaClient } = require('@prisma/client')
const { google } = require('googleapis')
const { OAuth2Client } = require('google-auth-library')

const prisma = new PrismaClient()

async function testToken() {
  try {
    // Get the connection
    const connection = await prisma.calendarConnection.findFirst({
      where: { provider: 'google' }
    })

    if (!connection) {
      console.log('❌ No Google calendar connection found')
      return
    }

    console.log('✅ Found connection:', connection.id)
    console.log('Access Token:', connection.accessToken?.substring(0, 50) + '...')
    console.log('Refresh Token:', connection.refreshToken?.substring(0, 50) + '...')
    console.log('Token Expiry:', connection.tokenExpiry)
    console.log('')

    // Test 1: Check token info
    console.log('🔍 Test 1: Checking token info...')
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${connection.accessToken}`)
      const tokenInfo = await response.json()

      console.log('Token Info:')
      console.log('  Issued to:', tokenInfo.issued_to)
      console.log('  Audience:', tokenInfo.audience)
      console.log('  Scope:', tokenInfo.scope)
      console.log('  Expires in:', tokenInfo.expires_in, 'seconds')
      console.log('')

      if (tokenInfo.scope && tokenInfo.scope.includes('calendar')) {
        console.log('✅ Token has calendar scope!')
      } else {
        console.log('❌ Token does NOT have calendar scope!')
        console.log('   Available scopes:', tokenInfo.scope)
      }
    } catch (error) {
      console.error('❌ Error checking token:', error.message)
    }

    console.log('')
    console.log('🔍 Test 2: Trying to call Calendar API...')

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiry?.getTime()
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    try {
      const response = await calendar.calendarList.list()
      console.log('✅ Successfully called Calendar API!')
      console.log('   Found', response.data.items?.length || 0, 'calendars')

      if (response.data.items) {
        response.data.items.forEach((cal, idx) => {
          console.log(`   ${idx + 1}. ${cal.summary} (${cal.id})`)
        })
      }
    } catch (error) {
      console.error('❌ Calendar API call failed:', error.message)
      if (error.code === 401) {
        console.log('')
        console.log('💡 This means the token does not have calendar permissions.')
        console.log('   You need to reconnect your Google account with calendar access.')
        console.log('   Visit: http://localhost:3000/api/calendar/connect')
      }
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testToken()
