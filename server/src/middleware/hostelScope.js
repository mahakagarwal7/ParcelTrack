import { ApiError } from '../utils/ApiError.js';

export function enforceHostelScope(hostelExtractor = null) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // ADMINs can operate globally across all hostels
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Determine target hostelId
    let targetHostelId = null;

    if (typeof hostelExtractor === 'function') {
      targetHostelId = hostelExtractor(req);
    } else {
      targetHostelId =
        req.body?.hostelId ||
        req.params?.hostelId ||
        req.query?.hostelId ||
        req.user.hostelId;
    }

    if (!targetHostelId) {
      return next();
    }

    if (req.user.hostelId.toUpperCase() !== targetHostelId.toUpperCase()) {
      return next(
        ApiError.forbidden(
          `Unauthorized: You cannot access or modify resources belonging to hostel '${targetHostelId}'`
        )
      );
    }

    next();
  };
}
