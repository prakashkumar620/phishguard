# Dataset generation script for Phishing URL Detection model
# Creates a balanced dataset of safe and phishing URLs for training


import csv
import os

LEGITIMATE_URLS = [
    # Search & Encyclopedias
    'https://www.google.com/search?q=cybersecurity+best+practices',
    'https://en.wikipedia.org/wiki/Phishing',
    'https://en.wikipedia.org/wiki/Transport_Layer_Security',
    'https://www.bing.com/search?q=machine+learning+tutorial',
    'https://duckduckgo.com/?q=safe+browsing+api',
    'https://yahoo.com/news/world',
    'https://archive.org/web/',
    'https://scholar.google.com/scholar?q=deep+learning',

    # Technology & Development
    'https://github.com/torvalds/linux',
    'https://github.com/scikit-learn/scikit-learn',
    'https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-processing-an-unsorted-array',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    'https://www.npmjs.com/package/express',
    'https://docs.python.org/3/library/urllib.parse.html',
    'https://hub.docker.com/_/node',
    'https://aws.amazon.com/ec2/pricing/',
    'https://cloud.google.com/run/docs',
    'https://azure.microsoft.com/en-us/solutions/',
    'https://kubernetes.io/docs/home/',
    'https://gitlab.com/explore',
    'https://bitbucket.org/product',
    'https://huggingface.co/models',
    'https://kaggle.com/datasets',
    'https://pypi.org/project/scikit-learn/',
    'https://crates.io/categories',

    # Banking & E-Commerce (Official Domains)
    'https://www.chase.com/personal/banking',
    'https://www.bankofamerica.com/online-banking/sign-in/',
    'https://www.wellsfargo.com/help/',
    'https://www.paypal.com/us/home',
    'https://www.paypal.com/us/security/security-overview',
    'https://www.amazon.com/gp/help/customer/display.html',
    'https://www.apple.com/shop/buy-iphone',
    'https://store.steampowered.com/about/',
    'https://www.netflix.com/browse',
    'https://www.spotify.com/us/premium/',
    'https://www.target.com/c/electronics/-/N-5xtg6',
    'https://www.walmart.com/browse/electronics/3944',
    'https://www.ebay.com/b/Electronics/bn_70002599',
    'https://www.bestbuy.com/site/computers-pcs/laptops/abcat0502000.c',
    'https://www.etsy.com/c/jewelry-and-accessories',
    'https://www.shopify.com/pricing',
    'https://stripe.com/docs/api',
    'https://www.coinbase.com/learn',
    'https://www.binance.com/en/trade',
    'https://www.kraken.com/features',

    # Education & Government
    'https://www.mit.edu/research/',
    'https://www.stanford.edu/academics/',
    'https://www.harvard.edu/about/',
    'https://www.ox.ac.uk/admissions',
    'https://www.cam.ac.uk/research',
    'https://www.cisa.gov/topics/cyber-threats-and-advisories',
    'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
    'https://www.nasa.gov/missions/',
    'https://www.noaa.gov/weather',
    'https://www.cdc.gov/index.html',
    'https://www.who.int/news',
    'https://www.un.org/en/about-us',
    'https://www.epa.gov/environmental-topics',
    'https://www.sec.gov/edgar/searchedgar/companysearch',
    'https://www.loc.gov/collections/',
    'https://berkeley.edu/academics',
    'https://cmu.edu/academics',
    'https://princeton.edu/research',
    'https://yale.edu/academics',
    'https://columbia.edu/education',

    # Media & News
    'https://www.bbc.com/news/technology',
    'https://www.nytimes.com/section/technology',
    'https://www.theverge.com/tech',
    'https://techcrunch.com/startups/',
    'https://arstechnica.com/information-technology/',
    'https://www.wired.com/category/security/',
    'https://krebsonsecurity.com/about/',
    'https://www.reuters.com/business/finance/',
    'https://www.wsj.com/news/technology',
    'https://www.bloomberg.com/markets',
    'https://www.theguardian.com/technology',
    'https://www.forbes.com/innovation/',
    'https://www.nature.com/nature/articles',
    'https://www.sciencemag.org/news',
    'https://www.economist.com/science-and-technology'
]

