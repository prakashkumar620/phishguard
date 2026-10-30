const { detectFilePayload, profileThreat, PAYLOAD_EXTENSIONS } = require('../src/services/threatProfiler');
const { evaluateRules } = require('../src/services/ruleEngine');

describe('Threat Profiler & Malicious Payload Analysis Engine', () => {

  describe('Payload File Detection (detectFilePayload)', () => {
    it('should detect ISO container payloads and mark MotW bypass', () => {
      const payload = detectFilePayload('/downloads/invoice_2026.iso');
      expect(payload).not.toBeNull();
      expect(payload.extension).toBe('.iso');
      expect(payload.category).toContain('Ransomware');
      expect(payload.motwBypass).toBe(true);
      expect(payload.platform).toBe('Windows OS');
    });

    it('should detect executable PE files from pathname', () => {
      const payload = detectFilePayload('/setup_installer.exe');
      expect(payload).not.toBeNull();
      expect(payload.extension).toBe('.exe');
      expect(payload.platform).toBe('Windows OS');
    });

    it('should detect weaponized macro documents (.docm, .xlsm)', () => {
      const docmPayload = detectFilePayload('/payroll_update.docm');
      expect(docmPayload).not.toBeNull();
      expect(docmPayload.extension).toBe('.docm');
      expect(docmPayload.category).toContain('Weaponized Macro');

      const xlsmPayload = detectFilePayload('/financial_sheet.xlsm');
      expect(xlsmPayload).not.toBeNull();
      expect(xlsmPayload.extension).toBe('.xlsm');
    });

    it('should detect mobile Android APK malware payloads', () => {
      const payload = detectFilePayload('/apps/bank_security_update.apk');
      expect(payload).not.toBeNull();
      expect(payload.extension).toBe('.apk');
      expect(payload.platform).toBe('Android OS');
      expect(payload.category).toContain('Mobile');
    });

    it('should detect payload delivered via query string parameter', () => {
      const payload = detectFilePayload('/get-file', '?download=trojan_payload.exe');
      expect(payload).not.toBeNull();
      expect(payload.extension).toBe('.exe');
    });

    it('should detect double-extension deception trick (e.g. invoice.pdf.exe)', () => {
      const payload = detectFilePayload('/attachments/urgent_invoice.pdf.exe');
      expect(payload).not.toBeNull();
      expect(payload.extension).toBe('.exe');
    });

    it('should return null for benign standard web pages', () => {
      const payload = detectFilePayload('/wiki/Computer_security');
      expect(payload).toBeNull();
    });
  });

  describe('Harm Assessment & MITRE ATT&CK Mapping (profileThreat)', () => {
    it('should profile Ransomware Container with catastrophic consequence and MotW bypass MITRE ATT&CK', () => {
      const url = 'http://attacker-c2.xyz/malicious_payload.iso';
      const evalRes = evaluateRules(url);
      const profile = profileThreat({
        normalizedUrl: evalRes.normalizedUrl,
        hostname: evalRes.hostname,
        pathname: evalRes.pathname,
        search: evalRes.search,
        features: evalRes.features,
        riskScore: evalRes.riskScore,
        indicators: evalRes.indicators
      });

      expect(profile.hasThreatProfile).toBe(true);
      expect(profile.severity).toBe('critical');
      expect(profile.threatCategory).toContain('Ransomware Dropper');
      expect(profile.harmAssessment.consequenceLevel).toContain('Catastrophic');
      expect(profile.harmAssessment.directHarm.length).toBeGreaterThan(2);
      expect(profile.mitreAttack.some(m => m.id === 'T1486')).toBe(true); // Data Encrypted for Impact
      expect(profile.mitreAttack.some(m => m.id === 'T1553.005')).toBe(true); // MotW Bypass
      expect(profile.remediationSteps.length).toBeGreaterThan(0);
    });

    it('should profile InfoStealer Trojan payload with browser credential theft harm', () => {
      const url = 'http://software-crack.com/crack_keygen.exe';
      const evalRes = evaluateRules(url);
      const profile = evalRes.threatProfile;

      expect(profile.hasThreatProfile).toBe(true);
      expect(profile.threatCategory).toContain('InfoStealer Trojan');
      expect(profile.harmAssessment.dataAtRisk).toContain('All browser saved passwords and login autofill data');
      expect(profile.mitreAttack.some(m => m.id === 'T1555.003')).toBe(true); // Web Browser Credential Theft
      expect(profile.mitreAttack.some(m => m.id === 'T1539')).toBe(true); // Steal Session Cookie
    });

    it('should profile Mobile Banking Trojan with Accessibility Service abuse and SMS OTP interception', () => {
      const url = 'http://bank-security-mfa-authenticator.click/banking_update.apk';
      const evalRes = evaluateRules(url);
      const profile = evalRes.threatProfile;

      expect(profile.hasThreatProfile).toBe(true);
      expect(profile.targetPlatform).toBe('Android OS');
      expect(profile.threatCategory).toContain('Mobile Banking Trojan');
      expect(profile.mitreAttack.some(m => m.id === 'T1412')).toBe(true); // Capture SMS
    });

    it('should profile AiTM Phishing Kit on credential lure portals with brand spoofing', () => {
      const url = 'http://microsoft.verify-login.xyz/auth/signin';
      const evalRes = evaluateRules(url);
      const profile = evalRes.threatProfile;

      expect(profile.hasThreatProfile).toBe(true);
      expect(profile.severity).toBe('high');
      expect(profile.threatCategory).toContain('Credential Harvester');
      expect(profile.threatCategory).toContain('MICROSOFT');
      expect(profile.mitreAttack.some(m => m.id === 'T1056.001')).toBe(true); // Input capture
    });

    it('should mark benign URLs as low severity with no malicious payload detected', () => {
      const url = 'https://www.wikipedia.org/wiki/Computer_security';
      const evalRes = evaluateRules(url);
      const profile = evalRes.threatProfile;

      expect(profile.severity).toBe('low');
      expect(profile.detectedPayload).toBeNull();
      expect(profile.threatCategory).toContain('Benign');
    });
  });
});
