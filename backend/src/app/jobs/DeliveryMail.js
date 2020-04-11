import Mail from '../../lib/Mail';

class DeliveryMail {
  get key() {
    return 'DeliveryMail';
  }

  async handle({ data }) {
    const { deliveryman, product, recipient } = data;

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'We have a delivery for you',
      template: 'delivery',
      context: {
        deliveryman: deliveryman.name,
        product,
        recipient: recipient.name,
        address: `${recipient.street}, ${recipient.street_number}, ${recipient.neighborhood}`,
        cityAndState: `${recipient.city} - ${recipient.state}`,
        zipcode: recipient.zip_code,
      },
    });
  }
}

export default new DeliveryMail();
