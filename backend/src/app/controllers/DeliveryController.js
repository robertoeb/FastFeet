import * as Yup from 'yup';
import { isWithinInterval } from 'date-fns';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

import DeliveryMail from '../jobs/DeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const deliveries = await Delivery.findAll({
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: { model: File, as: 'avatar', attributes: ['path', 'url'] },
        },
        {
          model: File,
          as: 'signature',
          attributes: ['path', 'url'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(deliveries);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { recipient_id, deliveryman_id } = req.body;

    /**
     * Check if recipient exists
     */
    const recipient = await Recipient.findOne({
      where: { id: recipient_id },
    });

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient does not exist.' });
    }

    /**
     * Check if deliveryman exists
     */
    const deliveryman = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exist.' });
    }

    const { id, product } = await Delivery.create(req.body);

    await Queue.add(DeliveryMail.key, { deliveryman, product, recipient });

    return res.status(201).json({ id, product, recipient_id, deliveryman_id });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      signature_id: Yup.number(),
      start_date: Yup.number(),
      end_date: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { deliveryId } = req.params;
    const { recipient_id, deliveryman_id, signature_id, start_date } = req.body;

    /**
     * Check if recipient exists
     */
    const recipient = recipient_id
      ? await Recipient.findOne({
          where: { id: recipient_id },
        })
      : true;

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient does not exist.' });
    }

    /**
     * Check if deliveryman exists
     */
    const deliveryman = deliveryman_id
      ? await Deliveryman.findOne({
          where: { id: deliveryman_id },
        })
      : true;

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exist.' });
    }

    /**
     * Check if signature exists
     */
    const signature = signature_id
      ? await File.findOne({
          where: { id: signature_id },
        })
      : true;

    if (!signature) {
      return res.status(400).json({ error: 'Signature does not exist.' });
    }

    /**
     * Check if start date is between 8AM and 6PM
     */
    if (start_date) {
      const isValidDate = isWithinInterval(start_date, {
        start: new Date().setHours(8, 0, 0),
        end: new Date().setHours(18, 0, 0),
      });

      if (!isValidDate) {
        return res
          .status(400)
          .json({ error: 'You cannot start before 8 am or after 6 pm.' });
      }
    }

    const delivery = await Delivery.findByPk(deliveryId, {
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: { model: File, as: 'avatar', attributes: ['path', 'url'] },
        },
        {
          model: File,
          as: 'signature',
          attributes: ['path', 'url'],
        },
      ],
    });

    await delivery.update(req.body);

    return res.json(delivery);
  }

  async delete(req, res) {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findByPk(deliveryId, {
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: { model: File, as: 'avatar', attributes: ['path', 'url'] },
        },
        {
          model: File,
          as: 'signature',
          attributes: ['path', 'url'],
        },
      ],
    });

    if (delivery.end_date) {
      return res.status(400).json({
        error: 'Deliveries made are non-cancellable.',
      });
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    return res.json(delivery);
  }
}

export default new DeliveryController();
