import Mail from '../../lib/Mail';

class DeliveryCanceledMail {
  get key() {
    return 'DeliveryCanceledMail';
  }

  async handle({ data }) {
    const { deliveryman, product, recipient } = data;

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: 'Your delivery has been canceled',
      template: 'deliveryCanceled',
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

export default new DeliveryCanceledMail();
