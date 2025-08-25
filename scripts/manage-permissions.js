/**
 * Command line tool to manage chatflow permissions
 * Usage: node scripts/manage-permissions.js [command] [options]
 */

import connectDB from '../config/db.js';
import { setChatflowRolePermission, removeChatflowPermission } from '../utils/permissionUtilsNew.mjs';
import ChatflowPermission from '../models/ChatflowPermission.js';
import Chatflow from '../models/Chatflow.js';

async function listPermissions(courseId = null) {
  try {
    await connectDB();
    
    let query = { isActive: true };
    if (courseId) {
      query.courseId = courseId;
    }
    
    const permissions = await ChatflowPermission.find(query);
    
    if (permissions.length === 0) {
      console.log('📭 No permissions found');
      return;
    }
    
    console.log(`📋 Found ${permissions.length} permission(s):`);
    console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ Course ID          │ Chatflow ID         │ Allowed Roles                     │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────┤');
    
    for (const permission of permissions) {
      const courseStr = permission.courseId.padEnd(18).substring(0, 18);
      const chatflowStr = permission.chatflowId.padEnd(19).substring(0, 19);
      const rolesStr = permission.allowedRoles.map(role => {
        // Simplify role names for display
        return role.split('#').pop() || role;
      }).join(', ').padEnd(33).substring(0, 33);
      
      console.log(`│ ${courseStr} │ ${chatflowStr} │ ${rolesStr} │`);
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────────┘');
    
  } catch (error) {
    console.error('❌ Error listing permissions:', error.message);
  }
}

async function addPermission(courseId, chatflowId, roles) {
  try {
    await connectDB();
    
    const roleArray = roles.split(',').map(r => r.trim());
    const fullRoles = roleArray.map(role => {
      // Convert simple role names to full URIs if needed
      if (!role.startsWith('http://')) {
        return `http://purl.imsglobal.org/vocab/lis/v2/membership#${role}`;
      }
      return role;
    });
    
    console.log(`🔧 Adding permission for chatflow "${chatflowId}" in course "${courseId}"`);
    console.log(`   Roles: ${fullRoles.join(', ')}`);
    
    const result = await setChatflowRolePermission(courseId, chatflowId, fullRoles);
    
    if (result.success) {
      console.log(`✅ Permission ${result.action} successfully`);
    } else {
      console.log(`❌ Failed to add permission: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error adding permission:', error.message);
  }
}

async function removePermission(courseId, chatflowId) {
  try {
    await connectDB();
    
    console.log(`🗑️  Removing permission for chatflow "${chatflowId}" in course "${courseId}"`);
    
    const result = await removeChatflowPermission(courseId, chatflowId);
    
    if (result.success) {
      console.log('✅ Permission removed successfully');
    } else {
      console.log(`❌ Failed to remove permission: ${result.message || result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error removing permission:', error.message);
  }
}

async function listChatflows() {
  try {
    await connectDB();
    
    const chatflows = await Chatflow.find({}).select('flowId name description isActive');
    
    if (chatflows.length === 0) {
      console.log('📭 No chatflows found');
      return;
    }
    
    console.log(`🤖 Found ${chatflows.length} chatflow(s):`);
    chatflows.forEach(cf => {
      const status = cf.isActive ? '🟢' : '🔴';
      console.log(`   ${status} ${cf.flowId} - ${cf.name}`);
      if (cf.description) {
        console.log(`      ${cf.description}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error listing chatflows:', error.message);
  }
}

function printUsage() {
  console.log(`
🔐 Chatflow Permission Management Tool

Usage:
  node scripts/manage-permissions.js <command> [options]

Commands:
  list [courseId]                      List all permissions (optionally filtered by course)
  add <courseId> <chatflowId> <roles>  Add permission (roles: comma-separated, e.g., "Instructor,Learner")
  remove <courseId> <chatflowId>       Remove permission
  chatflows                           List all available chatflows
  help                                Show this help

Examples:
  node scripts/manage-permissions.js list
  node scripts/manage-permissions.js list demo-course-123
  node scripts/manage-permissions.js add demo-course-123 chatflow-general-ai "Instructor,Learner"
  node scripts/manage-permissions.js remove demo-course-123 chatflow-general-ai
  node scripts/manage-permissions.js chatflows

Role names can be simple (Instructor, Learner, etc.) or full URIs.
  `);
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    printUsage();
    process.exit(0);
  }
  
  try {
    switch (command) {
      case 'list':
        await listPermissions(process.argv[3]);
        break;
        
      case 'add':
        if (process.argv.length < 6) {
          console.error('❌ Missing arguments for add command');
          printUsage();
          process.exit(1);
        }
        await addPermission(process.argv[3], process.argv[4], process.argv[5]);
        break;
        
      case 'remove':
        if (process.argv.length < 5) {
          console.error('❌ Missing arguments for remove command');
          printUsage();
          process.exit(1);
        }
        await removePermission(process.argv[3], process.argv[4]);
        break;
        
      case 'chatflows':
        await listChatflows();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
