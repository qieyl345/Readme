import { NextRequest, NextResponse } from 'next/server'
import { propertiesApiForwarder } from '@/utils/apiForwarder'

export async function GET(request: NextRequest) {
  return propertiesApiForwarder(request, '/api/properties/auto-approve/status')
}