export const runtime = 'edge'; // 'nodejs' is the default
 
export function POST(request: Request) {
    const waitTime = request.headers.get('wait-time') || '1000'
    
    setTimeout(async () => {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: request.body,
          })
        console.log('Push notification sent successfully')
    }, parseInt(waitTime))

    return new Response(`I am an Edge Function!`, {
      status: 200,
    });
}
