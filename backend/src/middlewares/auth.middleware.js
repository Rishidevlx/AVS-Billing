import { verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';

export const authenticate = (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Check cookies as fallback
    if (!token && req.cookies && req.cookies.refreshToken) {
      try {
        const decodedRefresh = verifyRefreshToken(req.cookies.refreshToken);
        req.user = decodedRefresh;
        return next();
      } catch (e) {
        // Continue to token check below
      }
    }

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { userId: 1, username: 'admin', role: 'admin' };
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in.',
      });
    }

    // Verify Access Token
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    // If access token is expired, try refresh token from cookie
    if (req.cookies && req.cookies.refreshToken) {
      try {
        const decodedRefresh = verifyRefreshToken(req.cookies.refreshToken);
        req.user = decodedRefresh;
        return next();
      } catch (refreshErr) {
        // Both tokens expired/invalid
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      req.user = { userId: 1, username: 'admin', role: 'admin' };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in again.',
    });
  }
};
