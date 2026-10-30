/**
 * Threat Profiler Service
 * Performs deep cyber forensic profiling of URL targets and payloads:
 * - Detects dangerous file types (Ransomware containers, Executables, Macros, Scripts, Mobile Trojans)
 * - Classifies malicious threat families and vectors
 * - Details specific technical harm & consequences to victim systems
 * - Outlines data at risk (credentials, files, crypto wallets, 2FA tokens)
 * - Maps to MITRE ATT&CK tactics & techniques
 * - Provides actionable SOC Incident Response & Containment steps
 */

// File Extension Dictionaries & Forensics
const PAYLOAD_EXTENSIONS = {
  // Container & Disk Images (frequently abused to bypass Windows Mark-of-the-Web / MotW)
  '.iso': {
    type: 'Disk Image Container',
    category: 'Ransomware / Container Smuggled Dropper',
    platform: 'Windows OS',
    mimeType: 'application/x-iso9660-image',
    motwBypass: true,
    riskWeight: 45,
    description: 'ISO disk image file used in "Container Smuggling" to evade Mark-of-the-Web (MotW) inspection and deliver covert loaders.'
  },
  '.img': {
    type: 'Raw Disk Image',
    category: 'Ransomware / Container Smuggled Dropper',
    platform: 'Windows OS',
    mimeType: 'application/octet-stream',
    motwBypass: true,
    riskWeight: 45,
    description: 'Disk image container automatically mounted by Windows Explorer without zone identifier flags.'
  },
  '.vhd': {
    type: 'Virtual Hard Disk',
    category: 'Container Smuggled Loader',
    platform: 'Windows OS',
    mimeType: 'application/x-vhd',
    motwBypass: true,
    riskWeight: 45,
    description: 'Virtual disk container abused to encapsulate malicious shortcuts (.lnk) or payloads.'
  },
  '.vhdx': {
    type: 'Extended Virtual Hard Disk',
    category: 'Container Smuggled Loader',
    platform: 'Windows OS',
    mimeType: 'application/x-vhdx',
    motwBypass: true,
    riskWeight: 45,
    description: 'Modern virtual disk format used for stealth container execution.'
  },

  // Executable Binaries & Libraries
  '.exe': {
    type: 'PE Executable Binary',
    category: 'InfoStealer / Native PE Trojan',
    platform: 'Windows OS',
    mimeType: 'application/x-msdownload',
    motwBypass: false,
    riskWeight: 45,
    description: 'Direct Windows Portable Executable (PE) binary capable of executing arbitrary native code on the victim system.'
  },
  '.scr': {
    type: 'Screensaver Executable',
    category: 'Disguised Trojan Dropper',
    platform: 'Windows OS',
    mimeType: 'application/x-msdownload',
    motwBypass: false,
    riskWeight: 45,
    description: 'Windows screensaver file that executes as a full win32 binary, frequently spoofed as PDF or image icons.'
  },
  '.dll': {
    type: 'Dynamic Link Library',
    category: 'Side-Loading Payload / Cobalt Strike Beacon',
    platform: 'Windows OS',
    mimeType: 'application/x-msdownload',
    motwBypass: false,
    riskWeight: 40,
    description: 'Shared binary library often abused for DLL Search Order Hijacking and reflective memory loading.'
  },
  '.pif': {
    type: 'Program Information File',
    category: 'Legacy Executable Shortcut',
    platform: 'Windows OS',
    mimeType: 'application/x-msdownload',
    motwBypass: false,
    riskWeight: 40,
    description: 'Legacy MS-DOS program shortcut that bypasses visual executable alerts on modern Windows.'
  },
  '.cpl': {
    type: 'Control Panel Item',
    category: 'Control Panel Binary Vector',
    platform: 'Windows OS',
    mimeType: 'application/cpl+xml',
    motwBypass: false,
    riskWeight: 40,
    description: 'Windows Control Panel binary executed via control.exe, used by threat actors to evade basic endpoint process auditing.'
  },

  // Macro-Weaponized Office Documents
  '.docm': {
    type: 'Macro-Enabled Word Document',
    category: 'Weaponized Macro Document (Emotet/Qakbot Lure)',
    platform: 'Cross-Platform (Windows/macOS Office)',
    mimeType: 'application/vnd.ms-word.document.macroEnabled.12',
    motwBypass: false,
    riskWeight: 40,
    description: 'Microsoft Word document containing embedded Visual Basic for Applications (VBA) macro scripts.'
  },
  '.xlsm': {
    type: 'Macro-Enabled Excel Spreadsheet',
    category: 'Weaponized Macro Document',
    platform: 'Cross-Platform (Windows/macOS Office)',
    mimeType: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    motwBypass: false,
    riskWeight: 40,
    description: 'Microsoft Excel workbook containing VBA or Excel 4.0 (XLM) macros for memory staging.'
  },
  '.pptm': {
    type: 'Macro-Enabled PowerPoint Presentation',
    category: 'Weaponized Macro Document',
    platform: 'Cross-Platform (Windows/macOS Office)',
    mimeType: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    motwBypass: false,
    riskWeight: 40,
    description: 'Presentation file equipped with auto-executing macro routines upon presentation launch.'
  },
  '.iqy': {
    type: 'Internet Query File',
    category: 'Web Query Command Injection',
    platform: 'Windows OS',
    mimeType: 'text/x-iqy',
    motwBypass: false,
    riskWeight: 35,
    description: 'Excel Web Query text file abused to initiate unauthenticated outbound HTTP queries and PowerShell execution.'
  },

  // Living-off-the-Land (LotL) Scripts & Shortcuts
  '.bat': {
    type: 'Windows Batch Script',
    category: 'Command Shell Script Dropper',
    platform: 'Windows OS',
    mimeType: 'application/x-bat',
    motwBypass: false,
    riskWeight: 35,
    description: 'Command line script that invokes cmd.exe to download secondary malware stages or disable Windows Defender.'
  },
  '.cmd': {
    type: 'Windows Command Script',
    category: 'Command Shell Script Dropper',
    platform: 'Windows OS',
    mimeType: 'application/cmd',
    motwBypass: false,
    riskWeight: 35,
    description: 'Script file that executes batch command routines directly in the system shell.'
  },
  '.ps1': {
    type: 'PowerShell Script',
    category: 'PowerShell LotL Exploit',
    platform: 'Windows OS',
    mimeType: 'text/x-powershell',
    motwBypass: false,
    riskWeight: 40,
    description: 'PowerShell script often containing Base64-obfuscated commands, reflective AMSI bypasses, and fileless C2 beacons.'
  },
  '.vbs': {
    type: 'VBScript File',
    category: 'WScript Trojan Downloader',
    platform: 'Windows OS',
    mimeType: 'text/vbscript',
    motwBypass: false,
    riskWeight: 35,
    description: 'Visual Basic script invoked via wscript.exe or cscript.exe to launch background downloaders.'
  },
  '.hta': {
    type: 'HTML Application',
    category: 'MSHTA Living-off-the-Land Payload',
    platform: 'Windows OS',
    mimeType: 'application/hta',
    motwBypass: false,
    riskWeight: 40,
    description: 'HTML Application executed directly by mshta.exe with unrestricted local privileges, bypassing browser sandboxes.'
  },
  '.lnk': {
    type: 'Windows Shortcut File',
    category: 'Weaponized LNK Stager',
    platform: 'Windows OS',
    mimeType: 'application/x-ms-shortcut',
    motwBypass: false,
    riskWeight: 40,
    description: 'Shortcut file embedded with concealed command-line arguments to launch hidden powershell.exe or curl.exe.'
  },

  // Mobile Payloads
  '.apk': {
    type: 'Android Package Kit',
    category: 'Mobile Banking Trojan / Spyware',
    platform: 'Android OS',
    mimeType: 'application/vnd.android.package-archive',
    motwBypass: false,
    riskWeight: 40,
    description: 'Sideloaded Android application package that masquerades as security updates or banking tools to hijack Accessibility Services.'
  },
  '.aab': {
    type: 'Android App Bundle',
    category: 'Mobile Rogue Application',
    platform: 'Android OS',
    mimeType: 'application/x-authorware-bin',
    motwBypass: false,
    riskWeight: 35,
    description: 'Android application distribution bundle targeted for mobile endpoint compromise.'
  },

  // Encrypted Archives (Delivery Staging)
  '.zip': {
    type: 'Compressed Archive',
    category: 'Staged Archive Payload',
    platform: 'Cross-Platform',
    mimeType: 'application/zip',
    motwBypass: false,
    riskWeight: 25,
    description: 'Compressed archive frequently password-protected or nested to bypass perimeter email gateway inspection.'
  },
  '.rar': {
    type: 'RAR Archive',
    category: 'Staged Archive Payload',
    platform: 'Cross-Platform',
    mimeType: 'application/x-rar-compressed',
    motwBypass: false,
    riskWeight: 25,
    description: 'Multi-part or compressed archive concealing executable droppers or weaponized shortcuts.'
  },
  '.7z': {
    type: '7-Zip Compressed File',
    category: 'Staged Archive Payload',
    platform: 'Cross-Platform',
    mimeType: 'application/x-7z-compressed',
    motwBypass: false,
    riskWeight: 25,
    description: 'High-compression archive used by malicious campaigns to avoid antivirus static pattern detection.'
  }
};

