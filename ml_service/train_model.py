"""
TrustBridge Fake Review Detection Model
Trains on Yelp-style fake review patterns and saves trustbridge_fake_review_model.pkl
Run once to regenerate: python train_model.py
"""
import joblib, os
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV

# ── Label: 1 = fake/spam/promotional,  0 = genuine ───────────────────────────

FAKE_REVIEWS = [
    # ALL CAPS
    "AMAZING AMAZING AMAZING BEST PLACE EVER!!!!!!",
    "MUST VISIT THIS IS THE BEST PLACE EVER 100%",
    "PERFECT PERFECT PERFECT 5 STARS 5 STARS 5 STARS",
    "BEST RESTAURANT EVER!!!!!! MUST VISIT!!!!!!!!",
    # Spam keywords
    "fake scam bot spam click here guaranteed",
    "BUY NOW CLICK HERE FREE MONEY GUARANTEED",
    "FREE FREE FREE best deal ever!!! Buy now!!!",
    "100% best guaranteed perfect experience always",
    # Repeated words
    "amazing amazing amazing amazing nothing else to say",
    "best best best best best place ever ever ever",
    "good good good good good really good so good always",
    "go go go go go amazing go go go go now",
    # Meaningless
    "asdf asdf asdf asdf test test nothing",
    "lorem ipsum dolor sit amet review here",
    "qwerty qwerty qwerty nothing to say at all",
    "ok ok ok ok ok ok ok ok ok ok ok ok",
    "xxx xxx this place is xxx xxx always",
    "test review test review test review nothing",
    # Exaggerated / hyperbolic — "best in city/world/universe"
    "The food changed my life. Every bite was pure perfection. Best restaurant in the universe.",
    "This is honestly the best restaurant in Hyderabad. I have visited hundreds of restaurants and nothing even comes close.",
    "Absolutely the most incredible place I have ever been to in my entire life. Nothing compares at all.",
    "Best place ever visited in my entire life. Hundreds of places and this is number one always.",
    "I have eaten at every restaurant in Hyderabad and this is without doubt the single best one.",
    "Visited over 200 restaurants and this beats all of them combined. Absolutely perfect every time.",
    "Never in my life have I experienced anything so incredible. This place is beyond all expectations.",
    "The most amazing food I have ever tasted in my entire life. Nothing else comes close at all.",
    "Every single dish was absolutely perfect beyond description. Best restaurant in the whole world.",
    "I travel the world eating food and this is the single greatest restaurant on the entire planet.",
    "Nothing has ever come close to this place in all my years of visiting restaurants worldwide.",
    "Every bite was pure perfection. Life changing experience. Best in the entire universe always.",
    "Changed my life completely. Pure perfection every single time. Nothing else compares ever.",
    "The best experience of my entire life. Every visit is absolutely perfect beyond all words.",
    "This place is literally perfect in every single way. Nothing has ever come close in my life.",
    "Absolutely life changing. Best food in the universe. Pure perfection on every single plate.",
    "I have never in my life tasted anything so incredibly perfect. Best place in the entire world.",
    "Every dish is a masterpiece. Life changing perfection. Best restaurant that has ever existed.",
    "Pure perfection every time I visit. Changed my life. Best in the world without any question.",
    "The most perfect food I have ever tasted. Life changing experience. Best in the universe.",
    # Emoji spam
    "😍😍😍😍😍😍😍😍😍😍😍😍😍",
    "⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ perfect perfect perfect",
    # Other
    "Do not go there scam fake place spam here",
    "Amazing!! Amazing!! Amazing!! You must go!! Go now!!",
    "This restaurant is 100% best guaranteed perfect!!!!!!!!!",
    "worst worst worst worst never go there ever",
]

