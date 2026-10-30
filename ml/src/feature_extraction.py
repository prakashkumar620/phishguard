# Feature extraction helper: extracts lexical and structural features from a URL


import math
import re
from urllib.parse import urlparse

SHORTENING_SERVICES = {
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'cli.gs',
    'ow.ly', 'buff.ly', 'adf.ly', 'bit.do', 'shorturl.at', 'tiny.cc',
    'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv', 'ity.im', 'q.gs', 'po.st',
    'bc.vc', 'twitthis.com', 'u.to', 'j.mp', 'buzurl.com', 'cutt.ly',
    'v.gd', 'trib.al', 'rebrand.ly', 's.id', 'short.io'
}

HIGH_RISK_TLDS = {
    'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'club', 'work',
    'icu', 'cam', 'vip', 'monster', 'rest', 'surf', 'fit', 'cn', 'ru',
    'cc', 'pw', 'su', 'tokyo', 'click', 'link', 'loan', 'racing', 'download'
}

SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'sign-in', 'verify', 'verification', 'secure',
    'security', 'account', 'banking', 'update', 'billing', 'confirm',
    'authenticate', 'wallet', 'recovery', 'validate', 'password',
    'credential', 'suspend', 'unlock', 'support', 'portal', 'ebayisapi',
    'paypal', 'apple', 'microsoft', 'netflix', 'amazon'
]

IPV4_PATTERN = re.compile(r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$')

FEATURE_NAMES = [
    'url_length',
    'hostname_length',
    'path_length',
    'query_length',
    'subdomain_count',
    'is_ip',
    'is_https',
    'has_at_symbol',
    'has_double_slash_path',
    'hyphen_count_host',
    'dot_count_url',
    'is_shortener',
    'is_high_risk_tld',
    'hostname_entropy',
    'keyword_count'
]

def calculate_shannon_entropy(text: str) -> float:
    """Compute Shannon entropy of a string."""
    if not text:
        return 0.0
    frequencies = {}
    for char in text:
        frequencies[char] = frequencies.get(char, 0) + 1
    entropy = 0.0
    length = len(text)
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 4)

def extract_features(raw_url: str) -> dict:
    """
    Extract a dictionary of numerical features from a URL string.
    """
    url = raw_url.strip()
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*://', url):
        url = 'https://' + url

    try:
        parsed = urlparse(url)
    except Exception:
        parsed = urlparse('https://invalid-format.test')

    hostname = (parsed.hostname or '').lower()
    pathname = parsed.path or '/'
    query = parsed.query or ''
    scheme = parsed.scheme.lower()

    url_length = len(url)
    hostname_length = len(hostname)
    path_length = len(pathname)
    query_length = len(query)

    domain_parts = hostname.split('.')
    tld = domain_parts[-1] if len(domain_parts) > 1 else ''
    subdomain_count = max(0, len(domain_parts) - 2)

    is_ip = 1 if IPV4_PATTERN.match(hostname) else 0
    is_https = 1 if scheme == 'https' else 0
    has_at_symbol = 1 if '@' in url else 0
    has_double_slash_path = 1 if '//' in pathname else 0
    hyphen_count_host = hostname.count('-')
    dot_count_url = url.count('.')
    is_shortener = 1 if hostname in SHORTENING_SERVICES else 0
    is_high_risk_tld = 1 if tld in HIGH_RISK_TLDS else 0
    hostname_entropy = calculate_shannon_entropy(hostname)

    lower_url = url.lower()
    keyword_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in lower_url)

    return {
        'url_length': url_length,
        'hostname_length': hostname_length,
        'path_length': path_length,
        'query_length': query_length,
        'subdomain_count': subdomain_count,
        'is_ip': is_ip,
        'is_https': is_https,
        'has_at_symbol': has_at_symbol,
        'has_double_slash_path': has_double_slash_path,
        'hyphen_count_host': hyphen_count_host,
        'dot_count_url': dot_count_url,
        'is_shortener': is_shortener,
        'is_high_risk_tld': is_high_risk_tld,
        'hostname_entropy': hostname_entropy,
        'keyword_count': keyword_count
    }

def feature_dict_to_vector(features: dict) -> list:
    """Convert feature dictionary to ordered feature vector."""
    return [features[name] for name in FEATURE_NAMES]
