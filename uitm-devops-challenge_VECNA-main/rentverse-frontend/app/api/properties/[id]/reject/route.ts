import { NextRequest, NextResponse } from 'next/server'
import { propertiesApiForwarder } from '@/utils/apiForwarder'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return propertiesApiForwarder(request, `/api/properties/${id}/reject`)
}