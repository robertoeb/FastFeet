import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User';
import Deliveryman from '../models/Deliveryman';
import authConfig from '../../config/auth';

import GeneratePasswordMail from '../jobs/GeneratePasswordMail';
import Queue from '../../lib/Queue';

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
      isAdmin: Yup.boolean().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { email, password, isAdmin } = req.body;

    const user = isAdmin
      ? await User.findOne({ where: { email } })
      : await Deliveryman.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (!user.password_hash) {
      const { id } = user;
      const token = jwt.sign(
        { id, isAdmin, isPasswordToken: true },
        authConfig.secret,
        {
          expiresIn: 1800,
        }
      );
      const url = `${process.env.APP_URL}/newpassword?token=${token}`;

      await Queue.add(GeneratePasswordMail.key, { user, url });

      return res.status(200).json();
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Password does not match.' });
    }

    const { id, name } = user;

    return res.status(201).json({
      user: { id, name, email },
      token: jwt.sign({ id, isAdmin }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
