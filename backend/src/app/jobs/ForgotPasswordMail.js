import Mail from '../../lib/Mail';

class ForgotPasswordMail {
  get key() {
    return 'ForgotPasswordMail';
  }

  async handle({ data }) {
    const { user, url } = data;

    await Mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'FastFeet password change request',
      template: 'forgotPassword',
      context: {
        user: user.name,
        url,
      },
    });
  }
}

export default new ForgotPasswordMail();
