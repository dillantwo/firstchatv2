import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import LTIUser from '@/models/LTIUser';
import LTICourse from '@/models/LTICourse';
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
    console.log('[LTI Session] Looking for user with ID:', decoded.userId);
    console.log('[LTI Session] Using model:', LTIUser.modelName);
    console.log('[LTI Session] Collection name:', LTIUser.collection.name);
    
    const user = await LTIUser.findById(decoded.userId);
    console.log('[LTI Session] User found:', user ? 'Yes' : 'No');
    console.log('[LTI Session] User query result:', user ? `Name: ${user.name}, Active: ${user.isActive}` : 'null');
    
    if (!user || !user.isActive) {
      console.log('[LTI Session] User not found or inactive');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Get the most recent course association for this user
    const courseAssociation = await LTICourse.findOne({
      user_id: user._id
    }).sort({ last_access: -1 });
    
    console.log('[LTI Session] Course association found:', courseAssociation ? 'Yes' : 'No');
    
    if (!courseAssociation) {
      console.log('[LTI Session] No course association found for user');
      return NextResponse.json({ authenticated: false, message: 'No course association found' }, { status: 401 });
    }
    
    // Return user information (combining user info and course context)
    const userInfo = {
      id: user._id.toString(),
      sub: user.sub,
      name: user.name,
      username: user.username,
      email: user.email,
      platform_name: user.platform_name,
      // Always use course association context (since we removed these fields from user)
      context_id: courseAssociation.context_id,
      context_label: courseAssociation.context_label,
      context_title: courseAssociation.context_title,
      resource_link_id: courseAssociation.resource_link_id,
      resource_link_title: courseAssociation.resource_link_title,
      roles: courseAssociation.roles || [],
      isInstructor: (courseAssociation.roles || []).some(role => 
        role.includes('Instructor') || 
        role.includes('ContentDeveloper') ||
        role.includes('Manager')
      ) || false,
      isLearner: (courseAssociation.roles || []).some(role => 
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
