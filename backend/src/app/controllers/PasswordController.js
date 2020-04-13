import * as Yup from 'yup';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Deliveryman from '../models/Deliveryman';
import authConfig from '../../config/auth';

import ForgotPasswordMail from '../jobs/ForgotPasswordMail';
import Queue from '../../lib/Queue';

class PasswordController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { email, isAdmin } = req.body;

    const user = isAdmin
      ? await User.findOne({ where: { email } })
      : await Deliveryman.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const { id } = user;

    const token = jwt.sign(
      { id, isAdmin, isPasswordToken: true },
      authConfig.secret,
      {
        expiresIn: 1800,
      }
    );

    const url = `${process.env.APP_URL}/newpassword?token=${token}`;

    await Queue.add(ForgotPasswordMail.key, { user, url });

    return res.status(200).json();
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      password: Yup.string().min(6).required(),
      confirmPassword: Yup.string().oneOf([Yup.ref('password')]),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { userId, userIsAdmin, isPasswordToken } = req;
    const { password } = req.body;

    if (!isPasswordToken) {
      return res.status(401).json({ error: 'Token invalid.' });
    }

    const user = userIsAdmin
      ? await User.findByPk(userId)
      : await Deliveryman.findByPk(userId);

    const { id, name, email } = await user.update({ password });

    return res.json({ id, name, email });
  }
}

export default new PasswordController();
