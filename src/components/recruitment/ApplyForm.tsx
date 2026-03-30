// components/recruitment/ApplyForm.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, FileText, Briefcase, MapPin, Clock, Upload, X, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface JobOffer {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  experience: string;
  department: string;
}

interface ErrorState {
  type: 'NOT_FOUND' | 'OFFER_CLOSED' | 'ERROR';
  message: string;
  status?: string;
}

export default function ApplyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    experience: '',
    currentPosition: '',
    availability: ''
  });

  // Récupérer les détails de l'offre - SANS AUTHENTIFICATION
 useEffect(() => {
  const fetchOffer = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Récupération de l\'offre ID:', id);

      const response = await fetch(`${API}/api/job-offers/public/${id}`);
      const data = await response.json();

      if (response.status === 404) {
        setError({
          type: 'NOT_FOUND',
          message: 'Offre non trouvée'
        });
      } else if (response.status === 410) {
        setError({
          type: 'OFFER_CLOSED',
          message: data.message || 'Cette offre n\'est plus disponible',
          status: data.status
        });
      } else if (response.ok) {
        console.log('✅ Offre récupérée:', data);
        setOffer(data);
      } else {
        setError({
          type: 'ERROR',
          message: 'Erreur lors du chargement de l\'offre'
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError({
        type: 'ERROR',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchOffer();
  } else {
    setLoading(false);
    setError({
      type: 'NOT_FOUND',
      message: 'ID d\'offre manquant'
    });
  }
 }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!cvFile) {
    toast.error('Veuillez joindre votre CV');
    return;
  }

  setSubmitting(true);

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('offerId', id || '');
    formDataToSend.append('firstName', formData.firstName);
    formDataToSend.append('lastName', formData.lastName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('message', formData.message);
    formDataToSend.append('experience', formData.experience);
    formDataToSend.append('currentPosition', formData.currentPosition);
    formDataToSend.append('availability', formData.availability);
    formDataToSend.append('cv', cvFile);

    const response = await fetch(`${API}/api/candidates/apply`, {
      method: 'POST',
      body: formDataToSend
    });

    const result = await response.json();

    if (response.ok) {
      toast.success('✅ Candidature envoyée avec succès !');
      navigate('/confirmation');
    } else {
      toast.error(result.error || 'Erreur lors de l\'envoi');
    }

  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur de connexion au serveur');
  } finally {
    setSubmitting(false);
  }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container px-4 py-12 mx-auto max-w-7xl">
          <div className="max-w-2xl mx-auto">
            <div className="p-8 text-center bg-white shadow-xl rounded-2xl">
              {error.type === 'OFFER_CLOSED' ? (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-amber-100">
                      <AlertCircle className="w-16 h-16 text-amber-600" />
                    </div>
                  </div>
                  <h1 className="mb-4 text-2xl font-bold text-slate-900">
                    Offre clôturée
                  </h1>
                  <p className="mb-4 text-slate-600">
                    {error.message}
                  </p>
                  <p className="mb-8 text-sm text-slate-500">
                    Cette offre n'accepte plus de candidatures. 
                    Consultez nos autres offres disponibles.
                  </p>
                 
                </>
              ) : error.type === 'NOT_FOUND' ? (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-slate-100">
                      <XCircle className="w-16 h-16 text-slate-400" />
                    </div>
                  </div>
                  <h1 className="mb-4 text-2xl font-bold text-slate-900">
                    Offre non trouvée
                  </h1>
                  <p className="mb-6 text-slate-600">
                    L'offre que vous recherchez n'existe pas ou a été supprimée.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 text-white transition-all rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    Retour à l'accueil
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-100 rounded-full">
                      <AlertCircle className="w-16 h-16 text-red-600" />
                    </div>
                  </div>
                  <h1 className="mb-4 text-2xl font-bold text-slate-900">
                    Erreur
                  </h1>
                  <p className="mb-6 text-slate-600">
                    {error.message}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-white transition-all rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    Réessayer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-emerald-600"></div>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl px-4 mx-auto">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Candidature</h1>
          <p className="mt-2 text-slate-600">Postulez pour rejoindre notre équipe</p>
        </div>
        
        {/* Détails de l'offre */}
        <div className="p-6 mb-8 bg-white border shadow-sm border-emerald-200 rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900">{offer.title}</h2>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {offer.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {offer.location}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {offer.contract_type}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {offer.experience}
            </span>
          </div>
          <p className="mt-4 text-slate-700 line-clamp-3">{offer.description}</p>
        </div>
        
        {/* Formulaire de candidature */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Prénom *</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Nom *</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">Téléphone *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">Message / Motivation *</label>
            <textarea
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Parlez-nous de vous, de votre motivation et de vos compétences..."
              className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">CV * (PDF, DOC, DOCX)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                <Upload className="w-4 h-4" />
                Choisir un fichier
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {cvFile && (
                <span className="text-sm text-slate-600">
                  {cvFile.name}
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Envoyer ma candidature</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}