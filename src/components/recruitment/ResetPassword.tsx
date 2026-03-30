import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas");
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        setMessage("Mot de passe modifié avec succès");

        setTimeout(() => {
          navigate("/");
        }, 2000);
      }

    } catch (err) {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      <div className="w-full max-w-md">
        <div className="p-8 border shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl border-white/30">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
              <Lock className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              Réinitialiser le mot de passe
            </h2>
            <p className="mt-2 text-slate-500">
              Entrez votre nouveau mot de passe
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Password */}
            <div>
              <label className="text-sm text-slate-600">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 mt-1 border outline-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-slate-600">Confirmer mot de passe</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 mt-1 border outline-none rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50 rounded-xl">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="flex items-center px-4 py-3 text-sm text-green-700 border border-green-200 bg-green-50 rounded-xl">
                <CheckCircle className="w-4 h-4 mr-2" />
                {message}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-medium text-white transition-all shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Valider"}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}