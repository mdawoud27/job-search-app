import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

const normalizeObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return undefined;
  }
  return id;
};

const normalizeObjectIds = (ids) => {
  if (!Array.isArray(ids)) {
    return undefined;
  }

  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  return validIds.length ? validIds : undefined;
};

export class AuditService {
  static async log({
    actor = null,
    action,
    targetModel,
    targetId,
    targetIds,
    metadata = {},
    requestId,
    ip,
  }) {
    try {
      if (AuditLog.db.readyState !== 1) {
        return;
      }

      const {
        requestId: metadataRequestId,
        ip: metadataIp,
        ...cleanMetadata
      } = metadata || {};
      const actorId = normalizeObjectId(actor?._id || actor?.id);
      const resolvedTargetIds =
        normalizeObjectIds(targetIds) ||
        normalizeObjectIds(Array.isArray(targetId) ? targetId : undefined);
      const resolvedTargetId = Array.isArray(targetId)
        ? undefined
        : normalizeObjectId(targetId);

      await AuditLog.create({
        actor: actor
          ? {
              _id: actorId,
              email: actor.email,
              role: actor.role,
            }
          : undefined,
        action,
        targetModel,
        targetId: resolvedTargetId,
        targetIds: resolvedTargetIds,
        metadata: cleanMetadata,
        requestId: requestId || metadataRequestId,
        ip: ip || metadataIp,
      });
    } catch (err) {
      // Audit failure must NEVER crash the main request
      logger.error('Audit log write failed', {
        error: err.message,
        action,
        targetModel,
        targetId,
        requestId,
      });
    }
  }
}
