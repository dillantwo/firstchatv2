import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('=== JWT Token Test ===');
console.log('To test the fix, you need to:');
console.log('');
console.log('1. Access your application from LTI course 2');
console.log('2. Open browser DevTools > Application > Cookies');
console.log('3. Find the "lti_session" cookie');
console.log('4. Copy the cookie value');
console.log('5. Replace COOKIE_VALUE below and run: node test-jwt.js COOKIE_VALUE');
console.log('');

const cookieValue = process.argv[2];

if (!cookieValue) {
  console.log('Usage: node test-jwt.js <cookie_value>');
  process.exit(1);
}

try {
  const decoded = jwt.verify(cookieValue, process.env.JWT_SECRET || 'your-secret-key');
  console.log('=== Decoded JWT Token ===');
  console.log('User ID:', decoded.userId);
  console.log('Context ID:', decoded.context_id, '<-- This should be "2"');
  console.log('User Name:', decoded.name);
  console.log('Roles:', decoded.roles);
  console.log('');
  
  if (decoded.context_id === '2') {
    console.log('✅ Perfect! You are in course 2 context');
  } else {
    console.log('❌ You are in course', decoded.context_id, 'not course 2');
    console.log('   You need to access from course 2 in LTI');
  }
  
} catch (error) {
  console.error('Failed to decode token:', error.message);
}
