import { NextRequest, NextResponse } from 'next/server'
import { forwardRequest, getAuthHeader } from '@/utils/apiForwarder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    const response = await forwardRequest('/api/bookings', {
      method: 'POST',
      headers: {
        ...getAuthHeader(request),
        'Content-Type': 'application/json'
      },
      body
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Bookings API forwarding error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}