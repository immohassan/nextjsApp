import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchName, salesNavUrl } = body

    if (!searchName || !salesNavUrl) {
      return NextResponse.json(
        { error: 'searchName and salesNavUrl are required' },
        { status: 400 }
      )
    }

    // Call external webhook from server (no CORS issues)
    const webhookResponse = await fetch('https://goclienflow.com/webhook/076f4358-cad3-4ac4-916b-8f79b143b05b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchName,
        salesNavUrl,
      })
    })

    // Forward the response from the webhook
    const responseData = await webhookResponse.text()
    
    // Try to parse as JSON, if it fails, return as text
    let jsonData
    try {
      jsonData = JSON.parse(responseData)
    } catch {
      jsonData = { message: responseData }
    }

    // If webhook returns success message, return 200 regardless of status code
    if (jsonData.data === 'success' || jsonData.success) {
      return NextResponse.json(
        jsonData,
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    // Otherwise, forward the status code from webhook
    return NextResponse.json(
      jsonData,
      { 
        status: webhookResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to submit request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

