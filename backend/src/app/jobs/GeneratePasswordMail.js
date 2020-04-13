import Mail from '../../lib/Mail';

class GeneratePasswordMail {
  get key() {
    return 'GeneratePasswordMail';
  }

  async handle({ data }) {
    const { user, url } = data;

    await Mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'Create a password for the new FastFeet account',
      template: 'createPassword',
      context: {
        user: user.name,
        url,
      },
    });
  }
}

export default new GeneratePasswordMail();
