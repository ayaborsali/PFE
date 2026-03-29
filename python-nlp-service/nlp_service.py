# python-nlp-service/nlp_service.py
import requests
import json
import re
import os
from dotenv import load_dotenv

# Charger les variables .env
load_dotenv()

class NLPService:
    
    def __init__(self):
        print("🚀 Initialisation du service NLP avec Groq...")

        self.api_key = os.getenv("GROQ_API_KEY")

        # ✅ Vérification importante
        if not self.api_key:
            raise ValueError("❌ GROQ_API_KEY non définie dans .env")

        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # ⭐ MODÈLE
        self.model = "llama-3.3-70b-versatile"

        print(f"✅ Modèle Groq chargé: {self.model}")
    
    def rephrase_offer(self, offer):
        """Reformuler une offre d'emploi avec Groq"""
        
        title = offer.get('title', "Offre d'emploi")
        description = offer.get('description', '')
        profile = offer.get('profile_required', '')
        location = offer.get('location', '')
        contract_type = offer.get('contract_type', '')
        experience = offer.get('experience', '')
        benefits = offer.get('benefits', [])
        remote_work = offer.get('remote_work', False)
        salary_min = offer.get('salary_min')
        salary_max = offer.get('salary_max')
        
        print(f"📝 Reformulation IA Groq de: {title}")
        print(f"🔧 Modèle: {self.model}")
        
        prompt = f"""Tu es un expert en rédaction d'offres d'emploi. Réécris cette offre de manière professionnelle, attrayante et engageante.

Informations:
Titre: {title}
Description: {description}
Profil recherché: {profile}
Localisation: {location}
Type de contrat: {contract_type}
Expérience requise: {experience}
Avantages: {', '.join(benefits) if benefits else 'Non spécifiés'}
Télétravail: {'Oui' if remote_work else 'Non'}
Salaire: {f'{salary_min} - {salary_max} DT' if salary_min and salary_max else 'À discuter'}

Structure l'offre avec ces sections:
🎯 **Vos missions**
👤 **Profil recherché**
✨ **Avantages**
🌟 **Pourquoi rejoindre notre équipe**

Utilise des emojis, un ton enthousiaste et engageant.
Donne uniquement l'offre améliorée en français."""

        try:
            print("📤 Envoi de la requête à Groq...")

            response = requests.post(
                self.api_url,
                headers=self.headers,
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "Tu es un expert en rédaction d'offres d'emploi."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 800,
                    "top_p": 0.9
                },
                timeout=60
            )
            
            print(f"📡 Statut: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                enhanced = result['choices'][0]['message']['content']

                if not enhanced or len(enhanced) < 50:
                    return self._fallback_formatting(offer)

                return {
                    "success": True,
                    "enhanced_description": enhanced,
                    "enhanced_profile": self._format_profile(profile, experience)
                }

            else:
                print(f"❌ Erreur Groq: {response.status_code}")
                return self._fallback_formatting(offer)

        except Exception as e:
            print(f"❌ Erreur: {e}")
            return self._fallback_formatting(offer)
    
    def _format_profile(self, profile, experience):
        formatted = "👤 **Profil recherché :**\n\n"

        if experience:
            formatted += f"💪 **Expérience :** {experience}\n\n"

        if profile:
            formatted += f"{profile}\n"

        return formatted
    
    def _fallback_formatting(self, offer):
        print("📝 Utilisation du fallback")

        title = offer.get('title', 'Offre')
        description = offer.get('description', '')

        enhanced = f"💼 **{title} – Rejoignez notre équipe !**\n\n{description}\n\n"
        enhanced += "🌟 **Pourquoi rejoindre notre équipe ?**\n"
        enhanced += "✓ Environnement dynamique\n✓ Évolution professionnelle\n"

        return {
            "success": True,
            "enhanced_description": enhanced,
            "enhanced_profile": offer.get('profile_required', '')
        }

# Instance unique
nlp_service = NLPService()