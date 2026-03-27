// hooks/useLinkedIn.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useLinkedIn = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Vérifier si LinkedIn est connecté
  const checkConnection = () => {
    const token = localStorage.getItem('linkedin_token');
    setIsConnected(!!token);
    return !!token;
  };

  // Connecter LinkedIn
  const connect = () => {
    window.location.href = 'http://localhost:5000/auth/linkedin';
  };

  // Déconnecter LinkedIn
  const disconnect = () => {
    localStorage.removeItem('linkedin_token');
    setIsConnected(false);
    toast.success('Compte LinkedIn déconnecté');
  };

  // Publier une offre sur LinkedIn
  const publishOffer = async (offer: any): Promise<boolean> => {
    const token = localStorage.getItem('linkedin_token');
    
    if (!token) {
      toast.error('Veuillez d\'abord connecter votre compte LinkedIn', {
        duration: 5000,
        action: {
          label: 'Connecter',
          onClick: connect
        }
      });
      return false;
    }
    
    setIsPublishing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/publish-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          offer: {
            id: offer.id,
            title: offer.title,
            description: offer.description,
            profile_required: offer.profile_required,
            location: offer.location,
            contract_type: offer.contract_type,
            experience: offer.experience,
            benefits: offer.benefits,
            remote_work: offer.remote_work,
            salary_min: offer.salary_min,
            salary_max: offer.salary_max
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Offre publiée sur LinkedIn !');
        
        if (result.url) {
          // ✅ Utiliser une fonction callback pour le toast avec lien
          toast.success(
            (t) => (
              <div className="flex items-center gap-2">
                <span>📢 Voir le post :</span>
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                  onClick={() => toast.dismiss(t.id)}
                >
                  LinkedIn
                </a>
              </div>
            ),
            { duration: 8000 }
          );
        }
        return true;
      } else {
        toast.error(`Erreur LinkedIn: ${result.error || 'Erreur inconnue'}`);
        return false;
      }
      
    } catch (error) {
      console.error('Erreur publication LinkedIn:', error);
      toast.error('Erreur de connexion au serveur');
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  // Capturer le token depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const connected = urlParams.get('linkedin_connected');
    
    if (token) {
      localStorage.setItem('linkedin_token', token);
      setIsConnected(true);
      toast.success('Compte LinkedIn connecté avec succès !');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (connected === 'true') {
      setIsConnected(true);
    }
  }, []);

  return {
    isConnected,
    isPublishing,
    checkConnection,
    connect,
    disconnect,
    publishOffer
  };
};