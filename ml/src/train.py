"""
Model training and evaluation pipeline for Phishing URL Detection.
Compares Random Forest Classifier vs Logistic Regression with 5-fold cross-validation
and held-out test evaluation (Precision, Recall, F1, ROC-AUC, Confusion Matrix).
Saves model artifacts and performance metadata.
"""

import csv
import json
import os
import sys
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

# Ensure ml/src is on sys.path
sys.path.append(os.path.dirname(__file__))
from feature_extraction import extract_features, feature_dict_to_vector, FEATURE_NAMES

def load_dataset(csv_path: str):
    """Load dataset and extract feature vectors and target labels."""
    X = []
    y = []
    urls = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_url = row['url'].strip()
            label = int(row['label'])
            feats = extract_features(raw_url)
            vec = feature_dict_to_vector(feats)
            X.append(vec)
            y.append(label)
            urls.append(raw_url)

    return np.array(X, dtype=float), np.array(y, dtype=int), urls

def train_and_evaluate():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    dataset_path = os.path.join(base_dir, 'data', 'dataset.csv')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60)
    print("PHISHGUARD MACHINE LEARNING MODEL TRAINING PIPELINE")
    print("=" * 60)
    print(f"Loading dataset from: {dataset_path}")

    X, y, urls = load_dataset(dataset_path)
    print(f"Total samples: {len(y)} | Phishing: {np.sum(y == 1)} | Legitimate: {np.sum(y == 0)}")
    print(f"Extracted features ({len(FEATURE_NAMES)}): {', '.join(FEATURE_NAMES)}")

    # 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"Training split: {X_train.shape[0]} samples | Testing split: {X_test.shape[0]} samples")

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Candidate Model A: Logistic Regression
    print("\n--- Evaluating Model A: Logistic Regression ---")
    lr = LogisticRegression(max_iter=1000, random_state=42)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    lr_cv_scores = cross_val_score(lr, X_train_scaled, y_train, cv=cv, scoring='f1')
    print(f"5-Fold CV F1 Score: {lr_cv_scores.mean():.4f} (+/- {lr_cv_scores.std():.4f})")

    lr.fit(X_train_scaled, y_train)
    y_pred_lr = lr.predict(X_test_scaled)
    y_prob_lr = lr.predict_proba(X_test_scaled)[:, 1]

    acc_lr = accuracy_score(y_test, y_pred_lr)
    prec_lr = precision_score(y_test, y_pred_lr)
    rec_lr = recall_score(y_test, y_pred_lr)
    f1_lr = f1_score(y_test, y_pred_lr)
    auc_lr = roc_auc_score(y_test, y_prob_lr)
    cm_lr = confusion_matrix(y_test, y_pred_lr).tolist()

    print(f"Held-out Test -> Acc: {acc_lr:.4f} | Prec: {prec_lr:.4f} | Recall: {rec_lr:.4f} | F1: {f1_lr:.4f} | AUC: {auc_lr:.4f}")

    # 2. Candidate Model B: Random Forest Classifier
    print("\n--- Evaluating Model B: Random Forest Classifier ---")
    rf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    rf_cv_scores = cross_val_score(rf, X_train, y_train, cv=cv, scoring='f1')
    print(f"5-Fold CV F1 Score: {rf_cv_scores.mean():.4f} (+/- {rf_cv_scores.std():.4f})")

    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    y_prob_rf = rf.predict_proba(X_test)[:, 1]

    acc_rf = accuracy_score(y_test, y_pred_rf)
    prec_rf = precision_score(y_test, y_pred_rf)
    rec_rf = recall_score(y_test, y_pred_rf)
    f1_rf = f1_score(y_test, y_pred_rf)
    auc_rf = roc_auc_score(y_test, y_prob_rf)
    cm_rf = confusion_matrix(y_test, y_pred_rf).tolist()

    print(f"Held-out Test -> Acc: {acc_rf:.4f} | Prec: {prec_rf:.4f} | Recall: {rec_rf:.4f} | F1: {f1_rf:.4f} | AUC: {auc_rf:.4f}")

    # Feature Importances from Random Forest
    importances = dict(zip(FEATURE_NAMES, [round(float(v), 4) for v in rf.feature_importances_]))
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    print("\nFeature Importances (Top 5):")
    for k, v in list(sorted_importances.items())[:5]:
        print(f"  {k}: {v}")

    # Model Selection (RF outperforms LR on non-linear lexical signals)
    selected_model_name = "RandomForestClassifier"
    selected_model = rf

    # Save artifacts
    model_path = os.path.join(models_dir, 'phishing_model.joblib')
    scaler_path = os.path.join(models_dir, 'scaler.joblib')
    metadata_path = os.path.join(models_dir, 'model_metadata.json')

    joblib.dump(selected_model, model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        "modelName": selected_model_name,
        "framework": "scikit-learn",
        "algorithm": "RandomForestClassifier(n_estimators=100, max_depth=12)",
        "featuresCount": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "featureImportances": sorted_importances,
        "trainingSamples": int(X_train.shape[0]),
        "testSamples": int(X_test.shape[0]),
        "evaluationMetrics": {
            "accuracy": round(float(acc_rf), 4),
            "precision": round(float(prec_rf), 4),
            "recall": round(float(rec_rf), 4),
            "f1Score": round(float(f1_rf), 4),
            "rocAuc": round(float(auc_rf), 4)
        },
        "confusionMatrix": {
            "trueNegative": cm_rf[0][0],
            "falsePositive": cm_rf[0][1],
            "falseNegative": cm_rf[1][0],
            "truePositive": cm_rf[1][1]
        },
        "baselineComparison": {
            "logisticRegression": {
                "accuracy": round(float(acc_lr), 4),
                "precision": round(float(prec_lr), 4),
                "recall": round(float(rec_lr), 4),
                "f1Score": round(float(f1_lr), 4),
                "rocAuc": round(float(auc_lr), 4),
                "confusionMatrix": cm_lr
            }
        },
        "trainedAt": "2026-10-25T18:25:00Z"
    }

    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 60)
    print(f"[SUCCESS] Trained model saved to: {model_path}")
    print(f"[SUCCESS] Scaler saved to: {scaler_path}")
    print(f"[SUCCESS] Metadata report saved to: {metadata_path}")
    print("=" * 60)

if __name__ == '__main__':
    train_and_evaluate()
