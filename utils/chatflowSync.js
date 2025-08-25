import Chatflow from '../models/Chatflow.js';

/**
 * Sync chatflow data from Flowise API to database
 */
export async function syncChatflowsFromFlowise() {
    try {
        console.log('[ChatflowSync] Starting chatflow data sync...');
        
        // Read environment variables inside the function
        const FLOWISE_BASE_URL = process.env.FLOWISE_BASE_URL;
        const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;
        
        console.log(`[ChatflowSync] Flowise URL: ${FLOWISE_BASE_URL}`);
        console.log(`[ChatflowSync] API Key: ${FLOWISE_API_KEY ? '***Configured***' : '❌Not Configured'}`);
        
        if (!FLOWISE_BASE_URL || !FLOWISE_API_KEY) {
            throw new Error('Incomplete Flowise configuration');
        }
        
        // Fetch chatflows from Flowise API
        const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/chatflows`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${FLOWISE_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Flowise API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const chatflows = await response.json();
        console.log(`[ChatflowSync] Retrieved ${chatflows.length} chatflows`);
        
        let syncedCount = 0;
        let updatedCount = 0;
        
        // Sync each chatflow to database
        for (const flowData of chatflows) {
            try {
                const chatflowDoc = {
                    flowId: flowData.id,
                    name: flowData.name || `Chatflow ${flowData.id}`,
                    description: flowData.description || '',
                    category: flowData.category || 'General',
                    deployed: flowData.deployed || false,
                    apiConfig: {
                        endpoint: `${FLOWISE_BASE_URL}/api/v1/prediction/${flowData.id}`,
                        isApiEnabled: flowData.isPublic || false,
                        apiKey: null
                    },
                    flowData: flowData,
                    syncInfo: {
                        lastSyncFromFlowise: new Date(),
                        flowiseVersion: flowData.version || 'unknown',
                        syncStatus: 'synced',
                        syncError: null
                    },
                    isActive: true,
                    updatedAt: new Date()
                };
                
                // Check if chatflow already exists
                const existingChatflow = await Chatflow.findOne({ flowId: flowData.id });
                
                if (existingChatflow) {
                    // Update existing chatflow
                    await Chatflow.findOneAndUpdate(
                        { flowId: flowData.id },
                        chatflowDoc,
                        { runValidators: true }
                    );
                    console.log(`[ChatflowSync] Updated: ${flowData.name} (${flowData.id})`);
                    updatedCount++;
                } else {
                    // Create new chatflow
                    const newChatflow = new Chatflow(chatflowDoc);
                    await newChatflow.save();
                    console.log(`[ChatflowSync] Added: ${flowData.name} (${flowData.id})`);
                    syncedCount++;
                }
                
            } catch (error) {
                console.error(`[ChatflowSync] Sync failed: ${flowData.name} - ${error.message}`);
            }
        }
        
        // Mark chatflows as inactive if they no longer exist in Flowise
        const flowiseIds = chatflows.map(flow => flow.id);
        const deactivated = await Chatflow.updateMany(
            { flowId: { $nin: flowiseIds }, isActive: true },
            { 
                isActive: false,
                'syncInfo.syncStatus': 'outdated',
                'syncInfo.syncError': 'Chatflow no longer exists in Flowise',
                'syncInfo.lastSyncFromFlowise': new Date()
            }
        );
        
        console.log(`[ChatflowSync] Sync completed: added ${syncedCount}, updated ${updatedCount}, deactivated ${deactivated.modifiedCount}`);
        
        return {
            success: true,
            synced: syncedCount,
            updated: updatedCount,
            deactivated: deactivated.modifiedCount,
            total: chatflows.length
        };
        
    } catch (error) {
        console.error('[ChatflowSync] Sync failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get list of chatflows accessible to specified user
 */
export async function getUserChatflows(userId, courseId, userRoles, permissionType = 'chat') {
    try {
        // This function would integrate with the existing permission system
        // For now, return all active chatflows
        const chatflows = await Chatflow.find({ 
            isActive: true,
            deployed: true 
        }).select('flowId name description category apiConfig');
        
        return chatflows.map(flow => ({
            id: flow.flowId,
            name: flow.name,
            description: flow.description,
            category: flow.category,
            deployed: true,
            endpoint: flow.apiConfig?.endpoint
        }));
        
    } catch (error) {
        console.error('[ChatflowSync] Failed to get user chatflows:', error);
        return [];
    }
}

/**
 * Check if chatflow data sync is needed
 */
export async function shouldSyncChatflows() {
    try {
        // Check if chatflows were synced recently (within last hour)
        const recentSync = await Chatflow.findOne({
            'syncInfo.lastSyncFromFlowise': {
                $gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
            }
        });
        
        return !recentSync;
    } catch (error) {
        console.error('[ChatflowSync] Failed to check sync status:', error);
        return true; // Default to sync if check fails
    }
}
