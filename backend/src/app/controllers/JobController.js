import * as Yup from 'yup';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File from '../models/File';

class JobController {
  async index(req, res) {
    const { page = 1, delivered = false } = req.query;
    const deliverymanId = req.userId;

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: deliverymanId,
        canceled_at: null,
        end_date: delivered ? { [Op.ne]: null } : null,
      },
      attributes: [
        'id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
        'delivered',
        'canceled',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
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

  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.number(),
      end_date: Yup.number(),
      signature_id: Yup.number().when('end_date', (end_date, field) =>
        end_date ? field.required() : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const deliverymanId = req.userId;
    const { deliveryId } = req.params;
    const { signature_id, start_date, end_date } = req.body;

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
        'deliveryman_id',
        'delivered',
        'canceled',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: File,
          as: 'signature',
          attributes: ['path', 'url'],
        },
      ],
    });

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist.' });
    }

    /**
     * Check if deliveryman is the owner os this delivery
     */
    if (delivery.deliveryman_id !== deliverymanId) {
      return res.status(400).json({ error: 'You are not allowed to do this.' });
    }

    if (start_date) {
      /**
       * Check if start date is between 8AM and 6PM
       */
      const isValidDate = isWithinInterval(start_date, {
        start: new Date().setHours(8, 0, 0),
        end: new Date().setHours(18, 0, 0),
      });

      if (!isValidDate) {
        return res
          .status(400)
          .json({ error: 'You cannot start before 8 am or after 6 pm.' });
      }

      /**
       * Check that the deliveryman has reached the withdrawal limit
       */
      const countTodayStartedDelivery = await Delivery.count({
        where: {
          deliveryman_id: deliverymanId,
          canceled_at: null,
          end_date: null,
          start_date: {
            [Op.between]: [startOfDay(start_date), endOfDay(start_date)],
          },
        },
      });

      if (countTodayStartedDelivery >= 5) {
        return res
          .status(400)
          .json({ error: 'You can only withdraw 5 deliveries.' });
      }
    }

    if (end_date) {
      const deliveryStarted = await Delivery.findOne({
        where: { id: deliveryId, start_date: { [Op.ne]: null } },
      });

      if (!deliveryStarted) {
        return res
          .status(400)
          .json({ error: 'You can only finalize a delivery started.' });
      }
    }

    /**
     * Check if signature exists
     */
    if (signature_id) {
      const signature = await File.findOne({
        where: { id: signature_id },
      });

      if (!signature) {
        return res.status(400).json({ error: 'Signature does not exist.' });
      }
    }

    await delivery.update({ start_date, end_date, signature_id });

    return res.json(delivery);
  }
}

export default new JobController();
