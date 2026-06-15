const {
  findStaffUserById,
  loadAuthStaffUser,
  DEPARTMENT_POPULATE,
} = require('../repositories/staffUserRepository');

module.exports = {
  findUserById: findStaffUserById,
  loadAuthUser: loadAuthStaffUser,
  DEPARTMENT_POPULATE,
};
