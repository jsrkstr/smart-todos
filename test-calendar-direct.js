// Test Calendar API with direct HTTP request
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDirect() {
  try {
    const connection = await prisma.calendarConnection.findFirst({
      where: { provider: 'google' }
    })

    if (!connection || !connection.accessToken) {
      console.log('❌ No connection or token found')
      return
    }

    console.log('Testing Calendar API with direct HTTP request...')
    console.log('Access Token:', connection.accessToken.substring(0, 50) + '...')
    console.log('')

    // Test 1: List calendars with direct fetch
    console.log('🔍 Test 1: GET /users/me/calendarList')
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Accept': 'application/json'
        }
      })

      console.log('Response status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Success! Found', data.items?.length || 0, 'calendars')
        if (data.items) {
          data.items.forEach((cal, idx) => {
            console.log(`   ${idx + 1}. ${cal.summary} (${cal.id})`)
          })
        }
      } else {
        const errorData = await response.json()
        console.log('❌ Failed:', errorData)
        console.log('')

        if (response.status === 401) {
          console.log('🔍 Checking if Calendar API is enabled...')
          console.log('Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com')
          console.log('Make sure the Calendar API is ENABLED for your project')
        } else if (response.status === 403) {
          console.log('🔍 This is a permissions error')
          console.log('The API might be enabled but quotas or permissions are restricted')
        }
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
    }

    console.log('')
    console.log('🔍 Test 2: GET /calendars/primary')
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Accept': 'application/json'
        }
      })

      console.log('Response status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Success! Calendar:', data.summary)
        console.log('   ID:', data.id)
        console.log('   Time Zone:', data.timeZone)
      } else {
        const errorData = await response.json()
        console.log('❌ Failed:', errorData)
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
    }

    console.log('')
    console.log('🔍 Test 3: Check project APIs')
    console.log('Visit: https://console.cloud.google.com/apis/dashboard')
    console.log('Look for "Google Calendar API" in the list of enabled APIs')

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDirect()
