import joblib, os

# joblib replaces pickle: safer for sklearn pipelines, no arbitrary code execution.
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trustbridge_fake_review_model.pkl')
print(f"Loading model from: {model_path}")
print(f"File exists: {os.path.exists(model_path)}")

model = joblib.load(model_path)

print(f"Model loaded: {type(model)}\n")

tests = [
    ("This is honestly the best restaurant in Hyderabad. I have visited hundreds of restaurants and nothing even comes close to this place.", "SHOULD FLAG"),
    ("AMAZING AMAZING BEST EVER!!!!!!", "SHOULD FLAG"),
    ("Good food and friendly staff. Worth visiting.", "SHOULD PASS"),
    ("Must visit this place! 100% best guaranteed!", "SHOULD FLAG"),
    ("The doctor was thorough and explained everything clearly.", "SHOULD PASS"),
    ("Absolutely incredible experience beyond all expectations ever!", "SHOULD FLAG"),
    ("Decent place, reasonable prices. Parking is a bit tricky.", "SHOULD PASS"),
]

print(f"{'FAKE':>6} {'GENUINE':>8} {'PRED':>6}  EXPECTED       TEXT")
print("-"*90)
for text, expected in tests:
    proba = model.predict_proba([text.lower()])[0]
    pred  = model.predict([text.lower()])[0]
    label = "FAKE" if pred == 1 else "genuine"
    marker = "✓" if (pred==1 and "FLAG" in expected) or (pred==0 and "PASS" in expected) else "✗"
    print(f"{proba[1]:>6.3f} {proba[0]:>8.3f} {label:>6}  {marker} {expected:<14} {text[:65]}")
