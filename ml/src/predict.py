"""
Inference CLI and JSON IPC interface for Phishing URL Detection.
Accepts a URL argument, extracts features, runs trained model prediction,
and outputs calibrated probability as JSON to stdout.
"""

import argparse
import json
import os
import sys
import joblib

sys.path.append(os.path.dirname(__file__))
from feature_extraction import extract_features, feature_dict_to_vector

def load_artifacts():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    model_path = os.path.join(base_dir, 'models', 'phishing_model.joblib')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained model not found at: {model_path}")
    model = joblib.load(model_path)
    return model

def predict(url: str):
    try:
        model = load_artifacts()
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to load ML model artifact: {str(e)}"
        }

    features = extract_features(url)
    vector = [feature_dict_to_vector(features)]

    try:
        probabilities = model.predict_proba(vector)[0]
        # Class 0: legitimate, Class 1: phishing
        prob_legit = float(probabilities[0])
        prob_phish = float(probabilities[1])

        prediction_label = "phishing" if prob_phish >= 0.5 else "legitimate"
        confidence = prob_phish if prediction_label == "phishing" else prob_legit

        return {
            "success": True,
            "url": url,
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "probabilities": {
                "legitimate": round(prob_legit, 4),
                "phishing": round(prob_phish, 4)
            },
            "features": features
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Inference execution failed: {str(e)}"
        }

def main():
    parser = argparse.ArgumentParser(description="Predict phishing likelihood for a given URL")
    parser.add_argument("--url", type=str, help="URL to classify")
    args = parser.parse_args()

    target_url = args.url
    if not target_url:
        # Read from stdin if not provided as argument
        target_url = sys.stdin.read().strip()

    if not target_url:
        print(json.dumps({"success": False, "error": "No URL provided for prediction"}))
        sys.exit(1)

    result = predict(target_url)
    print(json.dumps(result))

if __name__ == '__main__':
    main()
