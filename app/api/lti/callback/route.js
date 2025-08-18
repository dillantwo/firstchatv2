import { NextResponse } from 'next/server';
import { LTI13Service } from '@/utils/lti13';
import LTIUser from '@/models/LTIUser';
import LTICourse from '@/models/LTICourse';
import connectDB from '@/config/db';
import jwt from 'jsonwebtoken';
import { syncChatflowsFromFlowise, shouldSyncChatflows } from '@/utils/chatflowSync';

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
    
    console.log('[LTI Callback] Extracted user info:', {
      sub: userInfo.sub,
      iss: userInfo.iss,
      context_id: userInfo.context_id,
      context_title: userInfo.context_title,
      resource_link_id: userInfo.resource_link_id,
      roles: userInfo.roles
    });
    
    // Validate required fields
    if (!userInfo.context_id) {
      console.error('[LTI Callback] Missing context_id in LTI payload');
      console.error('[LTI Callback] Full LTI payload context claim:', ltiPayload['https://purl.imsglobal.org/spec/lti/claim/context']);
      
      // Try to use resource_link_id as fallback context_id
      if (userInfo.resource_link_id) {
        console.log('[LTI Callback] Using resource_link_id as fallback context_id:', userInfo.resource_link_id);
        userInfo.context_id = userInfo.resource_link_id;
      } else {
        // Use a combination of iss and sub as last resort
        const fallbackContextId = `${userInfo.iss}_${userInfo.sub}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        console.log('[LTI Callback] Using fallback context_id:', fallbackContextId);
        userInfo.context_id = fallbackContextId;
        userInfo.context_title = userInfo.context_title || 'Default Course';
      }
    }
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    
    console.log('[LTI Callback] Processing LTI login for user:', userInfo.sub, 'course:', userInfo.context_id);
    
    // === 第一部分：处理用户基本信息 ===
    let user = await LTIUser.findOne({ 
      sub: userInfo.sub, 
      iss: userInfo.iss 
    });
    
    console.log('[LTI Callback] Looking for existing user with sub:', userInfo.sub, 'iss:', userInfo.iss);
    console.log('[LTI Callback] Found existing user:', user ? 'Yes' : 'No');
    
    if (user) {
      // Update existing user basic info
      user = await LTIUser.findByIdAndUpdate(
        user._id,
        {
          name: userInfo.name,
          username: userInfo.username,
          email: userInfo.email,
          platform_id: userInfo.platform_id,
          platform_name: userInfo.platform_name,
          context_id: userInfo.context_id, // Include context_id for the original model
          context_title: userInfo.context_title,
          context_label: userInfo.context_label,
          resource_link_id: userInfo.resource_link_id,
          resource_link_title: userInfo.resource_link_title,
          roles: userInfo.roles || [],
          session_id: sessionId,
          last_login: new Date(),
          isActive: true
        },
        { new: true }
      );
      console.log('[LTI Callback] Updated existing user:', user._id);
    } else {
      // Create new user (完整信息)
      user = new LTIUser({
        sub: userInfo.sub,
        iss: userInfo.iss,
        aud: userInfo.aud,
        name: userInfo.name,
        username: userInfo.username,
        email: userInfo.email,
        platform_id: userInfo.platform_id,
        platform_name: userInfo.platform_name,
        context_id: userInfo.context_id,
        context_title: userInfo.context_title,
        context_label: userInfo.context_label,
        resource_link_id: userInfo.resource_link_id,
        resource_link_title: userInfo.resource_link_title,
        roles: userInfo.roles || [],
        session_id: sessionId,
        last_login: new Date(),
        isActive: true
      });
      await user.save();
      console.log('[LTI Callback] Created new user:', user._id);
    }
    
    // === 第二部分：处理课程关联信息 ===
    let courseAssociation = await LTICourse.findOne({
      user_id: user._id,
      context_id: userInfo.context_id
    });
    
    console.log('[LTI Callback] Looking for existing course association for context:', userInfo.context_id);
    console.log('[LTI Callback] Found existing course association:', courseAssociation ? 'Yes' : 'No');
    
    if (courseAssociation) {
      // Update existing course association
      courseAssociation = await LTICourse.findByIdAndUpdate(
        courseAssociation._id,
        {
          context_title: userInfo.context_title,
          context_label: userInfo.context_label,
          resource_link_id: userInfo.resource_link_id,
          resource_link_title: userInfo.resource_link_title,
          roles: userInfo.roles || [],
          services: userInfo.services || {},
          launch_presentation: {
            locale: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation']?.locale,
            document_target: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation']?.document_target,
            return_url: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation']?.return_url
          },
          custom: {
            course_id: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/custom']?.course_id,
            course_name: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/custom']?.course_name || userInfo.context_title,
            user_roles: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/custom']?.user_roles
          },
          last_access: new Date(),
          access_count: courseAssociation.access_count + 1,
          isActive: true
        },
        { new: true }
      );
      console.log('[LTI Callback] Updated course association, access count:', courseAssociation.access_count);
    } else {
      // Create new course association
      courseAssociation = new LTICourse({
        user_id: user._id,
        sub: userInfo.sub,
        iss: userInfo.iss,
        context_id: userInfo.context_id,
        context_title: userInfo.context_title,
        context_label: userInfo.context_label,
        context_type: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/context']?.type || [],
        resource_link_id: userInfo.resource_link_id,
        resource_link_title: userInfo.resource_link_title,
        resource_link_description: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.description,
        roles: userInfo.roles || [],
        services: userInfo.services || {},
        launch_presentation: {
          locale: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation']?.locale,
          document_target: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation']?.document_target,
          return_url: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation']?.return_url
        },
        custom: {
          course_id: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/custom']?.course_id,
          course_name: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/custom']?.course_name || userInfo.context_title,
          user_roles: ltiPayload['https://purl.imsglobal.org/spec/lti/claim/custom']?.user_roles
        },
        first_access: new Date(),
        last_access: new Date(),
        access_count: 1,
        isActive: true
      });
      await courseAssociation.save();
      console.log('[LTI Callback] Created new course association:', courseAssociation._id);
    }
    
    // === 第三部分：同步Chatflow数据 ===
    console.log('[LTI Callback] 检查是否需要同步chatflow数据...');
    try {
      const needsSync = await shouldSyncChatflows();
      if (needsSync) {
        console.log('[LTI Callback] 开始同步chatflow数据...');
        const syncResult = await syncChatflowsFromFlowise();
        if (syncResult.success) {
          console.log(`[LTI Callback] Chatflow同步完成: 新增${syncResult.synced}, 更新${syncResult.updated}, 停用${syncResult.deactivated}`);
        } else {
          console.log(`[LTI Callback] Chatflow同步失败: ${syncResult.error}`);
        }
      } else {
        console.log('[LTI Callback] Chatflow数据最近已同步，跳过同步');
      }
    } catch (error) {
      console.error('[LTI Callback] Chatflow同步过程中发生错误:', error);
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
        roles: courseAssociation.roles, // 使用当前课程的角色
        context_id: courseAssociation.context_id, // 使用当前课程ID
        course_id: courseAssociation._id.toString(), // 课程关联ID
        session_id: sessionId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );
    
    // Create response with session cookie
    console.log('[LTI Callback] Request URL:', request.url);
    console.log('[LTI Callback] Creating redirect to home page');
    console.log('[LTI Callback] User-Course association completed');
    
    const redirectUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    console.log('[LTI Callback] Redirect URL:', redirectUrl);
    
    // Create response with 302 redirect
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
