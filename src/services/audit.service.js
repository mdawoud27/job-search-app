import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

export class AuditService {
  static async log({
    actor = null,
    action,
    targetModel,
    targetId,
    metadata = {},
    requestId,
    ip,
  }) {
    try {
      await AuditLog.create({
        actor: {
          _id: actor?._id,
          email: actor?.email,
          role: actor?.role,
        },
        action,
        targetModel,
        targetId,
        metadata,
        requestId,
        ip,
      });
    } catch (err) {
      // Audit failure must NEVER crash the main request
      logger.error('Audit log write failed', {
        error: err.message,
        action,
        requestId,
      });
    }
  }
}
