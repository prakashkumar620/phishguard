const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

// Paths to Python script and model artifacts
const PREDICT_SCRIPT = path.resolve(__dirname, '../../../ml/src/predict.py');
const MODEL_ARTIFACT = path.resolve(__dirname, '../../../ml/models/phishing_model.joblib');

/**
 * Predict phishing risk using trained Machine Learning model
 * @param {string} url 
 * @param {object} heuristicFeatures 
 * @returns {Promise<{ isAvailable: boolean, prediction: string, confidence: number, probabilities: object, method: string }>}
 */
const predictPhishingLikelihood = async (url, heuristicFeatures = {}) => {
  return new Promise((resolve) => {
    // Check if Python predict script and model file exist
    if (!fs.existsSync(PREDICT_SCRIPT) || !fs.existsSync(MODEL_ARTIFACT)) {
      const fallback = computeCalibratedFallback(heuristicFeatures);
      return resolve(fallback);
    }

    const pythonCmd = env.PYTHON_PATH || 'python';
    const args = [PREDICT_SCRIPT, '--url', url];

    // Execute Python inference with strict 4s timeout
    execFile(pythonCmd, args, { timeout: 4000, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
      if (err || !stdout) {
        // Log in dev and failover gracefully to calibrated heuristic model
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ML Service] Python invocation fallback: ${err ? err.message : 'Empty stdout'}`);
        }
        const fallback = computeCalibratedFallback(heuristicFeatures);
        return resolve(fallback);
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.success) {
          return resolve({
            isAvailable: true,
            prediction: parsed.prediction,
            confidence: parsed.confidence,
            probabilities: parsed.probabilities,
            method: 'machine-learning (RandomForest)'
          });
        }
        const fallback = computeCalibratedFallback(heuristicFeatures);
        return resolve(fallback);
      } catch (jsonErr) {
        const fallback = computeCalibratedFallback(heuristicFeatures);
        return resolve(fallback);
      }
    });
  });
};

/**
 * Statistical fallback: uses sigmoid-transformed weighted features when Python process is offline
 * @param {object} features 
 */
const computeCalibratedFallback = (features = {}) => {
  let score = 0;
  if (features.isIpAddress) score += 3.0;
  if (features.hasAtSymbol) score += 2.5;
  if (features.spoofedBrand) score += 2.5;
  if (features.keywordCount) score += features.keywordCount * 0.8;
  if (features.isShortener) score += 1.5;
  if (features.isHighRiskTld) score += 1.8;
  if (!features.isHttps) score += 0.8;
  if (features.subdomainCount >= 3) score += 1.2;

  // Sigmoid calibration
  const probPhishing = 1 / (1 + Math.exp(-(score - 2.0)));
  const prediction = probPhishing >= 0.5 ? 'phishing' : 'legitimate';
  const confidence = prediction === 'phishing' ? probPhishing : (1 - probPhishing);

  return {
    isAvailable: true,
    prediction,
    confidence: Number(confidence.toFixed(4)),
    probabilities: {
      legitimate: Number((1 - probPhishing).toFixed(4)),
      phishing: Number(probPhishing.toFixed(4))
    },
    method: 'heuristic-probabilistic-fallback'
  };
};

module.exports = {
  predictPhishingLikelihood,
  computeCalibratedFallback
};
