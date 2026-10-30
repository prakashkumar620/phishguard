const { predictPhishingLikelihood, computeCalibratedFallback } = require('../src/services/mlService');

describe('Machine Learning Inference Pipeline', () => {
  it('predictPhishingLikelihood should return phishing prediction for high-risk lure', async () => {
    const url = 'http://paypal.verify-account-security-alert.xyz/login.php';
    const features = {
      isIpAddress: 0,
      hasAtSymbol: 0,
      spoofedBrand: 'paypal',
      keywordCount: 4,
      isShortener: 0,
      isHighRiskTld: 1,
      isHttps: 0,
      subdomainCount: 1
    };

    const res = await predictPhishingLikelihood(url, features);
    expect(res).toBeDefined();
    expect(res.prediction).toBe('phishing');
    expect(res.confidence).toBeGreaterThan(0.7);
    expect(res.probabilities).toHaveProperty('phishing');
    expect(res.probabilities).toHaveProperty('legitimate');
  }, 10000);

  it('predictPhishingLikelihood should return legitimate prediction for benign URL', async () => {
    const url = 'https://www.wikipedia.org/wiki/Phishing';
    const features = {
      isIpAddress: 0,
      hasAtSymbol: 0,
      spoofedBrand: null,
      keywordCount: 0,
      isShortener: 0,
      isHighRiskTld: 0,
      isHttps: 1,
      subdomainCount: 1
    };

    const res = await predictPhishingLikelihood(url, features);
    expect(res).toBeDefined();
    expect(res.prediction).toBe('legitimate');
    expect(res.confidence).toBeGreaterThan(0.7);
  }, 10000);

  it('computeCalibratedFallback should produce valid probabilities when ML process is offline', () => {
    const highRiskFeatures = {
      isIpAddress: 1,
      hasAtSymbol: 1,
      spoofedBrand: 'apple',
      keywordCount: 3,
      isHighRiskTld: 1,
      isHttps: 0
    };

    const fallback = computeCalibratedFallback(highRiskFeatures);
    expect(fallback.isAvailable).toBe(true);
    expect(fallback.prediction).toBe('phishing');
    expect(fallback.confidence).toBeGreaterThan(0.5);
    expect(fallback.method).toBe('heuristic-probabilistic-fallback');
  });
});
