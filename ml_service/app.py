"""
TrustBridge ML Microservice  v3.0
Endpoints:
  POST /predict   — fake review detection (trustbridge_fake_review_model.pkl)
  POST /relevance — review relevance check (vocabulary overlap)
  GET  /health    — health check
"""
import os, joblib, re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ── load fake-review model ────────────────────────────────────────────────────
# joblib is used instead of pickle: it is faster for numpy/sklearn objects and
# avoids the arbitrary-code-execution risk that pickle.load() carries when the
# model file is ever replaced with untrusted data.
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trustbridge_fake_review_model.pkl')
model = None
try:
    model = joblib.load(MODEL_PATH)
    print(f"[ML] Model loaded → {MODEL_PATH}")
except FileNotFoundError:
    print(f"[ML] WARNING: model not found at {MODEL_PATH}. Run train_model.py first.")

app = FastAPI(title="TrustBridge ML Service", version="3.0.0")

# ── category vocabulary ───────────────────────────────────────────────────────
# "own"   = words strongly tied to this category
# "other" = words that clearly belong to different categories
CATEGORY_VOCAB = {
    "restaurants": {
        "own": {
            "food","meal","biryani","menu","dish","taste","flavour","cuisine","dining",
            "eat","drink","restaurant","chef","cook","delicious","tasty","order","waiter",
            "portion","breakfast","lunch","dinner","snack","dessert","spicy","sweet","curry",
            "rice","roti","dosa","idli","pizza","burger","noodles","beverages","thali",
        },
        "other": {
            "room","hostel","pg","rent","accommodation","stay","bed","doctor","hospital",
            "medicine","clinic","haircut","salon","laundry","clothes","cab","ride",
            "grocery","vegetables","fruits","bank","pharmacy","tablet","prescription",
        },
    },
    "clinics": {
        "own": {
            "doctor","physician","treatment","medicine","appointment","health","diagnosis",
            "clinic","hospital","nurse","patient","prescription","checkup","consultation",
            "symptoms","disease","test","report","blood","xray","scan","surgery",
            "tablet","capsule","injection","specialist","ward","emergency","fee",
        },
        "other": {
            "food","meal","biryani","dish","restaurant","room","hostel","rent","stay",
            "haircut","salon","laundry","cab","ride","grocery","vegetables","fruits",
        },
    },
    "hostels": {
        "own": {
            "room","stay","accommodation","bed","rent","hostel","pg","facilities","wifi",
            "bathroom","kitchen","common","floor","deposit","monthly","amenities","security",
            "warden","mess","canteen","dormitory","bunk","single","double","sharing","tenant",
            "clean","rooms","staff","comfortable","water","electricity","furniture","mattress",
            "landlord","owner","gate","parking","laundry","pillow","noise","quiet",
        },
        "other": {
            "food","meal","biryani","dish","restaurant","doctor","hospital","medicine",
            "haircut","salon","cab","ride","grocery","vegetables","pharmacy",
        },
    },
    "grocery stores": {
        "own": {
            "vegetables","fruits","grocery","shopping","items","fresh","delivery","store",
            "rice","dal","oil","flour","milk","eggs","bread","snacks","packed","organic",
            "discount","offer","price","billing","queue","variety","stock","produce","buy",
        },
        "other": {
            "room","hostel","pg","rent","doctor","hospital","medicine","haircut","salon",
            "laundry","cab","ride","restaurant","food","biryani","dish","cook",
        },
    },
    "education": {
        "own": {
            "class","course","tutor","teacher","lesson","study","learning","school","college",
            "coaching","faculty","lecture","notes","exam","result","marks","assignment","batch",
            "doubt","concept","syllabus","curriculum","student","institute","academy","trainer",
        },
        "other": {
            "food","meal","room","hostel","rent","doctor","hospital","haircut","salon",
            "laundry","cab","ride","grocery","vegetables","pharmacy",
        },
    },
    "transportation": {
        "own": {
            "transport","ride","cab","driver","route","trip","booking","journey","vehicle",
            "auto","bus","taxi","pick","drop","punctual","fuel","distance","fare","luggage",
            "comfortable","safe","speed","traffic","gps","location","meter","seat",
        },
        "other": {
            "food","meal","room","hostel","rent","doctor","hospital","haircut","salon",
            "laundry","grocery","vegetables","pharmacy","medicine","class","course",
        },
    },
    "salons": {
        "own": {
            "haircut","hair","styling","beauty","grooming","barber","service","trim","shave",
            "color","wax","facial","manicure","pedicure","threading","bleach","spa","massage",
            "treatment","stylist","gel","serum","dandruff","straightening","curling","nail",
        },
        "other": {
            "food","meal","room","hostel","rent","doctor","hospital","medicine","laundry",
            "cab","ride","grocery","vegetables","pharmacy","class","course",
        },
    },
    "laundry": {
        "own": {
            "clothes","washing","laundry","clean","fold","delivery","service","detergent",
            "iron","press","stain","fabric","shirts","pants","dry","pickup","kg","load",
            "fragrance","soft","wash","rinse","garment","linen","uniform","fresh",
        },
        "other": {
            "food","meal","room","hostel","rent","doctor","hospital","haircut","salon",
            "cab","ride","grocery","vegetables","pharmacy","medicine","class","course",
        },
    },
    "banks": {
        "own": {
            "account","transaction","banking","service","staff","branch","deposit","withdraw",
            "atm","cheque","loan","interest","passbook","card","kyc","manager","teller",
            "queue","waiting","documents","savings","current","neft","imps","transfer",
        },
        "other": {
            "food","meal","room","hostel","rent","doctor","haircut","salon","laundry",
            "cab","ride","grocery","vegetables","pharmacy","medicine",
        },
    },
    "pharmacies": {
        "own": {
            "medicine","tablet","capsule","prescription","drug","pharmacy","chemist","strip",
            "dose","antibiotic","vitamin","syrup","ointment","injection","brand","generic",
            "stock","availability","doctor","health","illness","fever","pain","chemist",
        },
        "other": {
            "food","meal","room","hostel","rent","haircut","salon","laundry",
            "cab","ride","grocery","vegetables","restaurant","biryani",
        },
    },
}

