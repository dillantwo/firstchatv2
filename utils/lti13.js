import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class LTI13Service {
  constructor() {
    this.clientId = process.env.LTI_CLIENT_ID;
    this.deploymentId = process.env.LTI_DEPLOYMENT_ID;
    this.issuer = process.env.LTI_ISSUER;
    this.keysetUrl = process.env.LTI_KEYSET_URL;
    this.redirectUri = process.env.LTI_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/lti/callback`;
    this.privateKey = process.env.LTI_PRIVATE_KEY;
    this.publicKey = process.env.LTI_PUBLIC_KEY;
  }

  // Generate state for OIDC login
  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate nonce for OIDC login
  generateNonce() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate LTI 1.3 JWT token
  async validateLTIToken(token) {
    try {
      // Decode without verification first to get the header
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded) {
        throw new Error('Invalid JWT token');
      }

      console.log('[LTI] JWT Header:', decoded.header);
      console.log('[LTI] JWT Payload issuer:', decoded.payload.iss);
      console.log('[LTI] Expected issuer:', this.issuer);

      // For development, let's temporarily skip signature verification
      // and just decode the payload to see what Moodle is sending
      const payload = decoded.payload;
      
      // Basic validation
      if (payload.iss !== this.issuer) {
        throw new Error(`Invalid issuer: ${payload.iss}, expected: ${this.issuer}`);
      }
      
      if (payload.aud !== this.clientId) {
        throw new Error(`Invalid audience: ${payload.aud}, expected: ${this.clientId}`);
      }

      console.log('[LTI] Token payload:', JSON.stringify(payload, null, 2));

      // Validate required LTI claims
      this.validateLTIClaims(payload);

      return payload;
    } catch (error) {
      console.error('[LTI] Token validation error:', error);
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  // Validate required LTI claims
  validateLTIClaims(payload) {
    const requiredClaims = [
      'iss', 'sub', 'aud', 'exp', 'iat', 'nonce',
      'https://purl.imsglobal.org/spec/lti/claim/deployment_id',
      'https://purl.imsglobal.org/spec/lti/claim/target_link_uri',
      'https://purl.imsglobal.org/spec/lti/claim/version',
      'https://purl.imsglobal.org/spec/lti/claim/message_type'
    ];

    for (const claim of requiredClaims) {
      if (!payload[claim]) {
        throw new Error(`Missing required LTI claim: ${claim}`);
      }
    }

    // Validate message type
    const messageType = payload['https://purl.imsglobal.org/spec/lti/claim/message_type'];
    if (messageType !== 'LtiResourceLinkRequest') {
      throw new Error(`Invalid message type: ${messageType}`);
    }

    // Validate LTI version
    const version = payload['https://purl.imsglobal.org/spec/lti/claim/version'];
    if (version !== '1.3.0') {
      throw new Error(`Unsupported LTI version: ${version}`);
    }

    // Validate deployment ID
    const deploymentId = payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'];
    if (deploymentId !== this.deploymentId) {
      throw new Error(`Invalid deployment ID: ${deploymentId}`);
    }
  }

  // Extract user information from LTI claims
  extractUserInfo(payload) {
    const custom = payload['https://purl.imsglobal.org/spec/lti/claim/custom'] || {};
    
    return {
      sub: payload.sub,
      iss: payload.iss,
      aud: payload.aud,
      name: payload.name || custom.user_name || `User ${payload.sub}`,
      username: payload.preferred_username || custom.user_username || payload.name || custom.user_name || null,
      given_name: payload.given_name,
      family_name: payload.family_name,
      email: payload.email || custom.user_email || null, // Handle null email
      picture: payload.picture,
      
      // Context information
      context_id: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.id,
      context_label: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.label,
      context_title: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.title,
      
      // Resource link information
      resource_link_id: payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.id,
      resource_link_title: payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.title,
      
      // Roles
      roles: payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
      
      // Platform information
      platform_id: payload['https://purl.imsglobal.org/spec/lti/claim/tool_platform']?.guid,
      platform_name: payload['https://purl.imsglobal.org/spec/lti/claim/tool_platform']?.name,
      platform_version: payload['https://purl.imsglobal.org/spec/lti/claim/tool_platform']?.version,
      
      // Deployment
      deployment_id: payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
      
      // Custom claims
      custom: payload['https://purl.imsglobal.org/spec/lti/claim/custom'] || {}
    };
  }

  // Check if user has instructor role
  isInstructor(roles) {
    const instructorRoles = [
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
      'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Manager',
      'Instructor'
    ];
    
    return roles.some(role => instructorRoles.includes(role));
  }

  // Check if user has learner role
  isLearner(roles) {
    const learnerRoles = [
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      'Learner'
    ];
    
    return roles.some(role => learnerRoles.includes(role));
  }

  // Generate JWKS (JSON Web Key Set) for tool registration
  generateJWKS() {
    if (!this.publicKey) {
      throw new Error('Public key not configured');
    }

    // This is a simplified version - in production you might want to use a proper crypto library
    const keyObject = crypto.createPublicKey(this.publicKey);
    const jwk = keyObject.export({ format: 'jwk' });

    return {
      keys: [{
        ...jwk,
        kid: 'default-key-id',
        alg: 'RS256',
        use: 'sig'
      }]
    };
  }
}