/**
 * Extract file name and extension from URL path or query parameters
 * @param {string} pathname 
 * @param {string} search 
 * @returns {object|null}
 */
const detectFilePayload = (pathname, search = '') => {
  const combined = `${pathname} ${search}`.toLowerCase();

  // 1. Direct path extension check (e.g., /downloads/invoice.iso or /setup.exe)
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';

  // Check all known extensions
  for (const [ext, metadata] of Object.entries(PAYLOAD_EXTENSIONS)) {
    // Check if path ends with extension or has extension followed by query
    if (lastPart.toLowerCase().endsWith(ext) || pathname.toLowerCase().includes(`${ext}/`)) {
      return {
        fileName: decodeURIComponent(lastPart),
        extension: ext,
        ...metadata
      };
    }

    // Check query string for download payloads (e.g. ?file=update.exe or &attachment=contract.docm)
    const extRegex = new RegExp(`[=/_a-zA-Z0-9-]+\\${ext}(\\?|&|$)`, 'i');
    if (extRegex.test(combined)) {
      const match = combined.match(new RegExp(`([a-zA-Z0-9_-]+\\${ext})`, 'i'));
      return {
        fileName: match ? match[1] : `payload${ext}`,
        extension: ext,
        ...metadata
      };
    }
  }

  // Check double extension trick (e.g., invoice.pdf.exe)
  const doubleExtMatch = combined.match(/([a-zA-Z0-9_-]+\.(?:pdf|doc|docx|xls|xlsx|jpg|png)\.(exe|scr|bat|vbs|ps1|hta|iso))/i);
  if (doubleExtMatch) {
    const fullExt = `.${doubleExtMatch[2].toLowerCase()}`;
    const meta = PAYLOAD_EXTENSIONS[fullExt] || {
      type: 'Deceptive Double-Extension Binary',
      category: 'Deceptive Executable Trojan',
      platform: 'Windows OS',
      mimeType: 'application/octet-stream',
      motwBypass: false,
      riskWeight: 45,
      description: 'Double-extension camouflage trick to deceive users into executing malicious code.'
    };
    return {
      fileName: doubleExtMatch[1],
      extension: fullExt,
      ...meta
    };
  }

  return null;
};

