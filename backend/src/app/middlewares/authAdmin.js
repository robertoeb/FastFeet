import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided.' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    if (decoded.isAdmin) {
      req.userId = decoded.id;
      req.userIsAdmin = decoded.isAdmin;

      return next();
    }

    return res.status(401).json({ error: 'You are not allowed to do this.' });
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid.' });
  }
};
