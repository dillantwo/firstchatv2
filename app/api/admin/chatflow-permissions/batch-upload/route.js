import { NextResponse } from 'next/server';
import connectDB from '../../../../../config/db.js';
import ChatflowPermission from '../../../../../models/ChatflowPermission.js';
import Chatflow from '../../../../../models/Chatflow.js';
import LTICourse from '../../../../../models/LTICourse.js';
import { parse } from 'csv-parse/sync';

// POST /api/admin/chatflow-permissions/batch-upload - 批量上传权限
export async function POST(request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file uploaded'
      }, { status: 400 });
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileContent = buffer.toString('utf-8');

    // 解析 CSV
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid CSV format: ' + parseError.message
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CSV file is empty'
      }, { status: 400 });
    }

    // 角色映射
    const roleMapping = {
      'Instructor': 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
      'Learner': 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      'Teaching Assistant': 'http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant',
      'Content Developer': 'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
      'Administrator': 'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator'
    };

    // 验证和转换数据
    const validatedRecords = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // +2 because CSV has header and is 1-indexed

      // 验证必填字段
      if (!record.chatflow_id || !record.course_id || !record.allowed_roles) {
        errors.push(`Row ${rowNum}: Missing required fields (chatflow_id, course_id, allowed_roles)`);
        continue;
      }

      // 处理角色
      const rolesArray = record.allowed_roles.split(';').map(role => role.trim());
      const mappedRoles = rolesArray.map(role => {
        if (roleMapping[role]) {
          return roleMapping[role];
        } else if (role.startsWith('http://')) {
          return role; // Already a full URI
        } else {
          errors.push(`Row ${rowNum}: Invalid role "${role}"`);
          return null;
        }
      }).filter(Boolean);

      if (mappedRoles.length === 0) {
        errors.push(`Row ${rowNum}: No valid roles found`);
        continue;
      }

      // 处理 isActive
      let isActive = true;
      if (record.is_active !== undefined) {
        const activeValue = record.is_active.toLowerCase();
        isActive = activeValue === 'true' || activeValue === '1' || activeValue === 'yes';
      }

      validatedRecords.push({
        chatflowId: record.chatflow_id.trim(),
        courseId: record.course_id.trim(),
        allowedRoles: mappedRoles,
        isActive: isActive
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation errors found',
        details: errors
      }, { status: 400 });
    }

    // 验证 chatflow 和 course 是否存在
    const chatflowIds = [...new Set(validatedRecords.map(r => r.chatflowId))];
    const courseIds = [...new Set(validatedRecords.map(r => r.courseId))];

    const [existingChatflows, existingCourses] = await Promise.all([
      Chatflow.find({ flowId: { $in: chatflowIds }, isActive: true }).select('flowId'),
      LTICourse.find({ context_id: { $in: courseIds }, isActive: true }).distinct('context_id')
    ]);

    const validChatflowIds = new Set(existingChatflows.map(cf => cf.flowId));
    const validCourseIds = new Set(existingCourses);

    // 检查无效的 ID
    const invalidChatflows = chatflowIds.filter(id => !validChatflowIds.has(id));
    const invalidCourses = courseIds.filter(id => !validCourseIds.has(id));

    if (invalidChatflows.length > 0 || invalidCourses.length > 0) {
      const errorMessages = [];
      if (invalidChatflows.length > 0) {
        errorMessages.push(`Invalid chatflow IDs: ${invalidChatflows.join(', ')}`);
      }
      if (invalidCourses.length > 0) {
        errorMessages.push(`Invalid course IDs: ${invalidCourses.join(', ')}`);
      }
      
      return NextResponse.json({
        success: false,
        error: 'Invalid references found',
        details: errorMessages
      }, { status: 400 });
    }

    // 批量处理权限
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const record of validatedRecords) {
      try {
        // 检查是否已存在
        const existingPermission = await ChatflowPermission.findOne({
          chatflowId: record.chatflowId,
          courseId: record.courseId
        });

        if (existingPermission) {
          // 更新现有权限
          await ChatflowPermission.findByIdAndUpdate(
            existingPermission._id,
            {
              allowedRoles: record.allowedRoles,
              isActive: record.isActive,
              updatedAt: new Date()
            }
          );
          results.updated++;
        } else {
          // 创建新权限
          const newPermission = new ChatflowPermission({
            chatflowId: record.chatflowId,
            courseId: record.courseId,
            allowedRoles: record.allowedRoles,
            isActive: record.isActive
          });
          await newPermission.save();
          results.created++;
        }
      } catch (err) {
        results.errors.push(`Error processing chatflow ${record.chatflowId} for course ${record.courseId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch upload completed. Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`,
      results: results
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
