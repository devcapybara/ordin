// Staff roles an owner can switch off for their restaurant.
// OWNER and MANAGER are always on, so an owner can never lock themselves out.
const TOGGLEABLE_ROLES = ['CASHIER', 'WAITER', 'KITCHEN'];

const getDisabledRoles = (restaurant) => {
  const disabled = restaurant?.configs?.disabledRoles;
  return disabled ? Array.from(disabled) : [];
};

const isRoleDisabled = (restaurant, role) =>
  TOGGLEABLE_ROLES.includes(role) && getDisabledRoles(restaurant).includes(role);

module.exports = { TOGGLEABLE_ROLES, getDisabledRoles, isRoleDisabled };
