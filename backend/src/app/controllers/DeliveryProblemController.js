import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';

import DeliveryCanceledMail from '../jobs/DeliveryCanceledMail';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const deliveriesWithProblems = await DeliveryProblem.findAll({
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
            'delivered',
            'canceled',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(deliveriesWithProblems);
  }

  async show(req, res) {
    const { page = 1 } = req.query;

    const { deliveryId } = req.params;

    /**
     * Check if delivery exists
     */
    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist.' });
    }

    const deliveryProblems = await DeliveryProblem.findAll({
      where: { delivery_id: deliveryId },
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
            'delivered',
            'canceled',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(deliveryProblems);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { deliveryId } = req.params;
    const { description } = req.body;

    /**
     * Check if delivery exists
     */
    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist.' });
    }

    const { delivery_id } = await DeliveryProblem.create({
      delivery_id: deliveryId,
      description,
    });

    return res.status(201).json({ delivery_id, description });
  }

  async delete(req, res) {
    const { deliveryId } = req.params;

    /**
     * Check if delivery exists
     */
    const delivery = await Delivery.findByPk(deliveryId, {
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'delivered',
        'canceled',
        'deliveryman_id',
        'recipient_id',
      ],
    });

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist.' });
    }

    if (delivery.end_date) {
      return res.status(400).json({
        error: 'Deliveries made are non-cancellable.',
      });
    }

    const { deliveryman_id, recipient_id, product } = delivery;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    const recipient = await Recipient.findByPk(recipient_id);

    delivery.canceled_at = new Date();

    await delivery.save();

    await Queue.add(DeliveryCanceledMail.key, {
      deliveryman,
      product,
      recipient,
    });

    return res.json(delivery);
  }
}

export default new DeliveryProblemController();
