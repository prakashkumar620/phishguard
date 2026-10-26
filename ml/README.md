# PhishGuard Machine Learning Subsystem

This directory contains the supervised machine-learning classifier, data preparation, evaluation, and JSON IPC inference interface for phishing URL detection.

---

## 1. Directory Structure

```
ml/
├── data/
│   ├── dataset.csv            # Labeled dataset (0: legitimate, 1: phishing)
│   └── generate_dataset.py    # Deterministic balanced generator with deduplication
├── models/
│   ├── phishing_model.joblib  # Trained RandomForestClassifier
│   ├── scaler.joblib          # Fitted StandardScaler
│   └── model_metadata.json    # Precision, Recall, F1, ROC-AUC & Confusion Matrix
├── src/
│   ├── feature_extraction.py  # 15 deterministic lexical & structural feature extractors
│   ├── train.py               # Model training comparing RF vs Logistic Regression
│   └── predict.py             # CLI & JSON IPC inference script
└── requirements.txt           # Python dependencies
```

---

## 2. Feature Engineering Pipeline

The model analyzes 15 lexical and structural characteristics extracted from each URL without issuing network requests:

| Feature Name | Type | Description |
|---|---|---|
| `url_length` | Integer | Total character length of normalized URL |
| `hostname_length` | Integer | Character length of the host/domain |
| `path_length` | Integer | Length of the URL path segments |
| `query_length` | Integer | Character length of URL query string |
| `subdomain_count` | Integer | Number of subdomains (detects DNS tunneling) |
| `is_ip` | Binary (0/1) | Whether host is a raw IPv4/IPv6 address |
| `is_https` | Binary (0/1) | Whether scheme uses TLS encryption |
| `has_at_symbol` | Binary (0/1) | Obfuscation via browser credential delimiter (`@`) |
| `has_double_slash_path` | Binary (0/1) | Consecutive slashes in path (`//`) for redirection bypass |
| `hyphen_count_host` | Integer | Frequency of hyphens in domain (typo-squatting) |
| `dot_count_url` | Integer | Frequency of periods in URL |
| `is_shortener` | Binary (0/1) | Match against known shortening services (`bit.ly`, etc.) |
| `is_high_risk_tld` | Binary (0/1) | Membership in high-abuse TLDs (`.xyz`, `.top`, `.tk`, etc.) |
| `hostname_entropy` | Float | Shannon entropy of domain character distribution |
| `keyword_count` | Integer | Sensitive credential lures (`verify`, `login`, `bank`, etc.) |

---

## 3. Retraining and Evaluating the Model

1. **Install Python Dependencies:**
   ```bash
   pip install -r ml/requirements.txt
   ```

2. **Generate / Update Dataset:**
   ```bash
   python ml/data/generate_dataset.py
   ```

3. **Train and Compare Models:**
   ```bash
   python ml/src/train.py
   ```
   This performs:
   - 80/20 Stratified train/test split.
   - 5-Fold cross-validation comparing `RandomForestClassifier` and `LogisticRegression`.
   - Held-out test evaluation reporting Accuracy, Precision, Recall, F1, and ROC-AUC.
   - Saves model artifacts to `ml/models/`.

4. **Run Standalone Inference:**
   ```bash
   python ml/src/predict.py --url "http://paypal.verify-account-alert.xyz/login.php"
   ```
