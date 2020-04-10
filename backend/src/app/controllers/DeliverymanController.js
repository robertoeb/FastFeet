import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    const deliverymen = await Deliveryman.findAll({
      attributes: ['id', 'name', 'email'],
      include: [{ model: File, as: 'avatar', attributes: ['path', 'url'] }],
    });

    return res.json(deliverymen);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const deliverymanExists = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (deliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Deliveryman email already exists.' });
    }

    const { id, name, email, avatar_id } = await Deliveryman.create(req.body);

    return res.status(201).json({ id, name, email, avatar_id });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { deliverymanId } = req.params;
    const { email, avatar_id } = req.body;

    const deliveryman = await Deliveryman.findByPk(deliverymanId);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exist.' });
    }

    if (email && email !== deliveryman.email) {
      const deliverymanExists = await Deliveryman.findOne({
        where: { email },
      });

      if (deliverymanExists) {
        return res
          .status(400)
          .json({ error: 'Deliveryman email already exists.' });
      }
    }

    if (avatar_id && avatar_id !== deliveryman.avatar_id) {
      const fileExists = await File.findByPk(avatar_id);

      if (!fileExists) {
        return res.status(400).json({ error: 'This file does not exist.' });
      }
    }

    const { id, name } = await deliveryman.update(req.body);

    return res.json({ id, name, email, avatar_id });
  }

  async delete(req, res) {
    const { deliverymanId } = req.params;

    const deliveryman = await Deliveryman.findByPk(deliverymanId);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exist.' });
    }

    await deliveryman.destroy();

    return res.status(204).send();
  }
}

export default new DeliverymanController();
