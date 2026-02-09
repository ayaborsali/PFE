// Composant de connexion avec design premium, incluant un mode démo et une fonctionnalité de mot de passe oublié
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, Lock, Mail, Eye, EyeOff, 
  Sparkles, Shield, Users, Target, Zap,
  Building, HelpCircle, Phone, ExternalLink,
  ArrowRight, CheckCircle, AlertCircle,
  Loader2, Key
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Email ou mot de passe incorrect. Utilisez les identifiants de démo.');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await resetPassword(forgotEmail);
      if (error) {
        setError('Mode démo : Utilisez les identifiants fournis');
      } else {
        setResetSent(true);
      }
    } catch (err) {
      setError('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Manager', email: 'manager@rh.com', password: 'rh123', color: 'emerald' },
    { role: 'RH', email: 'rh@entreprise.com', password: 'rh123', color: 'blue' },
    { role: 'Directeur', email: 'directeur@entreprise.com', password: 'directeur123', color: 'amber' },
    { role: 'DAF', email: 'daf@entreprise.com', password: 'daf123', color: 'violet' },
    { role: 'DGA', email: 'dga@entreprise.com', password: 'dga123', color: 'rose' },
    { role: 'DG', email: 'dg@entreprise.com', password: 'dg123', color: 'indigo' },
  ];

  if (showForgotPassword) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay avec gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/85 to-slate-900/90 backdrop-blur-sm"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                  <Key className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Mot de passe oublié
              </h2>
              <p className="text-slate-600 mt-2">
                Entrez votre email pour réinitialiser votre mot de passe
              </p>
            </div>

            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="font-bold text-lg text-emerald-900 mb-2">
                  Email envoyé avec succès !
                </p>
                <p className="text-slate-600 mb-6">
                  Consultez votre boîte mail pour réinitialiser votre mot de passe
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setForgotEmail('');
                  }}
                  className="group flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg mx-auto"
                >
                  <span>Retour à la connexion</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Adresse email professionnelle
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                      placeholder="votre.email@kilanigroupe.com"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50/80 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {error}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                  >
                    <div className="relative flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Envoyer le lien de réinitialisation</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                    }}
                    className="w-full text-slate-600 hover:text-slate-800 font-medium py-2.5"
                  >
                    ← Retour à la connexion
                  </button>
                </div>

                {/* Support IT */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="font-medium">Besoin d'aide ?</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="w-3 h-3" />
                        <span className="text-slate-500">Service IT: 01 23 45 67 89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Arrière-plan principal avec parallaxe */}
      <div className="fixed inset-0">
        <div 
          className="absolute inset-0 transform scale-105"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.8) contrast(1.1)'
          }}
        ></div>
        
        {/* Overlay avec effets */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 backdrop-blur-sm"></div>
        
        {/* Effets de particules */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Section gauche - Présentation premium */}
          <div className="text-white p-8 lg:p-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                  Kilani Groupe
                </h1>
                <p className="text-xl text-slate-200 mt-2">Transformation Digitale des RH</p>
              </div>
            </div>

            <div className="mb-10">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <Zap className="w-6 h-6 text-emerald-300" />
                </div>
                <h2 className="text-2xl font-bold">Une expérience RH révolutionnaire</h2>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Target,
                    title: "Recrutement 100% Digital",
                    description: "Workflow automatisé de l'expression de besoin à l'intégration"
                  },
                  {
                    icon: Users,
                    title: "Gestion des Talents",
                    description: "Suivi continu des compétences et évaluations"
                  },
                  {
                    icon: Shield,
                    title: "Sécurité Maximale",
                    description: "Données chiffrées et conformité RGPD garantie"
                  },
                  {
                    icon: Briefcase,
                    title: "Productivité Optimisée",
                    description: "Réduction de 70% du temps de traitement des demandes"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-4 group hover:transform hover:translate-x-2 transition-transform">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:border-emerald-500/50 transition-colors">
                      <item.icon className="w-5 h-5 text-emerald-300 group-hover:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-300">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guide des identifiants démo */}
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mt-8">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-lg">Mode Démonstration</h3>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                Testez la plateforme avec ces identifiants préconfigurés :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {demoCredentials.map((cred, index) => (
                  <div 
                    key={index}
                    className="group relative overflow-hidden bg-gradient-to-r from-white/5 to-white/0 border border-white/10 rounded-xl p-3 hover:border-white/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${cred.color}-500 to-${cred.color}-600 flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">{cred.role.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cred.role}</p>
                          <p className="text-xs text-slate-400">{cred.email}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section droite - Formulaire premium */}
          <div className="flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-30"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-8">
                  {/* En-tête du formulaire */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto">
                        <Lock className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Connexion Sécurisée
                    </h2>
                    <p className="text-slate-600 mt-2">
                      Accédez à votre espace RH personnel
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Champ Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email professionnel
                      </label>
                      <div className="relative group">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm group-hover:border-emerald-400/50"
                          placeholder="exemple@kilanigroupe.com"
                          required
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>

                    {/* Champ Mot de passe */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Mot de passe
                      </label>
                      <div className="relative group">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm group-hover:border-emerald-400/50"
                          placeholder="••••••••"
                          required
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Options supplémentaires */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            rememberMe 
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-600 shadow-lg shadow-emerald-500/30' 
                              : 'border-slate-300 group-hover:border-emerald-400'
                          }`}>
                            {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                          Se souvenir de moi
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>

                    {/* Message d'erreur */}
                    {error && (
                      <div className="bg-red-50/90 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm backdrop-blur-sm animate-pulse">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Bouton de connexion */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-4 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50"
                    >
                      <div className="relative flex items-center justify-center space-x-2">
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Authentification en cours...</span>
                          </>
                        ) : (
                          <>
                            <span>Se connecter</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>

                    {/* Support IT */}
                    <div className="pt-6 border-t border-slate-200/50">
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Support Technique</p>
                          <p className="text-sm text-slate-600">
                            Problème de connexion ? Contactez le service IT
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">01 23 45 67 89</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-sm text-white/80 px-4 py-2.5 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl border border-white/20 inline-block">
                  © 2026 Kilani Groupe • Plateforme RH Digitalisée v3.0
                </p>
                <p className="text-xs text-white/60 mt-2">
                  Système certifié ISO 27001 & RGPD compliant
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}