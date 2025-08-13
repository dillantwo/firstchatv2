import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import LTIUser from '@/models/LTIUser';
import connectDB from '@/config/db';

export async function GET(request) {
  try {
    await connectDB();
    
    const token = request.cookies.get('lti_session')?.value;
    console.log('[LTI Session] Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('[LTI Session] No token, returning unauthorized');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('[LTI Session] Token decoded, userId:', decoded.userId);
    
    // Get user from database
    const user = await LTIUser.findById(decoded.userId);
    console.log('[LTI Session] User found:', user ? 'Yes' : 'No');
    
    if (!user || !user.isActive) {
      console.log('[LTI Session] User not found or inactive');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Return user information (excluding sensitive data)
    const userInfo = {
      id: user._id.toString(),
      sub: user.sub,
      name: user.name,
      username: user.username,
      email: user.email,
      given_name: user.given_name,
      family_name: user.family_name,
      picture: user.picture,
      roles: user.roles,
      context_id: user.context_id,
      context_label: user.context_label,
      context_title: user.context_title,
      resource_link_id: user.resource_link_id,
      resource_link_title: user.resource_link_title,
      platform_name: user.platform_name,
      isInstructor: user.roles?.some(role => 
        role.includes('Instructor') || 
        role.includes('ContentDeveloper') || 
        role.includes('Manager')
      ) || false,
      isLearner: user.roles?.some(role => 
        role.includes('Learner')
      ) || false
    };
    
    console.log('[LTI Session] Returning authenticated user:', userInfo.name);
    return NextResponse.json({ 
      authenticated: true, 
      user: userInfo 
    });
    
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    // Logout - clear session
    const response = NextResponse.json({ success: true });
    response.cookies.delete('lti_session');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
