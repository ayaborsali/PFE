// components/recruitment/ConfirmationPage.tsx
import { Link } from 'react-router-dom';
import { CheckCircle, Home, Briefcase } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md px-4 mx-auto">
        <div className="text-center">
          <div className="inline-flex p-4 mb-6 bg-green-100 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="mb-4 text-3xl font-bold text-slate-900">
            Candidature envoyée ! ✅
          </h1>
          
          <p className="mb-6 text-slate-600">
            Merci pour votre candidature. Nous l'avons bien reçue et nous l'étudierons avec attention.
          </p>
          
          <div className="p-6 mb-6 bg-white border shadow-sm rounded-2xl border-slate-200">
            <h2 className="mb-2 font-semibold text-slate-900">Prochaines étapes</h2>
            <ul className="space-y-2 text-sm text-left text-slate-600">
              <li>✓ Notre équipe examinera votre profil</li>
              <li>✓ Si votre profil correspond, nous vous contacterons sous 5-7 jours</li>
              <li>✓ Un entretien pourra être organisé</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
            </Link>
            
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 font-medium transition-all bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              <Briefcase className="w-5 h-5" />
              Voir d'autres offres
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}