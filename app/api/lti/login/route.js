import { NextResponse } from 'next/server';
import { LTI13Service } from '@/utils/lti13';

// Handle both GET and POST for LTI login initiation
async function handleLTILogin(request) {
  console.log(`[LTI Login] Received ${request.method} request to /api/lti/login`);
  
  try {
    let iss, login_hint, target_link_uri, lti_message_hint, client_id;

    if (request.method === 'GET') {
      // Handle GET parameters
      const { searchParams } = new URL(request.url);
      iss = searchParams.get('iss');
      login_hint = searchParams.get('login_hint');
      target_link_uri = searchParams.get('target_link_uri');
      lti_message_hint = searchParams.get('lti_message_hint');
      client_id = searchParams.get('client_id');
      console.log('[LTI Login] GET parameters:', Object.fromEntries(searchParams));
    } else if (request.method === 'POST') {
      // Handle POST form data
      const formData = await request.formData();
      iss = formData.get('iss');
      login_hint = formData.get('login_hint');
      target_link_uri = formData.get('target_link_uri');
      lti_message_hint = formData.get('lti_message_hint');
      client_id = formData.get('client_id');
      console.log('[LTI Login] POST form data:', Object.fromEntries(formData));
    }

    // Validate required parameters
    if (!iss || !login_hint || !target_link_uri || !client_id) {
      console.error('Missing LTI parameters:', {
        iss: !!iss,
        login_hint: !!login_hint,
        target_link_uri: !!target_link_uri,
        client_id: !!client_id,
        method: request.method
      });
      return NextResponse.json(
        { 
          error: 'Missing required OIDC parameters',
          missing: {
            iss: !iss,
            login_hint: !login_hint,
            target_link_uri: !target_link_uri,
            client_id: !client_id
          }
        },
        { status: 400 }
      );
    }

    const ltiService = new LTI13Service();
    
    console.log('[LTI Login] Environment LTI_CLIENT_ID:', process.env.LTI_CLIENT_ID);
    console.log('[LTI Login] Received client_id:', client_id);
    console.log('[LTI Login] LTI Service client_id:', ltiService.clientId);
    
    // Validate client_id
    if (client_id !== ltiService.clientId) {
      console.error('[LTI Login] Client ID mismatch!');
      return NextResponse.json(
        { error: 'Invalid client_id' },
        { status: 400 }
      );
    }

    // Generate state and nonce
    const state = ltiService.generateState();
    const nonce = ltiService.generateNonce();
    
    // Store state and nonce in session or database for validation
    // For now, we'll encode them in the redirect
    
    // Build authorization URL
    const authUrl = new URL(`${iss}/mod/lti/auth.php`);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('client_id', client_id);
    authUrl.searchParams.set('redirect_uri', ltiService.redirectUri);
    authUrl.searchParams.set('login_hint', login_hint);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', 'none');
    
    if (lti_message_hint) {
      authUrl.searchParams.set('lti_message_hint', lti_message_hint);
    }

    // Redirect to Moodle for authentication
    return NextResponse.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('LTI login initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate LTI login' },
      { status: 500 }
    );
  }
}

// Export both GET and POST handlers
export async function GET(request) {
  return handleLTILogin(request);
}

export async function POST(request) {
  return handleLTILogin(request);
}
