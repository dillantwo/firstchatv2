import { LTI13Service } from '../utils/lti13.js';

// Mock LTI payload with different username scenarios
const mockPayloads = [
  {
    // Scenario 1: Has preferred_username
    sub: 'test123',
    iss: 'https://test.moodle.com',
    aud: 'test-client',
    name: 'John Doe',
    preferred_username: 'johndoe',
    email: 'john@example.com',
    'https://purl.imsglobal.org/spec/lti/claim/context': { id: 'course1' },
    'https://purl.imsglobal.org/spec/lti/claim/roles': ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner']
  },
  {
    // Scenario 2: Has custom user_username
    sub: 'test456',
    iss: 'https://test.moodle.com',
    aud: 'test-client',
    name: 'Jane Smith',
    email: 'jane@example.com',
    'https://purl.imsglobal.org/spec/lti/claim/custom': {
      user_username: 'janesmith'
    },
    'https://purl.imsglobal.org/spec/lti/claim/context': { id: 'course1' },
    'https://purl.imsglobal.org/spec/lti/claim/roles': ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner']
  },
  {
    // Scenario 3: No username, fallback to name
    sub: 'test789',
    iss: 'https://test.moodle.com',
    aud: 'test-client',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    'https://purl.imsglobal.org/spec/lti/claim/context': { id: 'course1' },
    'https://purl.imsglobal.org/spec/lti/claim/roles': ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner']
  }
];

console.log('Testing LTI username extraction...\n');

const ltiService = new LTI13Service();

mockPayloads.forEach((payload, index) => {
  console.log(`=== Test Case ${index + 1} ===`);
  console.log(`Sub: ${payload.sub}`);
  console.log(`Name: ${payload.name}`);
  console.log(`Preferred Username: ${payload.preferred_username || 'Not provided'}`);
  console.log(`Custom Username: ${payload['https://purl.imsglobal.org/spec/lti/claim/custom']?.user_username || 'Not provided'}`);
  
  const userInfo = ltiService.extractUserInfo(payload);
  console.log(`Extracted Username: ${userInfo.username}`);
  console.log('---\n');
});
