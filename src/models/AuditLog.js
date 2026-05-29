import mongoose from 'mongoose';
import { ALLOWED_ACTIONS } from '../utils/constants.js';

const auditActionValues = Object.values(ALLOWED_ACTIONS);

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      email: String,
      role: String,
    },
    action: {
      type: String,
      required: true,
      enum: auditActionValues,
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['User', 'Company', 'Job', 'Application'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetIds: [{ type: mongoose.Schema.Types.ObjectId }],
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
auditLogSchema.index({ targetIds: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
