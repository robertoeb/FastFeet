module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('deliverymen', 'password_hash', {
      type: Sequelize.STRING,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('deliverymen', 'password_hash');
  },
};
