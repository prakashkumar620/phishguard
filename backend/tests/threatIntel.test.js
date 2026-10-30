const { checkThreatIntelligence, hashIndicator, memoryIntelCache } = require('../src/services/threatIntelService');

describe('Threat Intelligence & MongoDB Caching Service', () => {
  it('hashIndicator should produce deterministic SHA-256 hex digest', () => {
    const url = 'https://example.com/login';
    const hash1 = hashIndicator(url);
    const hash2 = hashIndicator(url);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('checkThreatIntelligence should gracefully handle disabled service when API key is empty', async () => {
    const res = await checkThreatIntelligence('https://example.com/test');
    expect(res).toBeDefined();
    expect(res.isConfigured).toBe(false);
    expect(res.status).toBe('service_disabled');
    expect(res.isThreat).toBe(false);
    expect(res.provider).toBe('google_safe_browsing');
  });

  it('checkThreatIntelligence should serve cached results when present', async () => {
    const url = 'https://cached-threat-sample.test/malware';
    const hash = hashIndicator(url);

    // Seed mock cache entry
    memoryIntelCache.set(hash, {
      result: {
        isThreat: true,
        threatTypes: ['MALWARE']
      },
      expiresAt: new Date(Date.now() + 600000)
    });

    // Temporarily mock API key to test cache retrieval
    const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'mock_key_for_cache_test';

    const res = await checkThreatIntelligence(url);
    expect(res.fromCache).toBe(true);
    expect(res.isThreat).toBe(true);
    expect(res.threatTypes).toContain('MALWARE');

    // Restore
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
  });
});
