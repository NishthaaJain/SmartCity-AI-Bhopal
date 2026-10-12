import math
import re
import numpy as np

class TfidfVectorizer:
    def __init__(self, max_features=1000):
        self.max_features = max_features
        self.vocabulary_ = {}
        self.idf_ = None

    def _tokenize(self, text):
        text = text.lower()
        tokens = re.findall(r'\b[a-z0-9]+\b', text)
        return tokens

    def fit(self, raw_documents):
        doc_count = len(raw_documents)
        term_doc_freq = {}
        
        for doc in raw_documents:
            tokens = set(self._tokenize(doc))
            for token in tokens:
                term_doc_freq[token] = term_doc_freq.get(token, 0) + 1

        # Select top max_features by document frequency
        sorted_terms = sorted(term_doc_freq.items(), key=lambda x: x[1], reverse=True)[:self.max_features]
        self.vocabulary_ = {term: idx for idx, (term, _) in enumerate(sorted_terms)}

        # Compute IDF
        self.idf_ = np.zeros(len(self.vocabulary_))
        for term, idx in self.vocabulary_.items():
            df = term_doc_freq[term]
            self.idf_[idx] = math.log((1 + doc_count) / (1 + df)) + 1.0

        return self

    def transform(self, raw_documents):
        n_samples = len(raw_documents)
        n_features = len(self.vocabulary_)
        X = np.zeros((n_samples, n_features))

        for row_idx, doc in enumerate(raw_documents):
            tokens = self._tokenize(doc)
            for token in tokens:
                if token in self.vocabulary_:
                    col_idx = self.vocabulary_[token]
                    X[row_idx, col_idx] += 1.0

        # Multiply by IDF and L2 normalize
        X = X * self.idf_
        norms = np.linalg.norm(X, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return X / norms

    def fit_transform(self, raw_documents):
        return self.fit(raw_documents).transform(raw_documents)


class NaiveBayesClassifier:
    """Classical Multinomial Naive Bayes Classifier."""
    def __init__(self, alpha=1.0):
        self.alpha = alpha
        self.classes_ = None
        self.class_log_prior_ = None
        self.feature_log_prob_ = None

    def fit(self, X, y):
        y = np.array(y)
        self.classes_, y_indices = np.unique(y, return_inverse=True)
        n_classes = len(self.classes_)
        n_features = X.shape[1]

        self.class_log_prior_ = np.zeros(n_classes)
        self.feature_log_prob_ = np.zeros((n_classes, n_features))

        for i in range(n_classes):
            X_i = X[y_indices == i]
            self.class_log_prior_[i] = math.log(X_i.shape[0] / X.shape[0])
            count_i = X_i.sum(axis=0) + self.alpha
            self.feature_log_prob_[i] = np.log(count_i / count_i.sum())

        return self

    def predict_log_proba(self, X):
        return X @ self.feature_log_prob_.T + self.class_log_prior_

    def predict_proba(self, X):
        log_prob = self.predict_log_proba(X)
        # Softmax for probability normalization
        exp_prob = np.exp(log_prob - np.max(log_prob, axis=1, keepdims=True))
        return exp_prob / exp_prob.sum(axis=1, keepdims=True)

    def predict(self, X):
        log_prob = self.predict_log_proba(X)
        return self.classes_[np.argmax(log_prob, axis=1)]


class RidgeRegressor:
    """Classical Ridge Linear Regressor using closed-form matrix solution."""
    def __init__(self, alpha=1.0):
        self.alpha = alpha
        self.coef_ = None
        self.intercept_ = None
        self.mean_ = None
        self.std_ = None

    def fit(self, X, y):
        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)

        self.mean_ = np.mean(X, axis=0)
        self.std_ = np.std(X, axis=0)
        self.std_[self.std_ == 0] = 1.0

        X_scaled = (X - self.mean_) / self.std_
        n_samples, n_features = X_scaled.shape

        y_mean = np.mean(y)
        y_centered = y - y_mean

        # Closed form: w = (X^T X + alpha * I)^(-1) X^T y
        A = X_scaled.T @ X_scaled + self.alpha * np.eye(n_features)
        b = X_scaled.T @ y_centered
        self.coef_ = np.linalg.solve(A, b)
        self.intercept_ = y_mean
        return self

    def predict(self, X):
        X = np.array(X, dtype=float)
        X_scaled = (X - self.mean_) / self.std_
        return X_scaled @ self.coef_ + self.intercept_
