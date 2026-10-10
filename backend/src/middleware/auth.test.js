const { scopeMatches } = require('./auth');

describe('scopeMatches', () => {
  test('matches wildcard patient read', () => {
    expect(scopeMatches(['patient/*.read'], 'patient/Observation.read')).toBe(true);
  });

  test('matches exact scope', () => {
    expect(scopeMatches(['patient/Patient.read'], 'patient/Patient.read')).toBe(true);
  });

  test('rejects missing write scope', () => {
    expect(scopeMatches(['patient/*.read'], 'patient/Observation.write')).toBe(false);
  });

  test('system read covers resource reads', () => {
    expect(scopeMatches(['system/*.read'], 'patient/Coverage.read')).toBe(true);
  });
});
