import * as Yup from 'yup';
import Recipient from '../models/Recipient';

class RecipientController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      phone: Yup.string(),
      cell_phone: Yup.string(),
      street: Yup.string().required(),
      street_number: Yup.number(),
      complements: Yup.string(),
      neighborhood: Yup.string(),
      city: Yup.string().required(),
      state: Yup.string().length(2),
      zip_code: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const recipientExists = await Recipient.findOne({
      where: { email: req.body.email },
    });

    if (recipientExists) {
      return res.status(400).json({ error: 'Recipient already exists.' });
    }

    const {
      id,
      name,
      email,
      phone,
      cell_phone,
      street,
      street_number,
      complements,
      neighborhood,
      city,
      state,
      zip_code,
    } = await Recipient.create(req.body);

    return res.status(201).json({
      id,
      name,
      email,
      phone,
      cell_phone,
      street,
      street_number,
      complements,
      neighborhood,
      city,
      state,
      zip_code,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      phone: Yup.string(),
      cell_phone: Yup.string(),
      street: Yup.string(),
      street_number: Yup.number(),
      complements: Yup.string(),
      neighborhood: Yup.string(),
      city: Yup.string(),
      state: Yup.string().length(2),
      zip_code: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const recipient = await Recipient.findByPk(req.params.id);

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient does not exists.' });
    }

    const { email } = req.body;

    if (email && email !== recipient.email) {
      const recipientExists = await Recipient.findOne({ where: { email } });

      if (recipientExists) {
        return res.status(400).json({ error: 'Recipient already exists.' });
      }
    }

    const {
      id,
      name,
      phone,
      cell_phone,
      street,
      street_number,
      complements,
      neighborhood,
      city,
      state,
      zip_code,
    } = await recipient.update(req.body);

    return res.json({
      id,
      name,
      email,
      phone,
      cell_phone,
      street,
      street_number,
      complements,
      neighborhood,
      city,
      state,
      zip_code,
    });
  }
}

export default new RecipientController();
