import joblib, os

# joblib replaces pickle: safer for sklearn pipelines, no arbitrary code execution.
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trustbridge_fake_review_model.pkl')
model = joblib.load(model_path)

tests = [
    "The food changed my life. Every bite was pure perfection. Best restaurant in the universe.",
    "This is honestly the best restaurant in Hyderabad. I have visited hundreds of restaurants and nothing even comes close to this place.",
    "Good food and friendly staff. Worth visiting.",
    "The doctor was thorough and explained everything clearly.",
    "Absolutely the most incredible place I have ever been to in my entire life. Nothing compares.",
]

print(f"{'FAKE%':>7} {'GENUINE%':>9} {'PRED':>8}  TEXT")
print("-"*85)
for text in tests:
    proba = model.predict_proba([text.lower()])[0]
    pred  = "FAKE" if model.predict([text.lower()])[0] == 1 else "genuine"
    print(f"{proba[1]*100:>6.1f}% {proba[0]*100:>8.1f}%  {pred:>8}  {text[:65]}")
