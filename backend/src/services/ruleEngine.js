const { normalizeUrl, IPV4_REGEX, IPV6_REGEX } = require('../utils/urlNormalizer');
const { detectFilePayload, profileThreat } = require('./threatProfiler');

// Commonly abused URL shortening services
const SHORTENING_SERVICES = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'cli.gs',
  'ow.ly', 'buff.ly', 'adf.ly', 'bit.do', 'shorturl.at', 'tiny.cc',
  'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv', 'ity.im', 'q.gs', 'po.st',
  'bc.vc', 'twitthis.com', 'u.to', 'j.mp', 'buzurl.com', 'cutt.ly',
  'v.gd', 'trib.al', 'rebrand.ly', 's.id', 'short.io'
]);

// Top-Level Domains (TLDs) with high historical malicious abuse rates
const HIGH_RISK_TLDS = new Set([
  'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'club', 'work',
  'icu', 'cam', 'vip', 'monster', 'rest', 'surf', 'fit', 'cn', 'ru',
  'cc', 'pw', 'su', 'tokyo', 'click', 'link', 'loan', 'racing', 'download'
]);

// Sensitive target brands frequently targeted by spear-phishing and credential theft
const TARGET_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'netflix', 'amazon',
  'facebook', 'instagram', 'bankofamerica', 'chase', 'wellsfargo',
  'binance', 'coinbase', 'steam', 'meta', 'whatsapp', 'outlook',
  'office365', 'dropbox', 'icloud', 'yahoo', 'barclays', 'hsbc'
];

// High-risk security/credential keywords
const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'sign-in', 'verify', 'verification', 'secure',
  'security', 'account', 'banking', 'update', 'billing', 'confirm',
  'authenticate', 'wallet', 'recovery', 'validate', 'password',
  'credential', 'suspend', 'unlock', 'support-service', 'portal'
];

/**
 * Calculate Shannon Entropy of a string to detect algorithmic randomness or obfuscation
 * @param {string} str 
 * @returns {number} entropy value (typically 0.0 to 5.0+)
 */
const calculateEntropy = (str) => {
  if (!str || str.length === 0) return 0;
  const frequencies = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
};

/**
 * Extract raw structural and lexical features from normalized URL
 * @param {object} parsedUrl 
 * @returns {object} feature set
 */
const extractFeatures = (parsedUrl) => {
  const { normalizedUrl, rawUrl, hostname, pathname, search, protocol, port, username, isIpAddress } = parsedUrl;

  const urlLength = normalizedUrl.length;
  const hostnameLength = hostname.length;
  const pathLength = pathname.length;
  const queryLength = search.length;

  const domainParts = hostname.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : '';
  const subdomainCount = Math.max(0, domainParts.length - 2);

  const hasAtSymbol = Boolean(username && username.length > 0) || (rawUrl && rawUrl.includes('@'));
  const hasDoubleSlashInPath = pathname.includes('//');
  const hyphenCountHost = (hostname.match(/-/g) || []).length;
  const hyphenCountUrl = (normalizedUrl.match(/-/g) || []).length;
  const dotCountUrl = (normalizedUrl.match(/\./g) || []).length;
  const percentCountUrl = (normalizedUrl.match(/%/g) || []).length;

  const isShortener = SHORTENING_SERVICES.has(hostname);
  const isHighRiskTld = HIGH_RISK_TLDS.has(tld);
  const isHttps = protocol === 'https:';

  // Check for brand spoofing in subdomains, host, or path when apex host is unrelated
  let spoofedBrand = null;
  const lowerHost = hostname.toLowerCase();
  const lowerPath = pathname.toLowerCase();
  
  TARGET_BRANDS.some(brand => {
    const isBrandInHost = lowerHost.includes(brand);
    const isBrandInPath = lowerPath.includes(`/${brand}`) || lowerPath.includes(`${brand}/`);

    if (isBrandInHost || isBrandInPath) {
      const isOfficialBrandDomain = 
        lowerHost === `${brand}.com` ||
        lowerHost.endsWith(`.${brand}.com`) ||
        lowerHost === `${brand}.org` ||
        lowerHost.endsWith(`.${brand}.org`);

      if (!isOfficialBrandDomain) {
        spoofedBrand = brand;
        return true;
      }
    }
    return false;
  });

  // Check for suspicious credential/banking keywords in hostname or path
  const detectedKeywords = SUSPICIOUS_KEYWORDS.filter(kw => 
    lowerHost.includes(kw) || lowerPath.includes(kw)
  );

  const hasNonStandardPort = Boolean(port && port !== '80' && port !== '443');
  const hostnameEntropy = calculateEntropy(hostname);
  const urlEntropy = calculateEntropy(normalizedUrl);
  const pathDepth = pathname.split('/').filter(Boolean).length;

  return {
    urlLength,
    hostnameLength,
    pathLength,
    queryLength,
    subdomainCount,
    isIpAddress,
    isHttps,
    hasAtSymbol,
    hasDoubleSlashInPath,
    hyphenCountHost,
    hyphenCountUrl,
    dotCountUrl,
    percentCountUrl,
    isShortener,
    tld,
    isHighRiskTld,
    spoofedBrand,
    detectedKeywords,
    keywordCount: detectedKeywords.length,
    hasNonStandardPort,
    port: port || (isHttps ? '443' : '80'),
    hostnameEntropy,
    urlEntropy,
    pathDepth,
    detectedPayload: detectFilePayload(pathname, search)
  };
};

