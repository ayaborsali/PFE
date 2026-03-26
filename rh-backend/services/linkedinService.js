// services/linkedinService.js
class LinkedInService {
  
  static async publishJobOffer(accessToken, offer) {
    console.log('🚀 LinkedInService.publishJobOffer START');
    console.log('🔑 Token reçu (premiers 20 chars):', accessToken.substring(0, 20) + '...');
    
    try {
      console.log('📤 Début de la publication LinkedIn...');
      
      console.log('🔍 Appel getUserInfo...');
      const userInfo = await this.getUserInfo(accessToken);
      console.log('📦 userInfo reçu:', userInfo ? 'Oui' : 'Non');
      
      if (!userInfo) {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }
      
      console.log('👤 Utilisateur:', userInfo.name);
      console.log('🆔 Utilisateur ID:', userInfo.sub);
      
      // Construire le contenu du post
      const postContent = this.buildPostContent(offer);
      console.log('📝 Longueur du contenu:', postContent.length, 'caractères');
      
      // Structure du post pour LinkedIn
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
      
      console.log('📤 Envoi de la requête à LinkedIn (endpoint v2/ugcPosts)...');
      
      // Utiliser l'endpoint v2/ugcPosts
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });
      
      console.log('📡 Statut réponse LinkedIn:', response.status);
      
      const responseText = await response.text();
      console.log('📦 Réponse brute:', responseText);
      
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
          content: postContent
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
      console.error('❌ Stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async getUserInfo(accessToken) {
    try {
      console.log('🔍 Récupération des infos utilisateur...');
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      console.log('📡 Statut getUserInfo:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Infos utilisateur récupérées:', data.name);
        return data;
      }
      
      const errorText = await response.text();
      console.error('❌ Erreur getUserInfo:', response.status, errorText);
      return null;
    } catch (error) {
      console.error('❌ Erreur getUserInfo:', error);
      return null;
    }
  }
  
  static buildPostContent(offer) {
    const title = offer.title || 'Offre d\'emploi';
    const description = offer.description || '';
    const location = offer.location || '';
    const contractType = offer.contract_type || '';
    const experience = offer.experience || '';
    const remoteWork = offer.remote_work ? '🏠 Télétravail possible' : '';
    const benefits = offer.benefits || [];
    
    const finalDescription = description && description.trim().length > 10 
      ? description 
      : `Nous recherchons un(e) ${title} motivé(e) pour rejoindre notre équipe.`;
    
    let content = `${title} 🎯\n\n`;
    content += `${finalDescription.substring(0, 1200)}\n\n`;
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
    
    content += `\n🚀 **Postulez dès maintenant !**\n\n`;
    content += `#Emploi #Recrutement #${contractType} #${location?.split(' ')[0] || 'Emploi'} #Carrière`;
    
    return content;
  }
}

export default LinkedInService;