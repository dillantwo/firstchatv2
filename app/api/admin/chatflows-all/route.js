import connectDB from '../../../../config/db.js'
import Chatflow from '../../../../models/Chatflow.js'

export async function GET() {
  try {
    await connectDB()
    
    const chatflows = await Chatflow.find({}).select('flowId name category deployed')
    
    return Response.json({
      success: true,
      chatflows: chatflows
    })
    
  } catch (error) {
    console.error('获取chatflows列表失败:', error)
    return Response.json(
      { 
        success: false, 
        error: '获取chatflows列表失败' 
      },
      { status: 500 }
    )
  }
}
