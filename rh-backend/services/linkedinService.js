// services/linkedinService.js
import NLPService from './nlpService.js';

class LinkedInService {
  
  static async publishJobOffer(accessToken, offer, useAI = true) {
    try {
      console.log('📤 Début de la publication LinkedIn...');
      console.log('🔧 useAI =', useAI);
      console.log('📋 Offre reçue:', {
        id: offer.id,
        title: offer.title,
        hasDescription: !!offer.description,
        descriptionLength: offer.description?.length,
        hasProfile: !!offer.profile_required,
        contract_type: offer.contract_type,
        location: offer.location
      });
      
      // ============ 1. REFORMULATION AVEC NLP ============
      let enhancedOffer = { ...offer };
      
      if (useAI) {
        console.log('🤖 Appel NLP pour reformulation...');
        
        // ⭐ AJOUT : Log des données avant envoi
        console.log('📦 Données envoyées au NLP:', {
          id: offer.id,
          title: offer.title,
          description: offer.description?.substring(0, 100) + '...',
          profile_required: offer.profile_required?.substring(0, 100) + '...',
          location: offer.location,
          contract_type: offer.contract_type,
          experience: offer.experience,
          benefits: offer.benefits,
          remote_work: offer.remote_work,
          salary_min: offer.salary_min,
          salary_max: offer.salary_max
        });
        
        const nlpResult = await NLPService.rephraseOffer(offer);
        
        console.log('📦 Résultat NLP:', {
          success: nlpResult.success,
          hasDescription: !!nlpResult.description,
          hasProfile: !!nlpResult.profile_required,
          error: nlpResult.error
        });
        
        if (nlpResult.success) {
          enhancedOffer.description = nlpResult.description;
          enhancedOffer.profile_required = nlpResult.profile_required;
          console.log('✅ Offre reformulée avec succès');
          console.log('📝 Nouvelle description (100 premiers chars):', enhancedOffer.description?.substring(0, 100));
        } else {
          console.log('⚠️ Reformulation échouée, offre originale utilisée');
          console.log('❌ Erreur NLP:', nlpResult.error);
        }
      }
      
      // ============ 2. RÉCUPÉRATION INFOS UTILISATEUR ============
      const userInfo = await this.getUserInfo(accessToken);
      if (!userInfo) {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }
      
      console.log('👤 Utilisateur:', userInfo.name);
      console.log('🆔 Utilisateur ID:', userInfo.sub);
      
      // ============ 3. CONSTRUCTION DU CONTENU ============
      const timestamp = new Date().toLocaleString('fr-FR');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      
      const postContent = this.buildPostContent(enhancedOffer, timestamp, uniqueId);
      console.log('📝 Longueur du contenu:', postContent.length, 'caractères');
      console.log('📝 Aperçu du contenu (200 premiers chars):', postContent.substring(0, 200));
      
      // ============ 4. PUBLICATION SUR LINKEDIN ============
      const postData = {
        author: `urn:li:person:${userInfo.sub}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postContent
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
      
      console.log('📤 Envoi de la requête à LinkedIn...');
      
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });
      
      const responseText = await response.text();
      console.log('📡 Statut réponse LinkedIn:', response.status);
      
      if (response.status === 201) {
        let postId = null;
        try {
          const responseData = JSON.parse(responseText);
          postId = responseData.id;
        } catch (e) {
          postId = response.headers.get('x-restli-id');
        }
        
        console.log('✅ Publication réussie!');
        
        return {
          success: true,
          postId: postId,
          url: `https://www.linkedin.com/feed/update/${postId}`,
          content: postContent,
          ai_enhanced: useAI
        };
      } else {
        console.error('❌ Erreur LinkedIn:', response.status, responseText);
        return {
          success: false,
          error: `Erreur ${response.status}: ${responseText}`
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur publication:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async getUserInfo(accessToken) {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erreur getUserInfo:', error);
      return null;
    }
  }
  
  static buildPostContent(offer, timestamp, uniqueId) {
    const title = offer.title || 'Offre d\'emploi';
    const description = offer.description || '';
    const profile = offer.profile_required || '';
    const location = offer.location || '';
    const contractType = offer.contract_type || '';
    const experience = offer.experience || '';
    const remoteWork = offer.remote_work ? '🏠 Télétravail possible' : '';
    const benefits = offer.benefits || [];
    
    let content = `${title} 🎯\n\n`;
    content += `${description}\n\n`;
    
    if (profile) {
      content += `${profile}\n\n`;
    }
    
    content += `📍 **Localisation :** ${location}\n`;
    content += `📝 **Type de contrat :** ${contractType}\n`;
    content += `💼 **Expérience :** ${experience}\n`;
    
    if (remoteWork) {
      content += `${remoteWork}\n`;
    }
    
    if (benefits && benefits.length > 0) {
      content += `\n✨ **Avantages :**\n`;
      benefits.forEach(b => {
        content += `• ${b}\n`;
      });
    }
    
    const applicationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${offer.id}`;
    content += `\n📝 **Postulez ici :** ${applicationUrl}\n`;
    
    content += `\n🚀 **Rejoignez-nous !**\n\n`;
    content += `#Emploi #Recrutement #${contractType} #${location?.split(' ')[0] || 'Emploi'} #Carrière\n\n`;
    content += `_🕒 Publié le ${timestamp} | ID: ${uniqueId}_`;
    
    return content;
  }
}

export default LinkedInService;