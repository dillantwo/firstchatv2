import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import Chat from '../../../../models/Chat.js';
import LTIUser from '../../../../models/LTIUser.js';
import LTICourse from '../../../../models/LTICourse.js';
// import { checkAdminPermission } from '../../../../utils/adminAuth.js';

/**
 * Get token usage statistics by course
 * 
 * Query parameters:
 * - courseId: Specific course to filter by (optional)
 * - startDate: Start date for filtering (optional)
 * - endDate: End date for filtering (optional)
 * - groupBy: Group by 'course', 'user', or 'chatflow' (default: 'course')
 */
export async function GET(request) {
  try {
    // 检查管理员权限 - 暂时禁用
    // const authResult = await checkAdminPermission(request);
    // if (authResult.error) {
    //   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    // }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'course';

    console.log('[Token Usage API] Query params:', { courseId, startDate, endDate, groupBy });

    // Build aggregation pipeline based on parameters
    const pipeline = [];

    // Match stage - filter by course and date range
    const matchConditions = {};
    
    if (courseId) {
      matchConditions.courseId = courseId;
    }
    
    if (startDate || endDate) {
      matchConditions.updatedAt = {};
      if (startDate) {
        matchConditions.updatedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.updatedAt.$lte = new Date(endDate);
      }
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Unwind messages to count them individually
    pipeline.push({ $unwind: '$messages' });

    // Count messages by different criteria based on groupBy parameter
    let groupStage = {};
    
    switch (groupBy) {
      case 'course':
        groupStage = {
          $group: {
            _id: '$courseId',
            totalMessages: { $sum: 1 },
            userMessages: { $sum: { $cond: [{ $eq: ['$messages.role', 'user'] }, 1, 0] } },
            assistantMessages: { $sum: { $cond: [{ $eq: ['$messages.role', 'assistant'] }, 1, 0] } },
            // Token usage aggregation
            totalPromptTokens: { $sum: '$messages.tokenUsage.promptTokens' },
            totalCompletionTokens: { $sum: '$messages.tokenUsage.completionTokens' },
            totalTokens: { $sum: '$messages.tokenUsage.totalTokens' },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueChats: { $addToSet: '$_id' },
            chatflows: { $addToSet: '$chatflowId' },
            lastActivity: { $max: '$updatedAt' }
          }
        };
        break;
        
      case 'user':
        groupStage = {
          $group: {
            _id: {
              courseId: '$courseId',
              userId: '$userId'
            },
            totalMessages: { $sum: 1 },
            userMessages: { $sum: { $cond: [{ $eq: ['$messages.role', 'user'] }, 1, 0] } },
            assistantMessages: { $sum: { $cond: [{ $eq: ['$messages.role', 'assistant'] }, 1, 0] } },
            // Token usage aggregation
            totalPromptTokens: { $sum: '$messages.tokenUsage.promptTokens' },
            totalCompletionTokens: { $sum: '$messages.tokenUsage.completionTokens' },
            totalTokens: { $sum: '$messages.tokenUsage.totalTokens' },
            uniqueChats: { $addToSet: '$_id' },
            chatflows: { $addToSet: '$chatflowId' },
            lastActivity: { $max: '$updatedAt' }
          }
        };
        break;
        
      case 'chatflow':
        groupStage = {
          $group: {
            _id: {
              courseId: '$courseId',
              chatflowId: '$chatflowId'
            },
            totalMessages: { $sum: 1 },
            userMessages: { $sum: { $cond: [{ $eq: ['$messages.role', 'user'] }, 1, 0] } },
            assistantMessages: { $sum: { $cond: [{ $eq: ['$messages.role', 'assistant'] }, 1, 0] } },
            // Token usage aggregation
            totalPromptTokens: { $sum: '$messages.tokenUsage.promptTokens' },
            totalCompletionTokens: { $sum: '$messages.tokenUsage.completionTokens' },
            totalTokens: { $sum: '$messages.tokenUsage.totalTokens' },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueChats: { $addToSet: '$_id' },
            lastActivity: { $max: '$updatedAt' }
          }
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid groupBy parameter' }, { status: 400 });
    }

    pipeline.push(groupStage);

    // Add array length calculation for unique counts
    pipeline.push({
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueChatCount: { $size: '$uniqueChats' },
        uniqueChatflowCount: { $size: '$chatflows' }
      }
    });

    // Sort by total messages descending
    pipeline.push({ $sort: { totalMessages: -1 } });

    console.log('[Token Usage API] Aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    // Execute aggregation
    const results = await Chat.aggregate(pipeline);

    // If grouping by course, enrich with course information
    if (groupBy === 'course') {
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          if (!result._id) {
            result.courseName = 'Unknown Course';
            result.courseId = null;
            return result;
          }

          // Try to get course name from LTICourse collection
          const courseInfo = await LTICourse.findOne({ context_id: result._id });
          if (courseInfo) {
            result.courseName = courseInfo.context_title || result._id;
            result.courseId = result._id;
          } else {
            // Fallback: try to get from LTIUser
            const userWithCourse = await LTIUser.findOne({ context_id: result._id });
            result.courseName = userWithCourse?.context_title || result._id;
            result.courseId = result._id;
          }

          return result;
        })
      );

      return NextResponse.json({
        success: true,
        data: enrichedResults,
        summary: {
          totalCourses: enrichedResults.length,
          totalMessages: enrichedResults.reduce((sum, course) => sum + course.totalMessages, 0),
          totalUserMessages: enrichedResults.reduce((sum, course) => sum + course.userMessages, 0),
          totalAssistantMessages: enrichedResults.reduce((sum, course) => sum + course.assistantMessages, 0),
          totalTokenUsage: {
            promptTokens: enrichedResults.reduce((sum, course) => sum + (course.totalPromptTokens || 0), 0),
            completionTokens: enrichedResults.reduce((sum, course) => sum + (course.totalCompletionTokens || 0), 0),
            totalTokens: enrichedResults.reduce((sum, course) => sum + (course.totalTokens || 0), 0)
          }
        }
      });
    }

    // If grouping by user, enrich with user information
    if (groupBy === 'user') {
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          const user = await LTIUser.findById(result._id.userId);
          const courseInfo = await LTICourse.findOne({ context_id: result._id.courseId });
          
          return {
            ...result,
            userName: user?.name || 'Unknown User',
            userEmail: user?.email || '',
            courseName: courseInfo?.context_title || result._id.courseId || 'Unknown Course'
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: enrichedResults,
        summary: {
          totalUsers: enrichedResults.length,
          totalMessages: enrichedResults.reduce((sum, user) => sum + user.totalMessages, 0),
          totalTokenUsage: {
            promptTokens: enrichedResults.reduce((sum, user) => sum + (user.totalPromptTokens || 0), 0),
            completionTokens: enrichedResults.reduce((sum, user) => sum + (user.totalCompletionTokens || 0), 0),
            totalTokens: enrichedResults.reduce((sum, user) => sum + (user.totalTokens || 0), 0)
          }
        }
      });
    }

    // For chatflow grouping, return as is
    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        totalChatflows: results.length,
        totalMessages: results.reduce((sum, cf) => sum + cf.totalMessages, 0),
        totalTokenUsage: {
          promptTokens: results.reduce((sum, cf) => sum + (cf.totalPromptTokens || 0), 0),
          completionTokens: results.reduce((sum, cf) => sum + (cf.totalCompletionTokens || 0), 0),
          totalTokens: results.reduce((sum, cf) => sum + (cf.totalTokens || 0), 0)
        }
      }
    });

  } catch (error) {
    console.error('[Token Usage API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch token usage statistics',
      details: error.message 
    }, { status: 500 });
  }
}
