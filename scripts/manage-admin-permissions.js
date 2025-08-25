/**
 * Admin permissions diagnostic script
 * Helps debug permission issues for specific users/courses/chatflows
 */

import connectDB from '../config/db.js';
import ChatflowPermission from '../models/ChatflowPermission.js';
import { checkChatflowPermission } from '../utils/permissionUtilsNew.mjs';

/**
 * Debug permission check for specific case
 */
async function debugPermissionCheck() {
  const userId = '68a2a347e20a4e7c6119f3e2';
  const courseId = '58';
  const userRoles = [
    'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator',
    'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
    'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator'
  ];
  const chatflowId = '5cfaf69c-fb36-4c24-91fe-9afaf78c46e0';

  console.log('🔍 DEBUGGING PERMISSION CHECK');
  console.log('═══════════════════════════════');
  console.log('Target Details:');
  console.log(`  User ID: ${userId}`);
  console.log(`  Course ID: ${courseId}`);
  console.log(`  Chatflow ID: ${chatflowId}`);
  console.log(`  User Roles:`);
  userRoles.forEach(role => console.log(`    - ${role}`));
  console.log('');

  try {
    await connectDB();

    // 1. Check current permission result
    console.log('📋 Testing permission check...');
    const hasPermission = await checkChatflowPermission(userId, courseId, userRoles, chatflowId);
    console.log(`Permission Result: ${hasPermission ? '✅ GRANTED' : '❌ DENIED'}`);
    console.log('');

    // 2. Look for the specific permission record
    console.log('🔍 Searching for exact permission record...');
    const exactMatch = await ChatflowPermission.findOne({
      courseId: courseId,
      chatflowId: chatflowId,
      isActive: true
    });

    if (exactMatch) {
      console.log('✅ Found permission record:');
      console.log(`  Course ID: "${exactMatch.courseId}"`);
      console.log(`  Chatflow ID: "${exactMatch.chatflowId}"`);
      console.log(`  Is Active: ${exactMatch.isActive}`);
      console.log(`  Allowed Roles (${exactMatch.allowedRoles.length}):`);
      exactMatch.allowedRoles.forEach((role, index) => {
        console.log(`    ${index + 1}. "${role}"`);
      });
      console.log(`  Created: ${exactMatch.createdAt}`);
      console.log(`  Updated: ${exactMatch.updatedAt}`);
      console.log('');

      // 3. Check role matching
      console.log('🔍 Checking role matching...');
      console.log('User Roles vs Allowed Roles:');
      
      let hasMatchingRole = false;
      userRoles.forEach((userRole, index) => {
        const isAllowed = exactMatch.allowedRoles.includes(userRole);
        console.log(`  ${index + 1}. User Role: "${userRole}"`);
        console.log(`     Is Allowed: ${isAllowed ? '✅ YES' : '❌ NO'}`);
        if (isAllowed) hasMatchingRole = true;
      });
      
      console.log('');
      console.log(`Overall Role Match: ${hasMatchingRole ? '✅ YES' : '❌ NO'}`);
      
      if (!hasMatchingRole) {
        console.log('');
        console.log('⚠️  ISSUE IDENTIFIED: No role match found!');
        console.log('This could be due to:');
        console.log('1. Different role string formatting (spaces, case, encoding)');
        console.log('2. Missing roles in the permission record');
        console.log('3. Database query issue');
      }

    } else {
      console.log('❌ No permission record found!');
      console.log('');
      
      // Check for similar records
      console.log('🔍 Searching for similar records...');
      
      // Check by course only
      const courseRecords = await ChatflowPermission.find({
        courseId: courseId,
        isActive: true
      });
      
      if (courseRecords.length > 0) {
        console.log(`📋 Found ${courseRecords.length} permission(s) for course "${courseId}":`);
        courseRecords.forEach((record, index) => {
          console.log(`  ${index + 1}. Chatflow: "${record.chatflowId}"`);
          console.log(`     Roles: ${record.allowedRoles.join(', ')}`);
        });
      } else {
        console.log(`📭 No permissions found for course "${courseId}"`);
      }
      
      console.log('');
      
      // Check by chatflow only
      const chatflowRecords = await ChatflowPermission.find({
        chatflowId: chatflowId,
        isActive: true
      });
      
      if (chatflowRecords.length > 0) {
        console.log(`📋 Found ${chatflowRecords.length} permission(s) for chatflow "${chatflowId}":`);
        chatflowRecords.forEach((record, index) => {
          console.log(`  ${index + 1}. Course: "${record.courseId}"`);
          console.log(`     Roles: ${record.allowedRoles.join(', ')}`);
        });
      } else {
        console.log(`📭 No permissions found for chatflow "${chatflowId}"`);
      }
    }

    // 4. List all permissions for context
    console.log('');
    console.log('📋 ALL ACTIVE PERMISSIONS IN DATABASE:');
    const allPermissions = await ChatflowPermission.find({ isActive: true });
    
    if (allPermissions.length === 0) {
      console.log('📭 No active permissions found in database');
    } else {
      console.log(`Found ${allPermissions.length} active permission(s):`);
      allPermissions.forEach((perm, index) => {
        console.log(`${index + 1}. Course: "${perm.courseId}" | Chatflow: "${perm.chatflowId}"`);
        console.log(`   Roles: ${perm.allowedRoles.join(', ')}`);
        console.log('');
      });
    }

    // 5. Test the MongoDB query directly
    console.log('🔍 TESTING MONGODB QUERY DIRECTLY:');
    console.log('Query parameters:');
    console.log(`  courseId: "${courseId}"`);
    console.log(`  chatflowId: "${chatflowId}"`);
    console.log(`  allowedRoles: { $in: [${userRoles.map(r => `"${r}"`).join(', ')}] }`);
    console.log(`  isActive: true`);
    console.log('');

    const directQuery = await ChatflowPermission.findOne({
      courseId: courseId,
      chatflowId: chatflowId,
      allowedRoles: { $in: userRoles },
      isActive: true
    });

    console.log(`Direct Query Result: ${directQuery ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (directQuery) {
      console.log('Found permission via direct query:');
      console.log(`  ID: ${directQuery._id}`);
      console.log(`  Course: "${directQuery.courseId}"`);
      console.log(`  Chatflow: "${directQuery.chatflowId}"`);
      console.log(`  Roles: ${directQuery.allowedRoles.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugPermissionCheck().then(() => {
  console.log('');
  console.log('🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