/**
 * Generate comprehensive Threat Profile & Harm Assessment
 * @param {object} params
 * @returns {object} Threat Profile
 */
const profileThreat = ({
  normalizedUrl,
  hostname,
  pathname = '',
  search = '',
  features = {},
  riskScore = 0,
  indicators = []
}) => {
  const detectedPayload = detectFilePayload(pathname, search);
  const lowerUrl = normalizedUrl.toLowerCase();
  const lowerHost = hostname.toLowerCase();
  const lowerPath = pathname.toLowerCase();

  // Determine threat category and harm profile
  let threatCategory = 'Benign / Low Suspicion';
  let severity = 'low';
  let targetPlatform = 'General Web / Cross-Platform';
  let consequenceLevel = 'Minimal (Informational Link)';
  let summary = 'No malicious file payload or aggressive credential lure vectors were observed on this URL.';
  let directHarm = ['Standard web browsing activity. No direct payload or exploit signature detected.'];
  let dataAtRisk = ['Public telemetry (IP address, User-Agent browser header).'];
  let mitreAttack = [];
  let remediationSteps = [
    'No defensive containment required. Standard web browsing safety hygiene applies.'
  ];

  // SCENARIO 1: Dangerous File Payload Detected (Ransomware, InfoStealer, LotL Script, Macro, APK)
  if (detectedPayload) {
    targetPlatform = detectedPayload.platform;
    severity = 'critical';

    const isRansomwareLure = lowerUrl.includes('ransom') || lowerUrl.includes('lock') || lowerUrl.includes('encrypt');
    const isContainerSmuggling = ['.iso', '.img', '.vhd', '.vhdx'].includes(detectedPayload.extension);

    if (isContainerSmuggling || isRansomwareLure) {
      threatCategory = 'Ransomware Dropper & MotW Evasion Container';
      consequenceLevel = 'Catastrophic (Host Encryption & Double Extortion)';
      summary = `The target URL links directly to a container payload (${detectedPayload.extension}) frequently weaponized by ransomware cartels. On modern Windows endpoints, ISO/IMG files are automatically mounted as virtual drives without Mark-of-the-Web (MotW) warning prompts, enabling immediate execution of concealed loaders.`;
      directHarm = [
        `Silently mounts virtual drive containing disguised .lnk, .bat, or .exe payload (${detectedPayload.fileName}).`,
        'Executes cryptographic encryption (AES-256 / ChaCha20 + RSA-4096) across all local documents, databases, and network shares.',
        'Executes "vssadmin.exe delete shadows /all /quiet" and "wbadmin delete catalog" to destroy local recovery points.',
        'Establishes persistence via Windows Registry Run Keys or Scheduled Tasks, communicating with malicious C2 servers.',
        'Exfiltrates proprietary files to attacker extortion leak sites prior to encryption.'
      ];
      dataAtRisk = [
        'Local user files (.docx, .xlsx, .pdf, .zip, .jpg)',
        'Database stores (.mdf, .sqlite, .db, .accdb)',
        'Network shared drives and mapped enterprise volumes',
        'System restore points and local disk backups'
      ];
      mitreAttack = [
        { tactic: 'Initial Access', id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
        { tactic: 'Defense Evasion', id: 'T1553.005', name: 'Subvert Trust Controls: Mark-of-the-Web Bypass' },
        { tactic: 'Execution', id: 'T1204.002', name: 'User Execution: Malicious File' },
        { tactic: 'Impact', id: 'T1486', name: 'Data Encrypted for Impact' },
        { tactic: 'Command and Control', id: 'T1071.001', name: 'Application Layer Protocol: Web Protocols' }
      ];
      remediationSteps = [
        'Immediately disconnect victim workstation from corporate Wi-Fi and Ethernet to stop lateral SMB spreading.',
        'Isolate the endpoint in EDR/XDR console and preserve memory dump for digital forensics.',
        'Add file hash (SHA-256) and source domain to network perimeter firewalls and DNS sinkholes.',
        'Verify backup immutability and prepare off-line restoration procedures.'
      ];
    } else if (detectedPayload.category.includes('Macro')) {
      threatCategory = 'Macro-Weaponized Office Lure (Malware Stager)';
      consequenceLevel = 'Severe (Endpoint Compromise & Remote Access)';
      summary = `The URL delivers a macro-enabled document (${detectedPayload.extension}). Malicious actors use deceptive lures (unpaid invoices, salary bonuses, urgent shipping notices) to trick users into enabling macros, which triggers obfuscated VBA code to pull down second-stage banking trojans or reverse shells.`;
      directHarm = [
        'Executes embedded VBA/XLM macro code upon user approving "Enable Content" prompt.',
        'Spawns powershell.exe or certutil.exe to download malicious payloads into %TEMP% or %APPDATA%.',
        'Injects shellcode into native processes (svchost.exe, explorer.exe) to establish an encrypted reverse shell.',
        'Enables remote command execution and lateral network reconnaissance.'
      ];
      dataAtRisk = [
        'Corporate Outlook emails, address books, and internal memos',
        'Stored Windows Credential Manager passwords',
        'Internal enterprise network map and Active Directory domain tokens'
      ];
      mitreAttack = [
        { tactic: 'Initial Access', id: 'T1566.001', name: 'Phishing: Spearphishing Attachment / Lure' },
        { tactic: 'Execution', id: 'T1059.005', name: 'Command & Scripting Interpreter: Visual Basic' },
        { tactic: 'Execution', id: 'T1204.002', name: 'User Execution: Malicious File' },
        { tactic: 'Defense Evasion', id: 'T1027', name: 'Obfuscated Files or Information' }
      ];
      remediationSteps = [
        'Prevent execution of macros globally via Microsoft 365 Group Policy (Disable All Macros with Notification).',
        'Terminate child processes spawned from winword.exe / excel.exe (powershell.exe, cmd.exe).',
        'Block outbound connections from user endpoints to the host domain.',
        'Reset user domain account credentials and investigate mailbox forwarding rules.'
      ];
    } else if (detectedPayload.extension === '.apk' || detectedPayload.extension === '.aab') {
      threatCategory = 'Mobile Banking Trojan & SMS Interceptor';
      consequenceLevel = 'Critical (Financial Account Takeover & Surveillance)';
      summary = `The URL links directly to an Android package (${detectedPayload.extension}). Sideloaded rogue APKs trick mobile victims into granting Android Accessibility Services, which allows the malware to read screen contents, capture banking logins, and intercept 2FA SMS tokens in real-time.`;
      directHarm = [
        'Prompts user to enable Accessibility Service permissions under false pretenses (e.g. "System Security Update").',
        'Overlays invisible deceptive phishing screens over legitimate banking and crypto wallet apps.',
        'Intercepts incoming SMS verification codes and one-time passwords (OTP/2FA).',
        'Grants remote threat actor access to device camera, microphone, and contacts.'
      ];
      dataAtRisk = [
        'Mobile banking credentials and card CVV numbers',
        'One-Time Passwords (SMS 2FA / WhatsApp codes)',
        'Private photos, contact lists, and live device GPS location',
        'Cryptocurrency wallet seed phrases'
      ];
      mitreAttack = [
        { tactic: 'Initial Access', id: 'T1476', name: 'Mobile: Deliver Malicious App via Other Means' },
        { tactic: 'Privilege Escalation', id: 'T1453', name: 'Mobile: Abuse Accessibility APIs' },
        { tactic: 'Credential Access', id: 'T1417', name: 'Mobile: Input Capture & Screen Recording' },
        { tactic: 'Collection', id: 'T1412', name: 'Mobile: Capture SMS Messages' }
      ];
      remediationSteps = [
        'Uninstall the malicious package immediately from Android Settings > Apps > Special App Access.',
        'Contact financial institutions to freeze banking cards and review recent unauthorized transactions.',
        'Revoke device tokens on banking, Google, and email accounts; switch 2FA to hardware keys or app-based TOTP.',
        'Factory reset the mobile device if root privilege escalation was granted.'
      ];
    } else if (['.bat', '.cmd', '.ps1', '.vbs', '.hta', '.lnk'].includes(detectedPayload.extension)) {
      threatCategory = 'Living-off-the-Land Script / Shell Stager';
      consequenceLevel = 'Severe (Arbitrary Code Execution & System Takeover)';
      summary = `The target URL serves a native scripting payload (${detectedPayload.extension}). These scripts exploit legitimate Windows binaries (LOLBins such as PowerShell, MSHTA, or WScript) to execute arbitrary shell commands without compiling malicious binaries, bypassing basic antivirus signature scanners.`;
      directHarm = [
        `Executes system command routines via native interpreters (${detectedPayload.mimeType}).`,
        'Bypasses Anti-Malware Scan Interface (AMSI) and script block logging.',
        'Downloads secondary stage in-memory binaries (fileless execution).',
        'Adds rogue administrator accounts or alters local firewall rules.'
      ];
      dataAtRisk = [
        'System memory (RAM) process tokens',
        'PowerShell command history and environment variables',
        'Local SAM database hashes and cached Kerberos tickets'
      ];
      mitreAttack = [
        { tactic: 'Execution', id: 'T1059.001', name: 'Command & Scripting Interpreter: PowerShell' },
        { tactic: 'Defense Evasion', id: 'T1218.005', name: 'System Binary Proxy Execution: Mshta' },
        { tactic: 'Persistence', id: 'T1547.001', name: 'Boot or Logon Autostart: Registry Run Keys' }
      ];
      remediationSteps = [
        'Terminate running powershell.exe, mshta.exe, and wscript.exe processes on the target machine.',
        'Inspect PowerShell Operational Event Logs (Event ID 4104) for executed script block traces.',
        'Enforce PowerShell Constrained Language Mode (CLM) across workstation policies.'
      ];
    } else {
      // General Executable / InfoStealer
      threatCategory = 'InfoStealer Trojan / Native PE Dropper';
      consequenceLevel = 'Critical (Browser Credential Theft & Keylogging)';
      summary = `The URL serves an executable file (${detectedPayload.fileName}). Attackers distribute InfoStealers (RedLine, Vidar, Lumma, Agent Tesla) via fake updates or cracked software to extract all stored web passwords, authentication cookies, cryptocurrency wallets, and keystrokes.`;
      directHarm = [
        'Decrypts and harvests passwords, autofill data, and credit cards from Chrome, Edge, and Firefox SQLite databases.',
        'Exfiltrates browser session cookies, allowing threat actors to bypass Multi-Factor Authentication (MFA).',
        'Scans local filesystem for crypto wallet files (wallet.dat, MetaMask extensions, Exodus).',
        'Installs low-level keyboard hooks (Keylogger) and captures desktop screenshots.'
      ];
      dataAtRisk = [
        'All browser saved passwords and login autofill data',
        'Active session cookies (Google, Microsoft 365, AWS, GitHub)',
        'Discord tokens, Telegram sessions, and FTP/SSH private keys',
        'Cryptocurrency wallet seed phrases and keystrokes'
      ];
      mitreAttack = [
        { tactic: 'Initial Access', id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
        { tactic: 'Execution', id: 'T1204.002', name: 'User Execution: Malicious File' },
        { tactic: 'Credential Access', id: 'T1555.003', name: 'Credentials from Password Stores: Web Browsers' },
        { tactic: 'Credential Access', id: 'T1539', name: 'Steal Web Session Cookie' },
        { tactic: 'Exfiltration', id: 'T1041', name: 'Exfiltration Over C2 Channel' }
      ];
      remediationSteps = [
        'Immediately change all passwords from an uninfected secondary device.',
        'Revoke all active web application sessions (log out of all devices in Google/M365/banking).',
        'Transfer cryptocurrency funds immediately to a fresh hardware wallet with a new seed phrase.',
        'Perform full offline malware scan using Windows Defender Offline or dedicated EDR tool.'
      ];
    }
  } 
  // SCENARIO 2: Phishing Credential Harvester / AiTM Phishing Kit (No file download, but deceptive web portal)
  else if (
    features.spoofedBrand ||
    riskScore >= 60 ||
    features.keywordCount >= 2 ||
    lowerPath.includes('login') ||
    lowerPath.includes('signin') ||
    lowerPath.includes('verify') ||
    lowerPath.includes('auth') ||
    lowerPath.includes('billing')
  ) {
    const brandTarget = features.spoofedBrand ? features.spoofedBrand.toUpperCase() : 'Enterprise / Cloud Service';
    threatCategory = `Credential Harvester / AiTM Phishing Kit (${brandTarget} Spoof)`;
    severity = 'high';
    targetPlatform = 'Web Browser (All Operating Systems)';
    consequenceLevel = 'High (Account Takeover & Identity Theft)';
    summary = `This URL hosts a deceptive credential harvesting portal impersonating ${brandTarget}. Adversary-in-the-Middle (AiTM) phishing kits (e.g., Evilginx2) act as reverse proxies to intercept user credentials and authenticated session cookies in real time, completely bypassing SMS/TOTP Multi-Factor Authentication.`;
    directHarm = [
      `Displays deceptive login forms clone-engineered to replicate official ${brandTarget} interfaces.`,
      'Intercepts plaintext usernames, passwords, and security answers via attacker-controlled endpoints.',
      'Captures session tokens to hijack authenticated corporate cloud workspaces (M365, Google Workspace, Okta).',
      'Uses harvested accounts to send secondary spear-phishing emails to internal colleagues.'
    ];
    dataAtRisk = [
      `${brandTarget} account credentials and Master passwords`,
      'Active session authentication cookies and SAML tokens',
      'Confidential corporate emails, OneDrive/SharePoint files',
      'Financial account balances and transaction authorizations'
    ];
    mitreAttack = [
      { tactic: 'Initial Access', id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
      { tactic: 'Credential Access', id: 'T1056.001', name: 'Input Capture: Keylogging / Form Sniffing' },
      { tactic: 'Credential Access', id: 'T1539', name: 'Steal Web Session Cookie' },
      { tactic: 'Defense Evasion', id: 'T1564.004', name: 'Hide Artifacts: Deceptive Domain / Typosquatting' }
    ];
    remediationSteps = [
      `Do NOT enter credentials or approve MFA push notifications received from this page.`,
      `If credentials were typed, immediately change the ${brandTarget} password from an authentic bookmark.`,
      'Invalidate all active session tokens in your account security dashboard ("Sign out everywhere").',
      'Upgrade from SMS/App OTP to FIDO2 / WebAuthn Hardware Security Keys (YubiKey) which are immune to AiTM phishing.'
    ];
  }
  // SCENARIO 3: Suspicious Infrastructure (Raw IP, High Entropy, URL Shortener, Suspicious TLD)
  else if (riskScore >= 40 || features.isIpAddress || features.isShortener || features.isHighRiskTld) {
    threatCategory = 'Suspicious Infrastructure / Cloaked Redirection Vector';
    severity = 'medium';
    targetPlatform = 'Web Browser (Cross-Platform)';
    consequenceLevel = 'Moderate (Potential Reconnaissance or Dynamic Redirection)';
    summary = 'The destination exhibits structural anomalies such as direct IP address routing, URL shortening concealment, or high-risk TLD registration often used in initial reconnaissance or dynamic traffic diversion.';
    directHarm = [
      'Conceals the final destination server from perimeter URL security filters.',
      'Performs device fingerprinting (IP location, browser plugins, screen dimensions).',
      'May dynamically redirect user to malicious payloads based on geographic filtering or time delays.'
    ];
    dataAtRisk = [
      'Visitor external IP address and geographical location',
      'Browser configuration headers and fingerprint data'
    ];
    mitreAttack = [
      { tactic: 'Initial Access', id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
      { tactic: 'Defense Evasion', id: 'T1027', name: 'Obfuscated Files or Information' }
    ];
    remediationSteps = [
      'Avoid navigating to unverified IP addresses or obfuscated short links.',
      'Expand shortened links with a safe URL preview tool before loading.',
      'Ensure endpoint browser and operating system security updates are applied.'
    ];
  }

  return {
    hasThreatProfile: severity !== 'low',
    threatCategory,
    severity,
    targetPlatform,
    detectedPayload,
    harmAssessment: {
      summary,
      consequenceLevel,
      directHarm,
      dataAtRisk
    },
    mitreAttack,
    remediationSteps
  };
};

module.exports = {
  PAYLOAD_EXTENSIONS,
  detectFilePayload,
  profileThreat
};