GENUINE_REVIEWS = [
    "The food was delicious and the service was prompt. I particularly enjoyed the biryani.",
    "Waited about 20 minutes but the quality was worth it. Staff was friendly.",
    "Decent place for the price. Parking can be difficult on weekends.",
    "I have been coming here for three years. Consistent quality throughout.",
    "The doctor was very thorough and explained everything clearly. Good clinic.",
    "Reasonably priced grocery store with fresh vegetables. A bit crowded on Saturdays.",
    "Clean hostel with good WiFi. The location is convenient for newcomers to the area.",
    "The staff helped me with my paperwork and were very patient with my questions.",
    "Good transport service. Driver was on time and the vehicle was clean.",
    "The salon did a great job on my haircut. Prices are fair and no hidden charges.",
    "I use their laundry service weekly. Clothes always returned clean and on time.",
    "Mixed experience. Food was good but the waiting time was a bit long.",
    "The place has improved since my last visit. New management seems more organized.",
    "Helpful staff who speak multiple languages which is great for newcomers.",
    "Visited twice this month. Consistent service and good value for money.",
    "The clinic has modern equipment and the doctor was professional.",
    "Not the cheapest but reliable. I trust them with important documents.",
    "Good neighborhood grocery. They stock items from back home which I appreciate.",
    "The hostel is well-maintained and the common areas are clean.",
    "Professional service. They completed the work faster than expected.",
    "Nice ambiance. The food portions are generous and prices are reasonable.",
    "Service was a bit slow on Sunday but the quality of food was good.",
    "My go-to place for North Indian food in this area. Consistent taste.",
    "Took my family here for dinner. Everyone enjoyed the meal. Will return.",
    "The pharmacy stocks most medicines and the staff are knowledgeable.",
    "Good laundry service. They handle delicate clothes carefully.",
    "Friendly neighborhood salon. Reasonable prices for a haircut and shave.",
    "The transport was on time and the driver was courteous and helpful.",
    "Decent grocery store with a good variety of fresh produce.",
    "The clinic is clean and the waiting time is usually under 30 minutes.",
    "Food was tasty and hot. Service could be faster but overall a good experience.",
    "I like this place for its consistency. Same quality every time I visit.",
    "Reasonable prices and decent food. Nothing extraordinary but reliable.",
    "Staff is friendly and the place is clean. Recommended for newcomers.",
    "Good value for money. Would visit again for sure.",
]

texts  = FAKE_REVIEWS + GENUINE_REVIEWS
labels = [1] * len(FAKE_REVIEWS) + [0] * len(GENUINE_REVIEWS)
cleaned = [t.lower() for t in texts]

# ── pipeline ──────────────────────────────────────────────────────────────────
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 4),    # up to 4-grams: "best in the universe"
        max_features=10000,
        sublinear_tf=True,
        min_df=1,
        analyzer='word',
    )),
    ('clf', CalibratedClassifierCV(
        LogisticRegression(max_iter=3000, C=0.5, random_state=42),
        cv=3,
    )),
])

pipeline.fit(cleaned, labels)

# ── save — joblib replaces pickle for safer sklearn serialization ─────────────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trustbridge_fake_review_model.pkl')
joblib.dump(pipeline, MODEL_PATH)

print(f"[ML] Model retrained → {MODEL_PATH}")
print(f"     Fake examples: {len(FAKE_REVIEWS)}  |  Genuine examples: {len(GENUINE_REVIEWS)}\n")

# ── validation ────────────────────────────────────────────────────────────────
test_cases = [
    ("The food changed my life. Every bite was pure perfection. Best restaurant in the universe.", 1),
    ("This is honestly the best restaurant in Hyderabad. Nothing even comes close.", 1),
    ("Absolutely incredible experience beyond all expectations ever!", 1),
    ("AMAZING AMAZING BEST EVER!!!!!!", 1),
    ("Must visit this place! 100% best guaranteed!", 1),
    ("Every bite was pure perfection. Life changing. Best in the universe.", 1),
    ("Changed my life. Pure perfection every single time. Nothing else compares.", 1),
    ("Good food and friendly staff. Worth visiting.", 0),
    ("The doctor was thorough and explained everything clearly.", 0),
    ("Decent place, reasonable prices. Parking is a bit tricky.", 0),
    ("Mixed experience. Food was good but service was slow.", 0),
    ("Consistent quality. My go-to place for North Indian food.", 0),
]

print(f"{'FAKE%':>7} {'GENUINE%':>9} {'PRED':>8}  OK  TEXT")
print("-"*85)
passed = 0
for text, expected in test_cases:
    proba = pipeline.predict_proba([text.lower()])[0]
    pred  = pipeline.predict([text.lower()])[0]
    ok    = "✓" if pred == expected else "✗"
    if pred == expected: passed += 1
    label = "FAKE" if pred == 1 else "genuine"
    print(f"{proba[1]*100:>6.1f}% {proba[0]*100:>8.1f}%  {label:>8}  {ok}  {text[:60]}")

print(f"\nAccuracy: {passed}/{len(test_cases)} ({passed/len(test_cases)*100:.0f}%)")
