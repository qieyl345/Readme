import { NextRequest, NextResponse } from 'next/server'
import { forwardRequest, getAuthHeader } from '@/utils/apiForwarder'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const endpoint = `/api/bookings/${bookingId}`

    const response = await forwardRequest(endpoint, {
      method: 'GET',
      headers: getAuthHeader(request)
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Booking by ID API forwarding error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}