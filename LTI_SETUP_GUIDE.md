# LTI 1.3 Tool Configuration Guide

## Overview
This application has been updated to use Moodle LTI 1.3 authentication instead of Clerk. Users can only access the chatbot through Moodle LTI integration.

## LTI 1.3 Setup Instructions

### 1. Generate RSA Key Pair
First, generate an RSA key pair for LTI 1.3 authentication:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

### 2. Environment Variables
Copy the `.env.lti.example` file to `.env.local` and update the following variables:

- `JWT_SECRET`: A secure random string for session management
- `LTI_CLIENT_ID`: Client ID from your Moodle LTI tool registration
- `LTI_DEPLOYMENT_ID`: Deployment ID from Moodle
- `LTI_ISSUER`: Your Moodle site URL (e.g., https://moodle.yourschool.com)
- `LTI_KEYSET_URL`: Moodle's public keys endpoint (usually `/mod/lti/certs.php`)
- `LTI_REDIRECT_URI`: Your app's callback URL (e.g., https://yourapp.com/api/lti/callback)
- `LTI_PRIVATE_KEY`: The private key content (as a single line with \\n for newlines)
- `LTI_PUBLIC_KEY`: The public key content (as a single line with \\n for newlines)
- `NEXTAUTH_URL`: Your application's base URL

### 3. Moodle LTI Tool Registration

#### Step 1: Add External Tool in Moodle
1. Go to Site Administration → Plugins → Activity modules → External tool → Manage tools
2. Click "Configure a tool manually"
3. Fill in the following details:

**Basic Information:**
- Tool name: FirstChat Chatbot
- Tool URL: https://your-app-domain.com
- Tool description: AI-powered chatbot for course assistance

**Privacy:**
- Share launcher's name with tool: Always
- Share launcher's email with tool: Always
- Accept grades from the tool: No (unless you want grade integration)

**Services:**
- Force SSL: Yes

#### Step 2: LTI 1.3 Configuration
1. Set LTI version to "LTI 1.3"
2. Configure the following URLs:
   - **Login URL**: `https://your-app-domain.com/api/lti/login`
   - **Redirection URL(s)**: `https://your-app-domain.com/api/lti/callback`
   - **Public key type**: RSA key
   - **Public key**: Paste your public key content here

#### Step 3: Additional Settings
- **Supports Deep Linking (Content-Item Message)**: No
- **Content Selection URL**: Leave empty
- **Custom parameters**: You can add course-specific parameters if needed

### 4. Course Integration

#### Adding the Tool to a Course:
1. Go to your Moodle course
2. Turn editing on
3. Add an activity → External tool
4. Select "FirstChat Chatbot" from the preconfigured tools
5. Configure the activity settings:
   - Activity name: "AI Chatbot"
   - Description: Brief description for students
   - Display: Choose how to display (New window recommended)

### 5. User Information Stored

The LTI integration automatically stores the following user information:
- User ID (LTI sub claim)
- Name and email
- Course context information
- User roles (Instructor, Learner, etc.)
- Platform information

### 6. Security Features

- **Session-based authentication**: Uses secure HTTP-only cookies
- **JWT tokens**: Session tokens with expiration
- **CSRF protection**: Built into the LTI 1.3 flow
- **Access control**: Only accessible through LTI launch

### 7. Development and Testing

For testing in development:
1. Set up a local Moodle instance or use a Moodle sandbox
2. Use ngrok or similar for HTTPS tunneling to your local development server
3. Configure the LTI tool with your ngrok URL

### 8. Troubleshooting

**Common Issues:**
1. **"Access Restricted" message**: User is not accessing through LTI
2. **Authentication errors**: Check LTI configuration and keys
3. **Invalid session**: JWT secret or token verification issues

**Debug Steps:**
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check Moodle logs for LTI launch errors
4. Verify RSA keys are correctly formatted

### 9. API Endpoints

The following LTI-specific endpoints are available:
- `GET /api/lti/jwks` - Public keys for Moodle verification
- `GET /api/lti/login` - LTI 1.3 login initiation
- `POST /api/lti/callback` - LTI 1.3 authentication callback
- `GET /api/lti/session` - Check authentication status

### 10. Removed Clerk Dependencies

The following Clerk-related packages and code have been removed:
- `@clerk/nextjs` package dependency
- Clerk middleware
- Clerk authentication hooks
- User management through Clerk

All user authentication is now handled through LTI 1.3 and stored in the local database using the `LTIUser` model.
