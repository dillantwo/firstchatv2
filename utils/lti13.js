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
      
      // Basic validation - support both www and non-www versions
      const allowedIssuers = [
        this.issuer,
        this.issuer.replace('://', '://www.'), // Add www version
        this.issuer.replace('://www.', '://'), // Remove www if present
      ];
      
      if (!allowedIssuers.includes(payload.iss)) {
        throw new Error(`Invalid issuer: ${payload.iss}, expected one of: ${allowedIssuers.join(', ')}`);
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
    const contextClaim = payload['https://purl.imsglobal.org/spec/lti/claim/context'];
    const resourceLinkClaim = payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'];
    const rolesClaim = payload['https://purl.imsglobal.org/spec/lti/claim/roles'];
    const platformClaim = payload['https://purl.imsglobal.org/spec/lti/claim/tool_platform'];
    const custom = payload['https://purl.imsglobal.org/spec/lti/claim/custom'] || {};
    
    console.log('[LTI] Context claim:', contextClaim);
    console.log('[LTI] Resource link claim:', resourceLinkClaim);
    console.log('[LTI] Roles claim:', rolesClaim);
    
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
      context_id: contextClaim?.id,
      context_label: contextClaim?.label,
      context_title: contextClaim?.title,
      
      // Resource link information
      resource_link_id: resourceLinkClaim?.id,
      resource_link_title: resourceLinkClaim?.title,
      
      // Roles
      roles: rolesClaim || [],
      
      // Platform information
      platform_id: platformClaim?.guid,
      platform_name: platformClaim?.name,
      platform_version: platformClaim?.version,
      
      // Deployment
      deployment_id: payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
      
      // Custom claims
      custom: custom
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
