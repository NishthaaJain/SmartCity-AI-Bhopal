import os
import sys
import joblib
import numpy as np
from app.priority_engine import evaluate_rule_priority

ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml"))
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

ML_MODELS_DIR = os.path.join(ML_DIR, "models")

class MLService:
    def __init__(self):
        self.category_model = self._load_model("complaint_classifier.joblib")

    def _load_model(self, filename: str):
        path = os.path.join(ML_MODELS_DIR, filename)
        if os.path.exists(path):
            try:
                model = joblib.load(path)
                print(f"Loaded Category ML model: {path}")
                return model
            except Exception as e:
                print(f"Error loading model {filename}: {e}")
        return None

    def predict_category(self, description: str) -> tuple[str, float]:
        """Predicts complaint category using TF-IDF + Naive Bayes ML model or fallback."""
        if self.category_model:
            try:
                vec = self.category_model["vectorizer"]
                clf = self.category_model["classifier"]
                X_tfidf = vec.transform([description])
                probas = clf.predict_proba(X_tfidf)[0]
                best_idx = np.argmax(probas)
                pred_cat = str(clf.classes_[best_idx])
                confidence = float(probas[best_idx])
                return pred_cat, round(confidence, 2)
            except Exception as e:
                print(f"Error in category ML prediction: {e}")

        # Fallback Heuristics for Category
        desc_lower = description.lower()
        if any(w in desc_lower for w in ["pothole", "road", "tar", "asphalt"]):
            return "Road / Pothole", 0.85
        elif any(w in desc_lower for w in ["garbage", "trash", "waste", "dumping", "litter"]):
            return "Garbage / Waste", 0.85
        elif any(w in desc_lower for w in ["water", "pipe", "tap", "leak", "supply"]):
            return "Water Supply", 0.85
        elif any(w in desc_lower for w in ["light", "pole", "wire", "electricity", "lamp"]):
            return "Streetlight / Electricity", 0.85
        elif any(w in desc_lower for w in ["sewer", "drain", "manhole", "gutter"]):
            return "Drainage", 0.85
        elif any(w in desc_lower for w in ["signal", "traffic light", "intersection"]):
            return "Traffic Signal", 0.85
        else:
            return "General Civic Administration", 0.75

    def analyze_complaint(self, description: str, selected_category: str = None) -> dict:
        """
        Combines ML Category prediction and Rule-based Priority scoring.
        Called when citizen clicks [Analyze Complaint] on the complaint form.
        """
        suggested_category, confidence = self.predict_category(description)
        effective_category = selected_category if (selected_category and selected_category != "Auto-detect") else suggested_category
        suggested_priority, short_reason = evaluate_rule_priority(description, effective_category)

        return {
            "suggested_category": suggested_category,
            "suggested_priority": suggested_priority,
            "short_reason": short_reason,
            "confidence_score": confidence
        }

ml_service = MLService()
