import mongoose from 'mongoose';

const LTICourseSchema = new mongoose.Schema({
  // User Reference (用户引用)
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LTIUser', required: true }, // 关联到LTIUser
  sub: { type: String, required: true }, // Subject identifier (冗余字段，便于查询)
  iss: { type: String, required: true }, // Issuer (冗余字段，便于查询)
  
  // Context Information (课程上下文信息)
  context_id: { type: String, required: true }, // Course ID - 课程ID
  context_title: { type: String }, // Course name - 课程名称
  context_label: { type: String }, // Course label - 课程标签
  context_type: [{ type: String }], // Course types - 课程类型
  
  // Resource Information (资源信息)
  resource_link_id: { type: String }, // Activity/resource ID - 活动/资源ID
  resource_link_title: { type: String }, // Activity name - 活动名称
  resource_link_description: { type: String }, // Activity description - 活动描述
  
  // User Roles in this Course (用户在此课程中的角色)
  roles: [{ type: String }], // LTI role URIs - LTI角色URI
  isInstructor: { type: Boolean, default: false }, // 是否为教师
  isAdmin: { type: Boolean, default: false }, // 是否为管理员
  isLearner: { type: Boolean, default: false }, // 是否为学习者
  
  // LTI Services for this Course (此课程的LTI服务)
  services: {
    memberships_url: { type: String }, // For roster access - 成员名单访问
    settings_url: { type: String }, // For settings access - 设置访问
    lineitems_url: { type: String }, // For grade passback - 成绩回传
    context_memberships_url: { type: String }, // Context memberships - 上下文成员
    system_setting_url: { type: String }, // System settings - 系统设置
    context_setting_url: { type: String }, // Context settings - 上下文设置
    link_setting_url: { type: String } // Link settings - 链接设置
  },
  
  // Launch Information (启动信息)
  launch_presentation: {
    locale: { type: String }, // 语言设置
    document_target: { type: String }, // 文档目标
    return_url: { type: String } // 返回URL
  },
  
  // Custom Parameters (自定义参数)
  custom: {
    course_id: { type: String }, // 自定义课程ID
    course_name: { type: String }, // 自定义课程名称
    user_roles: { type: String } // 自定义用户角色
  },
  
  // Access Tracking (访问跟踪)
  first_access: { type: Date, default: Date.now }, // 首次访问时间
  last_access: { type: Date, default: Date.now }, // 最后访问时间
  access_count: { type: Number, default: 1 }, // 访问次数
  
  // Status (状态)
  isActive: { type: Boolean, default: true }, // 是否活跃
  createdAt: { type: Date, default: Date.now }, // 创建时间
  updatedAt: { type: Date, default: Date.now } // 更新时间
});

// Pre-save middleware to derive role flags and update timestamp
LTICourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Derive role flags from roles array
  if (this.roles && this.roles.length > 0) {
    const roleString = this.roles.join(',').toLowerCase();
    this.isInstructor = roleString.includes('instructor') || roleString.includes('teacher');
    this.isAdmin = roleString.includes('administrator');
    this.isLearner = roleString.includes('learner') || roleString.includes('student');
  }
  
  next();
});

// Essential indexes for performance
LTICourseSchema.index({ user_id: 1, context_id: 1 }, { unique: true }); // 用户-课程唯一索引
LTICourseSchema.index({ sub: 1, iss: 1 }); // 用户标识索引
LTICourseSchema.index({ context_id: 1 }); // 课程索引
LTICourseSchema.index({ roles: 1 }); // 角色索引
LTICourseSchema.index({ last_access: -1 }); // 最后访问时间索引

const LTICourse = mongoose.models.LTICourse || mongoose.model('LTICourse', LTICourseSchema, 'lti_courses');

export default LTICourse;
