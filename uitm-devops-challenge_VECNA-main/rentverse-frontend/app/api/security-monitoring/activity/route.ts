import { NextRequest } from 'next/server'
import { forwardRequest, getAuthHeader, createErrorResponse } from '@/utils/apiForwarder'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/api/security-monitoring/activity?${queryString}` : '/api/security-monitoring/activity'

    const response = await forwardRequest(endpoint, {
      method: 'GET',
      headers: getAuthHeader(request),
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Security monitoring activity API error:', error)

    return Response.json(
      createErrorResponse(
        'Failed to fetch activity logs',
        error instanceof Error ? error : undefined,
        500
      ),
      { status: 500 }
    )
  }
}