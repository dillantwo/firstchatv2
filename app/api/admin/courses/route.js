import connectDB from '../../../../config/db.js'
import LTICourse from '../../../../models/LTICourse.js'

export async function GET() {
  try {
    await connectDB()
    
    const courses = await LTICourse.find({}).select('id course')
    
    return Response.json({
      success: true,
      courses: courses
    })
    
  } catch (error) {
    console.error('获取课程列表失败:', error)
    return Response.json(
      { 
        success: false, 
        error: '获取课程列表失败' 
      },
      { status: 500 }
    )
  }
}
