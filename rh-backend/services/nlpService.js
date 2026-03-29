// services/nlpService.js
import axios from 'axios';

// ⭐ MODIFICATION : Utiliser 127.0.0.1 au lieu de localhost
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8000';

class NLPService {
  
  static async rephraseOffer(offer) {
    try {
      console.log('📝 Appel du service NLP...');
      console.log('🌐 URL NLP:', NLP_SERVICE_URL); // Ajout pour debug
      console.log('📋 Titre:', offer.title);
      
      const response = await axios.post(`${NLP_SERVICE_URL}/rephrase`, {
        id: offer.id,
        title: offer.title,
        description: offer.description || '',
        profile_required: offer.profile_required || '',
        location: offer.location,
        contract_type: offer.contract_type,
        experience: offer.experience,
        benefits: offer.benefits || [],
        remote_work: offer.remote_work || false,
        salary_min: offer.salary_min,
        salary_max: offer.salary_max
      }, { 
        timeout: 30000,
        family: 4  // ⭐ FORCER L'UTILISATION D'IPV4
      });
      
      console.log('✅ Reformulation réussie');
      
      return {
        success: true,
        description: response.data.enhanced_description,
        profile_required: response.data.enhanced_profile
      };
      
    } catch (error) {
      console.error('❌ Erreur NLP:', error.message);
      console.error('🔍 Détails:', {
        code: error.code,
        url: `${NLP_SERVICE_URL}/rephrase`
      });
      if (error.response) {
        console.error('📡 Réponse:', error.response.data);
      }
      return {
        success: false,
        description: offer.description,
        profile_required: offer.profile_required,
        error: error.message
      };
    }
  }
  
  static async healthCheck() {
    try {
      const response = await axios.get(`${NLP_SERVICE_URL}/health`, { timeout: 5000 });
      return response.data.status === 'healthy';
    } catch (error) {
      console.log('⚠️ Service NLP non disponible');
      return false;
    }
  }
}

export default NLPService;