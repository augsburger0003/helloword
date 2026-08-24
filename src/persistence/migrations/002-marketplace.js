/**
 * Marketplace collections are intentionally additive so an existing local
 * install keeps its workspace data while gaining the shopping experience.
 */
export function up(state) {
  return {
    ...state,
    schemaVersion: 2,
    migrations: [...(state.migrations || []), "002-marketplace"],
    categories: Array.isArray(state.categories) ? state.categories : [],
    products: Array.isArray(state.products) ? state.products : [],
    cartItems: Array.isArray(state.cartItems) ? state.cartItems : [],
    orders: Array.isArray(state.orders) ? state.orders : [],
  };
}