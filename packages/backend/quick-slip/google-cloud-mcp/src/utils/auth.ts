/**
 * Authentication utilities for Google Cloud services
 */
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { configManager } from './config.js';
import { stateManager } from './state-manager.js';

// Global auth client that can be reused
// Exported to allow checking auth status from other modules
export let authClient: GoogleAuth | null = null;

/**
 * Initialises Google Cloud authentication using either:
 * 1. GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to a service account file
 * 2. GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables
 * 
 * This function supports lazy loading - it won't fail if credentials aren't available yet,
 * allowing the server to start without authentication and defer it until needed.
 * 
 * Authentication is required for operation but can be lazy-loaded when first needed rather than
 * at startup, which helps prevent timeouts with Smithery.
 * 
 * @param requireAuth If true, will throw an error if authentication fails. If false, will return null.
 * @returns Promise resolving to the authenticated GoogleAuth client or null if authentication isn't available
 */
export async function initGoogleAuth(requireAuth = false): Promise<GoogleAuth | null> {
  // Check if we're in lazy loading mode
  const lazyAuth = process.env.LAZY_AUTH !== 'false'; // Default to true if not set
  
  // If we're in lazy loading mode and not explicitly requiring auth, defer authentication
  if (lazyAuth && !requireAuth) {
    console.log('Lazy authentication enabled - deferring authentication until needed');
  }
  try {
    // If we already have an auth client, return it
    if (authClient) {
      return authClient;
    }

    // Check if we need to create a temporary credentials file from environment variables
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        // Create a temporary credentials file without blocking server startup
        const tempDir = path.join(process.cwd(), '.temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const credentials = {
          type: 'service_account',
          project_id: process.env.GOOGLE_CLOUD_PROJECT || '',
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: '',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
            process.env.GOOGLE_CLIENT_EMAIL
          )}`
        };

        const tempCredentialsPath = path.join(tempDir, 'temp-credentials.json');
        fs.writeFileSync(tempCredentialsPath, JSON.stringify(credentials));
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredentialsPath;
      } catch (error) {
        console.error(`Warning: Failed to create temporary credentials file: ${error instanceof Error ? error.message : String(error)}`);
        if (requireAuth) {
          throw new Error(`Failed to create temporary credentials file: ${error instanceof Error ? error.message : String(error)}`);
        }
        return null;
      }
    }

    // Check if GOOGLE_APPLICATION_CREDENTIALS is set
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      if (requireAuth) {
        throw new Error(
          'Google Cloud authentication not configured. Please set GOOGLE_APPLICATION_CREDENTIALS ' +
          'or both GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.'
        );
      }
      return null;
    }

    // Create the auth client without verifying it immediately
    authClient = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/spanner.data',
        'https://www.googleapis.com/auth/logging.read',
        'https://www.googleapis.com/auth/monitoring.read'
      ]
    });

    // Only verify the token if explicitly required
    // This prevents blocking operations during server startup
    if (requireAuth) {
      try {
        const client = await authClient.getClient();
        await client.getAccessToken();
      } catch (verifyError) {
        authClient = null;
        throw verifyError;
      }
    }
    
    return authClient;
  } catch (error) {
    // Log error but don't crash the server unless authentication is required
    console.error(`Auth error: ${error instanceof Error ? error.message : String(error)}`);
    if (requireAuth) {
      throw error;
    }
    return null;
  }
}

/**
 * Gets the project ID from the state manager, environment variables, or from the authenticated client
 * 
 * @param requireAuth If true, will throw an error if project ID can't be determined. If false, will return a default value.
 * @returns Promise resolving to the Google Cloud project ID or a default value if not available
 */
export async function getProjectId(requireAuth = true): Promise<string> {
  try {
    // First check the state manager (fastest and most reliable method)
    const stateProjectId = stateManager.getCurrentProjectId();
    if (stateProjectId) {
      console.log(`Using project ID from state manager: ${stateProjectId}`);
      return stateProjectId;
    }
    
    // Next check environment variable
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      console.log(`Using project ID from environment: ${process.env.GOOGLE_CLOUD_PROJECT}`);
      // Store in state manager for future use
      await stateManager.setCurrentProjectId(process.env.GOOGLE_CLOUD_PROJECT);
      return process.env.GOOGLE_CLOUD_PROJECT;
    }
    
    // Check if we have credentials file and try to extract project ID from it
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        console.log(`Attempting to read project ID from credentials file: ${credentialsPath}`);
        
        if (fs.existsSync(credentialsPath)) {
          const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
          const credentials = JSON.parse(credentialsContent);
          
          if (credentials.project_id) {
            console.log(`Found project ID in credentials file: ${credentials.project_id}`);
            // Store in state manager for future use
            await stateManager.setCurrentProjectId(credentials.project_id);
            return credentials.project_id;
          }
        }
      } catch (fileError) {
        console.error(`Error reading credentials file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
        // Continue to next method
      }
    }
    
    // Next check if we have a configured default project ID
    try {
      await configManager.initialize();
      const configuredProjectId = configManager.getDefaultProjectId();
      if (configuredProjectId) {
        console.log(`Using project ID from config: ${configuredProjectId}`);
        // Store in state manager for future use
        await stateManager.setCurrentProjectId(configuredProjectId);
        return configuredProjectId;
      }
    } catch (configError) {
      console.error(`Config error: ${configError instanceof Error ? configError.message : String(configError)}`);
      // Continue to next method
    }
    
    // Fall back to getting it from auth client
    try {
      console.log('Attempting to get project ID from auth client...');
      const auth = await initGoogleAuth(requireAuth);
      if (!auth) {
        console.error('Authentication client not available');
        if (requireAuth) {
          throw new Error('Google Cloud authentication not available. Please configure authentication to access project ID.');
        }
        return 'unknown-project';
      }
      
      console.log('Auth client available, requesting project ID...');
      const projectId = await auth.getProjectId();
      
      if (!projectId) {
        console.error('Auth client returned empty project ID');
        if (requireAuth) {
          throw new Error('Could not determine Google Cloud project ID. Please set GOOGLE_CLOUD_PROJECT environment variable or use the set-project-id tool.');
        }
        return 'unknown-project';
      }
      
      console.log(`Got project ID from auth client: ${projectId}`);
      
      // Store in state manager for future use
      await stateManager.setCurrentProjectId(projectId);
      
      return projectId;
    } catch (authError) {
      console.error(`Auth error while getting project ID: ${authError instanceof Error ? authError.message : String(authError)}`);
      if (requireAuth) {
        throw authError;
      }
      return 'unknown-project';
    }
  } catch (error) {
    console.error(`Project ID error: ${error instanceof Error ? error.message : String(error)}`);
    if (requireAuth) {
      throw error;
    }
    return 'unknown-project';
  }
}

/**
 * Sets the default project ID to use for all Google Cloud operations
 * 
 * @param projectId The project ID to set as default
 */
export async function setProjectId(projectId: string): Promise<void> {
  // Use the state manager to set the project ID
  await stateManager.setCurrentProjectId(projectId);
}

/**
 * Gets the list of recently used project IDs
 * 
 * @returns Array of recent project IDs
 */
export async function getRecentProjectIds(): Promise<string[]> {
  await configManager.initialize();
  return configManager.getRecentProjectIds();
}
