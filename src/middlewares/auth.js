import jwt from 'jsonwebtoken';

export const verifyAccessToken = (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    /* eslint no-undef: off */
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);

    // Check token expiry
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({ message: 'Token expired' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};
