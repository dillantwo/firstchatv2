/**
 * Demo script to set up sample chatflow permissions for testing
 * This script demonstrates how to configure role-based chatflow access
 */

import connectDB from '../config/db.js';
import { setChatflowRolePermission } from '../utils/permissionUtilsNew.mjs';

async function setupDemoPermissions() {
  try {
    console.log('🚀 Setting up demo chatflow permissions...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Sample course ID (replace with actual course ID from your LTI setup)
    const sampleCourseId = "demo-course-123";
    
    // Sample chatflow IDs (replace with actual chatflow IDs from your flowise setup)
    const chatflows = [
      {
        id: "chatflow-general-ai",
        name: "General AI Assistant",
        allowedRoles: [
          "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
          "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
        ]
      },
      {
        id: "chatflow-advanced-research",
        name: "Advanced Research Assistant", 
        allowedRoles: [
          "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
          "http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant"
        ]
      },
      {
        id: "chatflow-admin-only",
        name: "Administrative Assistant",
        allowedRoles: [
          "http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator"
        ]
      },
      {
        id: "chatflow-student-homework",
        name: "Homework Helper",
        allowedRoles: [
          "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
        ]
      }
    ];

    console.log(`📝 Setting up permissions for ${chatflows.length} chatflows...`);

    // Set up permissions for each chatflow
    for (const chatflow of chatflows) {
      console.log(`\n🔧 Setting permission for: ${chatflow.name} (${chatflow.id})`);
      console.log(`   Allowed roles: ${chatflow.allowedRoles.join(', ')}`);
      
      const result = await setChatflowRolePermission(
        sampleCourseId,
        chatflow.id,
        chatflow.allowedRoles,
        `Demo permission for ${chatflow.name}`
      );
      
      if (result.success) {
        console.log(`   ✅ ${result.action === 'created' ? 'Created' : 'Updated'} permission successfully`);
      } else {
        console.log(`   ❌ Failed to set permission: ${result.error}`);
      }
    }

    console.log('\n🎉 Demo permissions setup completed!');
    console.log('\nNext steps:');
    console.log('1. Update the courseId in this script to match your actual LTI course ID');
    console.log('2. Update the chatflow IDs to match your actual Flowise chatflow IDs');
    console.log('3. Test with different user roles to verify permissions work correctly');
    console.log('\nTip: You can check the chatflow_permissions collection in MongoDB to see the created permissions');

  } catch (error) {
    console.error('❌ Error setting up demo permissions:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDemoPermissions();
}

export { setupDemoPermissions };
