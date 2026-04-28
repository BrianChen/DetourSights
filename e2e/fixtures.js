// Shared constants for test fixtures created in global-setup.js.
// All slugs use the __test- prefix so they're easy to identify and clean up.

export const DESTINATION = {
  slug: '__test-city',
  name: 'Test City',
  country: 'Testland',
};

export const PLACES = {
  // food only — should appear when Food filter is active, disappear otherwise
  food: { slug: '__test-food', name: 'Test Food Spot', url: '/__test-city/__test-food' },
  // attraction only — should disappear when Food filter is active
  attraction: { slug: '__test-attraction', name: 'Test Landmark', url: '/__test-city/__test-attraction' },
  // food + attraction — should appear under either filter
  both: { slug: '__test-food-attraction', name: 'Test Food Landmark', url: '/__test-city/__test-food-attraction' },
};
