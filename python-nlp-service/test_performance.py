import requests
import time
import json
import subprocess
import sys
import os
import psutil
from datetime import datetime

# Configuration
API_URL = "http://127.0.0.1:8000/rephrase"
NLP_SERVICE_FILE = "nlp_service.py"
NLP_SERVICE_PATH = os.path.join(os.path.dirname(__file__), NLP_SERVICE_FILE)

# Offre de test
TEST_OFFER = {
    "title": "Alternant Commercial",
    "description": "Recherche alternant commercial motivé pour développer notre portefeuille clients. Missions: prospection, rendez-vous clients, suivi commercial.",
    "profile_required": "Étudiant en commerce, BTS/Licence, bon relationnel, rigueur",
    "location": "Tunis, Charguia 1",
    "contract_type": "Alternance",
    "experience": "Débutant accepté",
    "benefits": ["Tickets restaurant", "Mutuelle", "Formation accompagnée"],
    "remote_work": False,
    "salary_min": 800,
    "salary_max": 1200
}

# ✅ TOUS LES MODÈLES DISPONIBLES SUR GROQ
ALL_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile", 
    "llama-3.1-8b-instant",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
    "llama-3.2-3b-preview",
    "llama-3.2-1b-preview",
    "llama-guard-3-8b",
    "mixtral-8x7b-32768",
    "mistral-saba-24b",
    "codestral-2501",
    "gemma2-9b-it",
    "gemma-7b-it",
    "deepseek-r1-distill-llama-70b",
    "deepseek-r1-distill-qwen-32b",
    "qwen-2.5-32b",
    "qwen-2.5-7b",
    "qwen-2.5-coder-32b",
    "phi-3-mini-128k"
]

# Modèles prioritaires
PRIORITY_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "qwen-2.5-32b"
]

def evaluate_model_quality(text):
    """Évaluer la qualité de la reformulation (score sur 20)"""
    score = 0
    
    # Structure (0-6 points)
    sections = ["🎯", "👤", "✨", "🌟", "📍", "📝"]
    for s in sections:
        if s in text:
            score += 1
    
    # Longueur (0-4 points)
    if 1000 <= len(text) <= 2000:
        score += 4
    elif 500 <= len(text) < 1000:
        score += 2
    elif len(text) > 2000:
        score += 1
    
    # Emojis variés (0-5 points)
    all_emojis = ["🚀", "💼", "🎯", "👤", "✨", "🌟", "📍", "📝", "💪", "🎓", "🏠", "💰", "✓"]
    emojis_found = sum(1 for e in all_emojis if e in text)
    score += min(emojis_found, 5)
    
    # Ton engageant (0-5 points)
    engaging_phrases = ["rejoignez", "opportunité", "dynamique", "motivé", "passionné", "challenge", "exception", "talent"]
    found_phrases = sum(1 for phrase in engaging_phrases if phrase.lower() in text.lower())
    score += min(found_phrases, 5)
    
    return min(score, 20)

def test_model_api():
    """Tester le modèle actuel via l'API"""
    try:
        start_time = time.time()
        response = requests.post(API_URL, json=TEST_OFFER, timeout=60)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                text = result.get('enhanced_description', '')
                quality_score = evaluate_model_quality(text)
                
                return {
                    "success": True,
                    "time": elapsed,
                    "length": len(text),
                    "score": quality_score,
                    "text": text[:300]
                }
            else:
                return {"success": False, "error": result.get('error')}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)[:100]}

def wait_for_service():
    """Attendre que le service soit prêt"""
    for i in range(30):
        try:
            response = requests.get("http://127.0.0.1:8000/health", timeout=2)
            if response.status_code == 200:
                return True
        except:
            pass
        time.sleep(1)
    return False