/**
 * Execute rule-based security evaluation and calculate risk score [0 - 100]
 * @param {string} rawUrl 
 * @returns {object} Full assessment report with indicator breakdown
 */
const evaluateRules = (rawUrl) => {
  const parsed = normalizeUrl(rawUrl);

  if (!parsed.isValid) {
    return {
      success: false,
      error: parsed.error,
      normalizedUrl: rawUrl,
      riskCategory: 'unknown',
      riskScore: 0,
      indicators: [],
      explanation: parsed.error
    };
  }

  const features = extractFeatures(parsed);
  const indicators = [];
  let calculatedScore = 0;

  // 0. Dangerous File Payload / Weaponized Dropper Vector
  if (features.detectedPayload) {
    const weight = features.detectedPayload.riskWeight || 40;
    calculatedScore += weight;
    indicators.push({
      id: 'DANGEROUS_FILE_PAYLOAD',
      name: `Dangerous File Payload (${features.detectedPayload.extension.toUpperCase()} - ${features.detectedPayload.type})`,
      severity: 'critical',
      weight,
      description: `Target delivers potentially weaponized file "${features.detectedPayload.fileName}" (${features.detectedPayload.category}). ${features.detectedPayload.description}`
    });
  }

  // 1. Hostname is a raw IP Address
  if (features.isIpAddress) {
    const weight = 35;
    calculatedScore += weight;
    indicators.push({
      id: 'RAW_IP_HOSTNAME',
      name: 'Host is Raw IP Address',
      severity: 'critical',
      weight,
      description: `URL directly points to numeric IP address (${parsed.hostname}) rather than a registered domain name.`
    });
  }

  // 2. Misleading @ Symbol
  if (features.hasAtSymbol) {
    const weight = 30;
    calculatedScore += weight;
    indicators.push({
      id: 'AT_SYMBOL_OBFUSCATION',
      name: 'Misleading @ Symbol in URL',
      severity: 'critical',
      weight,
      description: 'The @ character causes browsers to treat preceding characters as user credentials, camouflaging the real destination.'
    });
  }

  // 3. Target Brand Spoofing / Impersonation
  if (features.spoofedBrand) {
    const weight = 30;
    calculatedScore += weight;
    indicators.push({
      id: 'BRAND_IMPERSONATION',
      name: `Possible Brand Spoofing (${features.spoofedBrand})`,
      severity: 'critical',
      weight,
      description: `The URL references known organization brand "${features.spoofedBrand}", but the host does not match the organization's verified domain.`
    });
  }

  // 4. Multiple Suspicious Security / Banking Keywords
  if (features.keywordCount > 0) {
    const weight = Math.min(25, features.keywordCount * 8);
    calculatedScore += weight;
    indicators.push({
      id: 'SUSPICIOUS_KEYWORDS',
      name: 'Credential / Banking Keywords Detected',
      severity: features.keywordCount > 1 ? 'warning' : 'info',
      weight,
      description: `Contains sensitive keywords (${features.detectedKeywords.join(', ')}) commonly used in lure pages.`
    });
  }

  // 5. Shortening Service Indicator
  if (features.isShortener) {
    const weight = 20;
    calculatedScore += weight;
    indicators.push({
      id: 'URL_SHORTENER',
      name: 'URL Shortener Detected',
      severity: 'warning',
      weight,
      description: `Domain (${parsed.hostname}) is a known shortening service that conceals the ultimate destination URL.`
    });
  }

  // 6. Multiple Subdomains (Tunneling / Camouflage)
  if (features.subdomainCount >= 3) {
    const weight = Math.min(20, (features.subdomainCount - 2) * 8);
    calculatedScore += weight;
    indicators.push({
      id: 'EXCESSIVE_SUBDOMAINS',
      name: 'High Subdomain Count',
      severity: 'warning',
      weight,
      description: `Domain has ${features.subdomainCount} subdomains, suggesting potential DNS tunneling or multi-tier host spoofing.`
    });
  }

  // 7. High-Risk TLD
  if (features.isHighRiskTld) {
    const weight = 15;
    calculatedScore += weight;
    indicators.push({
      id: 'HIGH_RISK_TLD',
      name: `Abused Top-Level Domain (.${features.tld})`,
      severity: 'warning',
      weight,
      description: `The .${features.tld} extension has a statistically elevated association with spam and phishing campaigns.`
    });
  }

  // 8. Excessive URL Length
  if (features.urlLength > 75) {
    const weight = features.urlLength > 120 ? 15 : 10;
    calculatedScore += weight;
    indicators.push({
      id: 'EXCESSIVE_URL_LENGTH',
      name: 'Abnormally Long URL',
      severity: 'warning',
      weight,
      description: `URL length is ${features.urlLength} characters (threshold: 75), often used to hide malicious query parameters.`
    });
  }

  // 9. Multiple Hyphens in Hostname
  if (features.hyphenCountHost >= 2) {
    const weight = Math.min(15, features.hyphenCountHost * 5);
    calculatedScore += weight;
    indicators.push({
      id: 'HYPHENATED_DOMAIN',
      name: 'Multiple Hyphens in Hostname',
      severity: 'warning',
      weight,
      description: `Hostname contains ${features.hyphenCountHost} hyphens, commonly seen in synthetic typosquatting domains.`
    });
  }

  // 10. High Hostname Entropy (Randomness / DGA)
  if (features.hostnameEntropy > 4.1 && !features.isIpAddress) {
    const weight = 12;
    calculatedScore += weight;
    indicators.push({
      id: 'HIGH_HOST_ENTROPY',
      name: 'High Hostname Character Entropy',
      severity: 'info',
      weight,
      description: `Shannon entropy of hostname is ${features.hostnameEntropy}, indicating potential programmatic or random string generation.`
    });
  }

  // 11. Lack of HTTPS Encryption
  if (!features.isHttps) {
    const weight = 10;
    calculatedScore += weight;
    indicators.push({
      id: 'UNENCRYPTED_HTTP',
      name: 'Plain Unencrypted HTTP Scheme',
      severity: 'info',
      weight,
      description: 'Communication is unencrypted HTTP. Legitimate security and login forms almost exclusively mandate TLS/HTTPS.'
    });
  }

  // 12. Non-Standard Port Number
  if (features.hasNonStandardPort) {
    const weight = 15;
    calculatedScore += weight;
    indicators.push({
      id: 'NON_STANDARD_PORT',
      name: `Unusual Port Specified (${features.port})`,
      severity: 'warning',
      weight,
      description: `Traffic targets non-standard web port ${features.port}, which can bypass default perimeter firewall rules.`
    });
  }

  // 13. Double Slash in Path
  if (features.hasDoubleSlashInPath) {
    const weight = 10;
    calculatedScore += weight;
    indicators.push({
      id: 'DOUBLE_SLASH_PATH',
      name: 'Double Slash Redirection Vector',
      severity: 'warning',
      weight,
      description: 'The URL path contains consecutive forward slashes ("//"), which is often abused for open redirect evasion.'
    });
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, calculatedScore));

  // Determine Risk Category
  let riskCategory = 'low';
  if (finalScore >= 70) {
    riskCategory = 'high';
  } else if (finalScore >= 40) {
    riskCategory = 'medium';
  }

  // Generate contextual human-readable explanation
  let explanation = '';
  if (riskCategory === 'high') {
    explanation = `High risk detected (Score: ${finalScore}/100). The URL exhibits ${indicators.length} suspicious indicators including ${indicators.filter(i => i.severity === 'critical').map(i => i.name).join(', ') || 'multiple heuristic anomalies'}. Exercise extreme caution; this URL possesses strong characteristics of a phishing attempt.`;
  } else if (riskCategory === 'medium') {
    explanation = `Medium risk detected (Score: ${finalScore}/100). The URL triggered ${indicators.length} warning signals (${indicators.map(i => i.name).slice(0, 3).join(', ')}). While not definitively confirmed as malicious, caution is advised before entering credentials.`;
  } else {
    explanation = `Low risk estimated (Score: ${finalScore}/100). No critical phishing indicators were identified. Note: An assessment of low risk is not a guarantee of safety. Always verify the source and domain authenticity.`;
  }

  const threatProfile = profileThreat({
    normalizedUrl: parsed.normalizedUrl,
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    search: parsed.search,
    features,
    riskScore: finalScore,
    indicators
  });

  return {
    success: true,
    normalizedUrl: parsed.normalizedUrl,
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    search: parsed.search,
    riskCategory,
    riskScore: finalScore,
    features,
    indicators,
    explanation,
    threatProfile,
    analyzedAt: new Date().toISOString()
  };
};

module.exports = {
  evaluateRules,
  extractFeatures,
  calculateEntropy,
  SHORTENING_SERVICES,
  HIGH_RISK_TLDS,
  TARGET_BRANDS,
  SUSPICIOUS_KEYWORDS
};
