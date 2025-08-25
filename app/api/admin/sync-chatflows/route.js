import { NextResponse } from 'next/server';
import { syncChatflowsFromFlowise } from '../../../../utils/chatflowSync.js';

// POST /api/admin/sync-chatflows - 手动同步Chatflows
export async function POST(request) {
  try {
    console.log('[Admin API] Starting manual chatflow sync...');
    
    const syncResult = await syncChatflowsFromFlowise();
    
    if (syncResult.success) {
      console.log(`[Admin API] Chatflow sync completed: added ${syncResult.synced}, updated ${syncResult.updated}, deactivated ${syncResult.deactivated}`);
      
      return NextResponse.json({
        success: true,
        message: 'Chatflows synced successfully',
        synced: syncResult.synced,
        updated: syncResult.updated,
        deactivated: syncResult.deactivated,
        total: syncResult.total
      });
    } else {
      console.error(`[Admin API] Chatflow sync failed: ${syncResult.error}`);
      
      return NextResponse.json({
        success: false,
        error: syncResult.error || 'Sync failed'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Admin API] Error during chatflow sync:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