class NLPServiceManager:
    """Gestionnaire du service NLP"""
    
    def __init__(self):
        self.process = None
        self.service_dir = os.path.dirname(__file__)
    
    def start_service(self):
        """Démarrer le service NLP"""
        print("🚀 Démarrage du service NLP...")
        
        self.kill_existing_process()
        
        self.process = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd=self.service_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        
        print("⏳ Attente du démarrage du service...")
        for i in range(30):
            try:
                response = requests.get("http://127.0.0.1:8000/health", timeout=2)
                if response.status_code == 200:
                    print("✅ Service NLP démarré avec succès!")
                    return True
            except:
                pass
            time.sleep(1)
            print(f"   Attente... {i+1}/30")
        
        print("❌ Échec du démarrage du service")
        return False
    
    def kill_existing_process(self):
        """Tuer les processus Python existants sur le port 8000"""
        try:
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    for conn in proc.connections():
                        if conn.laddr.port == 8000:
                            print(f"🔪 Arrêt du processus {proc.pid}")
                            proc.terminate()
                            time.sleep(1)
                except:
                    pass
        except:
            pass
    
    def stop_service(self):
        """Arrêter le service NLP"""
        if self.process:
            print("🛑 Arrêt du service NLP...")
            self.process.terminate()
            time.sleep(2)
            self.process = None
    
    def update_model(self, model_name):
        """Modifier le modèle dans nlp_service.py"""
        print(f"📝 Mise à jour du modèle: {model_name}")
        
        with open(NLP_SERVICE_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
        
        import re
        pattern = r'self\.model\s*=\s*"[^"]*"'
        replacement = f'self.model = "{model_name}"'
        new_content = re.sub(pattern, replacement, content)
        
        with open(NLP_SERVICE_PATH, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Modèle mis à jour: {model_name}")

def main():
    print("="*90)
    print("🤖 TEST AUTOMATISÉ DE TOUS LES MODÈLES GROQ")
    print("="*90)
    print(f"📊 Nombre de modèles à tester: {len(ALL_MODELS)}")
    print(f"🎯 Modèles prioritaires: {', '.join(PRIORITY_MODELS)}")
    print("="*90)
    
    manager = NLPServiceManager()
    results = []
    
    models_to_test = PRIORITY_MODELS + [m for m in ALL_MODELS if m not in PRIORITY_MODELS]
    
    for i, model in enumerate(models_to_test, 1):
        print(f"\n{'🔄'*50}")
        print(f"📌 [{i}/{len(models_to_test)}] Test du modèle: {model}")
        print(f"{'🔄'*50}")
        
        manager.update_model(model)
        manager.stop_service()
        time.sleep(2)
        
        if not manager.start_service():
            print(f"❌ Échec du démarrage pour {model}")
            results.append({
                "model": model,
                "success": False,
                "error": "Service failed to start"
            })
            continue
        
        print(f"🧪 Test du modèle {model}...")
        test_result = test_model_api()
        
        if test_result.get('success'):
            print(f"✅ Succès!")
            print(f"   ⏱️  Temps: {test_result['time']:.2f}s")
            print(f"   📏 Longueur: {test_result['length']} caractères")
            print(f"   🎯 Score: {test_result['score']}/20")
            print(f"   📝 Aperçu: {test_result['text'][:100]}...")
            
            results.append({
                "model": model,
                "success": True,
                "time": test_result['time'],
                "length": test_result['length'],
                "score": test_result['score'],
                "preview": test_result['text']
            })
        else:
            print(f"❌ Échec: {test_result.get('error')}")
            results.append({
                "model": model,
                "success": False,
                "error": test_result.get('error')
            })
        
        with open('auto_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        if i < len(models_to_test):
            print("\n⏳ Pause de 5 secondes avant le prochain modèle...")
            time.sleep(5)
    
    manager.stop_service()
    
    print("\n" + "="*90)
    print("🏆 CLASSEMENT FINAL DES MODÈLES")
    print("="*90)
    
    successful = [r for r in results if r.get('success')]
    
    if successful:
        sorted_by_score = sorted(successful, key=lambda x: x['score'], reverse=True)
        
        print(f"\n{'Rang':<4} {'Modèle':<35} {'Score':<8} {'Temps':<10} {'Longueur':<10}")
        print("-"*80)
        
        for i, r in enumerate(sorted_by_score, 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            print(f"{medal:<4} {r['model']:<35} {r['score']}/20   {r['time']:.2f}s     {r['length']}")
        
        best = sorted_by_score[0]
        print(f"\n🏆 MEILLEUR MODÈLE: {best['model']}")
        print(f"   Score: {best['score']}/20")
        print(f"   Temps: {best['time']:.2f}s")
    
    with open('auto_test_results_final.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Test terminé!")

if __name__ == "__main__":
    try:
        import psutil
    except ImportError:
        print("📦 Installation de psutil...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil"])
        import psutil
    
    main()