PHISHING_URLS = [
    # Brand Impersonation on Fake Domains / TLDs
    'http://paypal.verify-account-security-alert.xyz/login.php',
    'http://chase.secure-banking-verification-center.top/auth',
    'http://appleid.apple.com.manage-auth-session.click/recovery',
    'http://microsoft-office365-verify-credentials.online/login.html',
    'http://amazon-prime-account-suspended-billing.site/update',
    'http://netflix.account-billing-update-confirmation.icu/verify',
    'http://bankofamerica.signon-portal-security-check.work/signon',
    'http://wellsfargo.customer-support-alert.club/signin.aspx',
    'http://binance.security-kyc-verification-notice.vip/trade',
    'http://coinbase.wallet-recovery-passphrase-restore.link/wallet',
    'http://steam-community-free-nitro-giveaway.gq/login',
    'http://meta.facebook-account-suspension-appeals.cf/checkpoint',
    'http://instagram.copyright-violation-verification.ml/help',
    'http://whatsapp-web-qr-code-sync-login.top/connect',
    'http://google-drive-shared-invoice-document.buzz/view',
    'http://dropbox-file-download-viewer-online.monster/shared',
    'http://outlook-web-app-mailbox-quota-exceeded.work/renew',
    'http://yahoo-mail-account-verification-support.cam/upgrade',
    'http://barclays.online-banking-identity-verify.xyz/auth',
    'http://hsbc.secure-commercial-banking-portal.top/logon',

    # IP Address Hostnames with Lure Paths
    'http://192.168.1.100/paypal/login.php?cmd=_login-run',
    'http://10.0.0.15/chase/verify_identity/index.html',
    'http://172.16.254.1/apple/support/signin.php',
    'http://198.51.100.42/banking/bofa/login.htm',
    'http://203.0.113.195/netflix/billing/update_card',
    'http://192.0.2.12/amazon/orders/confirmation.php',
    'http://198.18.0.5/microsoft/owa/auth/logon.aspx',
    'http://192.88.99.1/coinbase/auth/2fa/verify',
    'http://100.64.0.1/binance/login?ref=scam',
    'http://192.168.0.254/wellsfargo/auth/pin_verify',

    # @ Symbol Obfuscation
    'https://www.paypal.com@evil-phishing-host.com/login/auth',
    'https://www.apple.com@secure-id-verification-portal.xyz/restore',
    'https://www.chase.com@fake-chase-online-login.net/banking',
    'https://www.google.com@credential-stealer-site.top/drive',
    'https://www.amazon.com@prime-order-dispute-resolution.club/dispute',
    'https://www.netflix.com@stream-membership-renew.vip/billing',
    'https://www.facebook.com@appeals-support-form.online/contact',
    'https://store.steampowered.com@free-wallet-codes.xyz/claim',
    'https://www.bankofamerica.com@fraud-alert-confirmation.top/verify',
    'https://www.microsoft.com@office365-reactivate-license.site/activate',

    # Subdomain Camouflage & DNS Tunneling
    'http://paypal.com.account.verify.client.support.security.fake-domain.xyz/login',
    'http://appleid.apple.com.verify.identity.auth.customer-care.club/session',
    'http://signin.chase.com.banking.secure.auth.gateway.top/online',
    'http://amazon.com.order.confirmation.refund.billing.vip/claim',
    'http://accounts.google.com.signin.v2.identifier.service.link/auth',
    'http://secure.wellsfargo.com.auth.logon.redirect.work/home',
    'http://netflix.com.update.payment.method.portal.cam/user',
    'http://login.microsoftonline.com.oauth2.authorize.buzz/token',
    'http://binance.com.trade.account.kyc.verification.monster/login',
    'http://coinbase.com.wallet.security.two-factor.icu/confirm',

    # Typo-squatting & Multiple Hyphen Lures
    'http://paypa1-security-verification-center.com/signin',
    'http://chase-bank-online-fraud-prevention-alert.com/login',
    'http://apple-support-cloud-storage-full-warning.com/upgrade',
    'http://arnazon-orders-undelivered-package-track.com/reschedule',
    'http://netfllx-subscription-expired-immediate-reactivation.com/payment',
    'http://bank-of-america-security-suspension-notice.com/unlock',
    'http://wells-fargo-card-service-temporary-lockout.com/verify',
    'http://faceb00k-community-guidelines-warning.com/appeals',
    'http://micros0ft-defender-virus-alert-urgent-call.com/scan',
    'http://c0inbase-pro-security-device-authorization.com/confirm'
]

def generate_csv(output_path: str):
    """Generate balanced CSV with legitimate (label=0) and phishing (label=1) entries."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Synthesize variations while preserving strict deduplication
    legit_expanded = []
    for base in LEGITIMATE_URLS:
        legit_expanded.append(base)
        # Add legitimate subpaths
        if '?' not in base:
            legit_expanded.append(f"{base}/docs")
            legit_expanded.append(f"{base}/help?lang=en")
            legit_expanded.append(f"{base}/about-us")
            legit_expanded.append(f"{base}/resources/whitepaper.pdf")

    phish_expanded = []
    for base in PHISHING_URLS:
        phish_expanded.append(base)
        # Add realistic query phishing variations
        phish_expanded.append(f"{base}?id=victimid_{len(phish_expanded)}&auth_token=fake")
        phish_expanded.append(f"{base}?redirect=https://legitimate.org&session_timeout=true")
        phish_expanded.append(f"{base}/process_login.php?step=credential_harvest")
        phish_expanded.append(f"{base}/secure/confirm_pin.html?account_status=locked")

    # Strictly deduplicate to prevent data leakage between train and test splits
    unique_legit = sorted(list(set(legit_expanded)))
    unique_phish = sorted(list(set(phish_expanded)))

    # Balance counts
    min_count = min(len(unique_legit), len(unique_phish))
    balanced_legit = unique_legit[:min_count]
    balanced_phish = unique_phish[:min_count]

    rows = []
    for u in balanced_legit:
        rows.append({'url': u, 'label': 0, 'category': 'legitimate'})
    for u in balanced_phish:
        rows.append({'url': u, 'label': 1, 'category': 'phishing'})

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['url', 'label', 'category'])
        writer.writeheader()
        writer.writerows(rows)

    print(f"[OK] Generated balanced dataset: {len(rows)} samples ({len(balanced_legit)} legitimate, {len(balanced_phish)} phishing)")
    print(f"[FILE] Saved to: {output_path}")

if __name__ == '__main__':
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
    csv_file = os.path.join(data_dir, 'dataset.csv')
    generate_csv(csv_file)
