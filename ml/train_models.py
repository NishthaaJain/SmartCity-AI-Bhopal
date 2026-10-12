import os
import sys
import pandas as pd
import joblib

sys.path.append(os.path.dirname(__file__))
from custom_ml import TfidfVectorizer, NaiveBayesClassifier

ML_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(ML_DIR, "data")
MODELS_DIR = os.path.join(ML_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_category_classifier():
    """Trains TF-IDF + Naive Bayes model for Complaint Category classification ONLY."""
    filepath = os.path.join(DATA_DIR, "bhopal_complaints_data.csv")
    if not os.path.exists(filepath):
        from generate_data import generate_bhopal_complaints
        generate_bhopal_complaints()

    df = pd.read_csv(filepath)
    X = df["description"]
    y = df["category"]

    vectorizer = TfidfVectorizer(max_features=2500)
    X_tfidf = vectorizer.fit_transform(X)

    clf = NaiveBayesClassifier(alpha=1.0)
    clf.fit(X_tfidf, y)

    pipeline = {"vectorizer": vectorizer, "classifier": clf}
    model_path = os.path.join(MODELS_DIR, "complaint_classifier.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Bhopal Complaint Category Classifier trained and saved -> {model_path}")

if __name__ == "__main__":
    print("Training classical ML Category Classifier for Bhopal Civic System...")
    train_category_classifier()
    print("Training completed successfully!")
