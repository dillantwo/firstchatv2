import { NextResponse } from 'next/server';
import { LTI13Service } from '@/utils/lti13';

export async function GET(request) {
  try {
    const ltiService = new LTI13Service();
    const jwks = ltiService.generateJWKS();
    
    return NextResponse.json(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('JWKS endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate JWKS' },
      { status: 500 }
    );
  }
}
