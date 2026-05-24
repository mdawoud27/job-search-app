import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      email: String,
      role: String,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // User actions
        'USER_BANNED',
        'USER_UNBANNED',
        'USER_CREATED',
        'USER_DELETED',
        'PROFILE_UPDATED',
        'PASSWORD_RESET',
        'PASSWORD_CHANGED',

        // Auth actions
        'LOGIN',
        'LOGOUT',
        'TOKEN_REFRESHED',

        // Company actions
        'COMPANY_CREATED',
        'COMPANY_UPDATED',
        'COMPANY_DELETED',
        'COMPANY_APPROVED',
        'COMPANY_BANNED',
        'COMPANY_UNBANNED',
        'VIEW_COMPANY',

        // Job actions
        'JOB_CREATED',
        'JOB_UPDATED',
        'JOB_DELETED',

        // Application actions
        'APPLICATION_SUBMITTED',
        'APPLICATION_STATUS_CHANGED',
      ],
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['User', 'Company', 'Job', 'Application'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requestId: String,
    ip: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// TTL index
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
);

// Query indexes
auditLogSchema.index({ 'actor._id': 1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
