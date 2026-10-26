const { normalizeUrl } = require('../src/utils/urlNormalizer');
const { evaluateRules, calculateEntropy } = require('../src/services/ruleEngine');

describe('Phase 2 Verification: URL Normalizer & Rule Engine', () => {

  describe('URL Normalizer', () => {
    it('should prepend https:// when protocol is omitted', () => {
      const res = normalizeUrl('example.com/test');
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe('https://example.com/test');
      expect(res.hostname).toBe('example.com');
    });

    it('should preserve port when non-standard', () => {
      const res = normalizeUrl('http://example.com:8080/portal');
      expect(res.isValid).toBe(true);
      expect(res.port).toBe('8080');
      expect(res.normalizedUrl).toBe('http://example.com:8080/portal');
    });

    it('should strip default ports (80 for http, 443 for https)', () => {
      const res1 = normalizeUrl('http://example.com:80/path');
      expect(res1.normalizedUrl).toBe('http://example.com/path');

      const res2 = normalizeUrl('https://example.com:443/path');
      expect(res2.normalizedUrl).toBe('https://example.com/path');
    });

    it('should identify valid IPv4 hostnames', () => {
      const res = normalizeUrl('http://192.168.1.50/admin');
      expect(res.isValid).toBe(true);
      expect(res.isIpAddress).toBe(true);
      expect(res.hostname).toBe('192.168.1.50');
    });

    it('should reject malformed or non-http protocols (e.g., javascript:, file:)', () => {
      const res1 = normalizeUrl('javascript:alert(1)');
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain('Unsupported protocol');

      const res2 = normalizeUrl('file:///etc/passwd');
      expect(res2.isValid).toBe(false);
    });

    it('should reject URLs exceeding length limits', () => {
      const hugeUrl = 'https://example.com/' + 'a'.repeat(3000);
      const res = normalizeUrl(hugeUrl);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('exceeds maximum length');
    });
  });

  describe('Shannon Entropy Calculation', () => {
    it('should return 0 for empty or single-character strings', () => {
      expect(calculateEntropy('')).toBe(0);
      expect(calculateEntropy('aaaaaa')).toBe(0);
    });

    it('should calculate higher entropy for diverse/random strings', () => {
      const lowEntropy = calculateEntropy('banana');
      const highEntropy = calculateEntropy('xk89#1-9zq_v9!2');
      expect(highEntropy).toBeGreaterThan(lowEntropy);
    });
  });

  describe('Rule-Based Phishing Evaluation Engine', () => {
    it('should classify a classic phishing lure as HIGH risk', () => {
      // Combines IP address, HTTP, credentials keyword, and long path
      const url = 'http://192.168.1.1/paypal/account-verify/login.php?user=admin';
      const result = evaluateRules(url);

      expect(result.success).toBe(true);
      expect(result.riskCategory).toBe('high');
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      
      const indicatorIds = result.indicators.map(i => i.id);
      expect(indicatorIds).toContain('RAW_IP_HOSTNAME');
      expect(indicatorIds).toContain('BRAND_IMPERSONATION');
      expect(indicatorIds).toContain('SUSPICIOUS_KEYWORDS');
      expect(indicatorIds).toContain('UNENCRYPTED_HTTP');
    });

    it('should detect @-symbol credential camouflage as critical', () => {
      const url = 'https://google.com@evil-attacker-site.com/login';
      const result = evaluateRules(url);

      expect(result.success).toBe(true);
      const atSymbolInd = result.indicators.find(i => i.id === 'AT_SYMBOL_OBFUSCATION');
      expect(atSymbolInd).toBeDefined();
      expect(atSymbolInd.severity).toBe('critical');
    });

    it('should identify URL shortening services and raise warning', () => {
      const url = 'https://bit.ly/3x8AbC';
      const result = evaluateRules(url);

      expect(result.success).toBe(true);
      const shortenerInd = result.indicators.find(i => i.id === 'URL_SHORTENER');
      expect(shortenerInd).toBeDefined();
      expect(shortenerInd.severity).toBe('warning');
    });

    it('should score reputable URLs as LOW risk without claiming guaranteed safety', () => {
      const url = 'https://www.wikipedia.org/wiki/Computer_security';
      const result = evaluateRules(url);

      expect(result.success).toBe(true);
      expect(result.riskCategory).toBe('low');
      expect(result.riskScore).toBeLessThan(40);
      // Ensure explanation explicitly clarifies it is not guaranteed safe
      expect(result.explanation).toContain('not a guarantee of safety');
    });

    it('should detect high-risk TLDs and excessive subdomains', () => {
      const url = 'https://secure.login.banking.portal.auth.fake-service.xyz/';
      const result = evaluateRules(url);

      expect(result.success).toBe(true);
      const indicatorIds = result.indicators.map(i => i.id);
      expect(indicatorIds).toContain('HIGH_RISK_TLD');
      expect(indicatorIds).toContain('EXCESSIVE_SUBDOMAINS');
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
    });
  });
});
