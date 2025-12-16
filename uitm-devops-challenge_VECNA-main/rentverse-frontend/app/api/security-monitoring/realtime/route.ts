import { NextRequest } from 'next/server'
import { forwardRequest, getAuthHeader, createErrorResponse } from '@/utils/apiForwarder'

export async function GET(request: NextRequest) {
  try {
    const response = await forwardRequest('/api/security-monitoring/realtime', {
      method: 'GET',
      headers: getAuthHeader(request),
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Security monitoring realtime API error:', error)

    return Response.json(
      createErrorResponse(
        'Failed to fetch realtime data',
        error instanceof Error ? error : undefined,
        500
      ),
      { status: 500 }
    )
  }
}