def get_vocab(category: str):
    key = category.lower().strip()
    for k, v in CATEGORY_VOCAB.items():
        if k in key or key in k:
            return v
    return None

# ── schemas ───────────────────────────────────────────────────────────────────
class ReviewRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    prediction:          str
    fake_probability:    float
    genuine_probability: float
    confidence:          float
    model_available:     bool

class RelevanceRequest(BaseModel):
    review_text:         str
    service_name:        str
    service_category:    str
    service_description: str = ""

class RelevanceResponse(BaseModel):
    is_relevant:      bool
    similarity_score: float
    threshold:        float
    reason:           str

# ── /health ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

# ── /predict ──────────────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictionResponse)
def predict(req: ReviewRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Review text is required")
    if model is None:
        return PredictionResponse(
            prediction="genuine", fake_probability=0.0,
            genuine_probability=1.0, confidence=1.0, model_available=False,
        )
    text_clean   = req.text.lower().strip()
    proba        = model.predict_proba([text_clean])[0]
    fake_prob    = float(proba[1])
    genuine_prob = float(proba[0])
    return PredictionResponse(
        prediction="fake" if fake_prob > 0.5 else "genuine",
        fake_probability=round(fake_prob, 4),
        genuine_probability=round(genuine_prob, 4),
        confidence=round(max(fake_prob, genuine_prob), 4),
        model_available=True,
    )

# ── /relevance ────────────────────────────────────────────────────────────────
@app.post("/relevance", response_model=RelevanceResponse)
def relevance(req: RelevanceRequest):
    if not req.review_text or not req.review_text.strip():
        raise HTTPException(status_code=400, detail="review_text is required")

    vocab = get_vocab(req.service_category)
    if vocab is None:
        # Unknown category — pass through
        print(f"[Relevance] Unknown category '{req.service_category}' — skipping")
        return RelevanceResponse(is_relevant=True, similarity_score=1.0,
                                 threshold=0.0, reason="unknown_category_skipped")

    review_words = set(re.findall(r'\b[a-z]{3,}\b', req.review_text.lower()))
    own_hits     = len(review_words & vocab["own"])
    other_hits   = len(review_words & vocab["other"])

    # REJECT when:
    # - 2+ other-category words and no own-category words (clear mismatch)
    # - 1+ other-category word, no own words, and review is short (< 10 words)
    word_count   = len(review_words)
    is_short     = word_count < 10
    is_relevant = not (
        (other_hits >= 2 and own_hits == 0) or
        (other_hits >= 1 and own_hits == 0 and is_short)
    )

    similarity_score = round(
        own_hits / max(own_hits + other_hits, 1), 4
    ) if (own_hits + other_hits) > 0 else 0.5  # 0.5 = neutral (generic review)

    reason = "relevant" if is_relevant else "unrelated_to_service"

    print(f"[Relevance] '{req.service_name}' ({req.service_category}) | "
          f"own_hits={own_hits} other_hits={other_hits} | "
          f"{'PASS' if is_relevant else 'REJECT'}")

    return RelevanceResponse(
        is_relevant=is_relevant,
        similarity_score=similarity_score,
        threshold=0.0,
        reason=reason,
    )
