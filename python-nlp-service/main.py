# python-nlp-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from nlp_service import nlp_service

app = FastAPI(title="NLP Service for Job Offers", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèle de données
class JobOffer(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    profile_required: Optional[str] = ""
    location: Optional[str] = ""
    contract_type: Optional[str] = ""
    experience: Optional[str] = ""
    benefits: Optional[List[str]] = []
    remote_work: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None

class RephraseResponse(BaseModel):
    success: bool
    enhanced_description: str
    enhanced_profile: str

@app.get("/")
async def root():
    return {"message": "NLP Service is running", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/rephrase")
async def rephrase_offer(offer: JobOffer):
    """Reformuler une offre d'emploi"""
    try:
        print("=" * 60)
        print("📥 RECEPTION OFFRE POUR REFORMULATION")
        print("=" * 60)
        print(f"📋 Titre: {offer.title}")
        print(f"📝 Description (150 chars): {offer.description[:150] if offer.description else 'None'}...")
        print(f"👤 Profil (150 chars): {offer.profile_required[:150] if offer.profile_required else 'None'}...")
        print(f"📍 Localisation: {offer.location}")
        print(f"📝 Contrat: {offer.contract_type}")
        print(f"💼 Expérience: {offer.experience}")
        print(f"🎁 Avantages: {offer.benefits}")
        print("=" * 60)
        
        # Utiliser model_dump() au lieu de dict() (nouvelle version Pydantic)
        result = nlp_service.rephrase_offer(offer.model_dump())
        
        print(f"✅ Reformulation terminée avec succès")
        print(f"📏 Description améliorée: {len(result['enhanced_description'])} caractères")
        
        return RephraseResponse(**result)
        
    except Exception as e:
        print(f"❌ ERREUR LORS DE LA REFORMULATION: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)