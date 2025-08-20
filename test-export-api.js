// Test script for chat history export functionality

const testExportAPI = async () => {
  const testCourseId = 'test-course-id';
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('Testing chat history export API...');
    
    // Test JSON export
    console.log('Testing JSON export...');
    const jsonResponse = await fetch(`${baseUrl}/api/admin/chat-history/export?courseId=${testCourseId}&format=json`);
    console.log('JSON Response status:', jsonResponse.status);
    
    if (jsonResponse.ok) {
      const jsonData = await jsonResponse.text();
      console.log('JSON export successful, data length:', jsonData.length);
    } else {
      const jsonError = await jsonResponse.json();
      console.log('JSON export error:', jsonError);
    }
    
    // Test CSV export
    console.log('Testing CSV export...');
    const csvResponse = await fetch(`${baseUrl}/api/admin/chat-history/export?courseId=${testCourseId}&format=csv`);
    console.log('CSV Response status:', csvResponse.status);
    
    if (csvResponse.ok) {
      const csvData = await csvResponse.text();
      console.log('CSV export successful, data length:', csvData.length);
    } else {
      const csvError = await csvResponse.json();
      console.log('CSV export error:', csvError);
    }
    
    // Test without course ID (should fail)
    console.log('Testing without course ID (should fail)...');
    const errorResponse = await fetch(`${baseUrl}/api/admin/chat-history/export?format=json`);
    console.log('Error Response status:', errorResponse.status);
    
    if (!errorResponse.ok) {
      const errorData = await errorResponse.json();
      console.log('Expected error:', errorData);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testExportAPI;
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testExportAPI();
}
