import { NextResponse } from 'next/server';
import { LTI13Service } from '@/utils/lti13';
import LTIUser from '@/models/LTIUser';
import connectDB from '@/config/db';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const id_token = formData.get('id_token');
    const state = formData.get('state');
    
    if (!id_token) {
      return NextResponse.json(
        { error: 'Missing id_token' },
        { status: 400 }
      );
    }

    const ltiService = new LTI13Service();
    
    // Validate the LTI token
    const ltiPayload = await ltiService.validateLTIToken(id_token);
    
    // Extract user information
    const userInfo = ltiService.extractUserInfo(ltiPayload);
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    
    // Find or create user
    let user = await LTIUser.findOne({ 
      sub: userInfo.sub, 
      iss: userInfo.iss 
    });
    
    console.log('[LTI Callback] Looking for existing user with sub:', userInfo.sub, 'iss:', userInfo.iss);
    console.log('[LTI Callback] Found existing user:', user ? 'Yes' : 'No');
    
    if (user) {
      // Update existing user
      user = await LTIUser.findByIdAndUpdate(
        user._id,
        {
          ...userInfo,
          session_id: sessionId,
          last_login: new Date(),
          isActive: true
        },
        { new: true }
      );
      console.log('[LTI Callback] Updated existing user:', user._id);
    } else {
      // Create new user
      user = new LTIUser({
        ...userInfo,
        session_id: sessionId,
        last_login: new Date(),
        isActive: true
      });
      await user.save();
      console.log('[LTI Callback] Created new user:', user._id);
    }
    
    // Create JWT session token for our application
    const sessionToken = jwt.sign(
      {
        userId: user._id.toString(),
        sub: user.sub,
        iss: user.iss,
        email: user.email,
        name: user.name,
        username: user.username,
        roles: user.roles,
        context_id: user.context_id,
        session_id: sessionId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );
    
    // Create response with session cookie
    console.log('[LTI Callback] Request URL:', request.url);
    console.log('[LTI Callback] Creating redirect to home page');
    
    const redirectUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    console.log('[LTI Callback] Redirect URL:', redirectUrl);
    
    // Create response with 302 redirect instead of 307
    const response = new NextResponse(null, {
      status: 302,
      headers: {
        'Location': redirectUrl
      }
    });
    
    // Set secure HTTP-only cookie
    response.cookies.set('lti_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Use 'lax' in development
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });
    
    console.log('[LTI Callback] Cookie set with sameSite:', process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    
    return response;
    
  } catch (error) {
    console.error('LTI callback error:', error);
    
    // Create error page response
    const errorPage = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LTI Login Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; background: #fee; padding: 20px; border: 1px solid red; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Login Failed</h2>
            <p>Unable to authenticate with Moodle LTI. Please try again.</p>
            <p><strong>Error:</strong> ${error.message}</p>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(errorPage, {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
