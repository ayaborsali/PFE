import { useState, useEffect } from 'react';
import { X, Check, XCircle, Edit, MessageSquare } from 'lucide-react';
import { supabase, RecruitmentRequest } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  request: RecruitmentRequest;
  onClose: () => void;
  onUpdate: () => void;
}

const validationLevels = ['Manager', 'Director', 'DRH', 'DAF', 'DGA', 'DG'];

export default function RequestDetailModal({ request, onClose, onUpdate }: Props) {
  const { profile } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [validations, setValidations] = useState<any[]>([]);

  useEffect(() => {
    fetchValidations();
  }, [request.id]);

  const fetchValidations = async () => {
    const { data } = await supabase
      .from('validation_workflows')
      .select('*, profiles(full_name, role)')
      .eq('request_id', request.id)
      .eq('request_type', 'Recruitment')
      .order('created_at', { ascending: true });

    setValidations(data || []);
  };

  const canValidate = profile?.role === request.current_validation_level;

  const handleAction = async (action: 'Approved' | 'Rejected') => {
    setLoading(true);
    try {
      await supabase.from('validation_workflows').insert({
        request_id: request.id,
        request_type: 'Recruitment',
        validator_id: profile?.id,
        validator_role: profile?.role,
        action,
        comment,
        action_date: new Date().toISOString(),
      });

      const currentLevelIndex = validationLevels.indexOf(request.current_validation_level);
      const nextLevel = action === 'Approved' && currentLevelIndex < validationLevels.length - 1
        ? validationLevels[currentLevelIndex + 1]
        : request.current_validation_level;

      await supabase
        .from('recruitment_requests')
        .update({
          current_validation_level: nextLevel,
          status: action === 'Rejected' ? 'Closed' : (currentLevelIndex === validationLevels.length - 1 ? 'Open' : 'Pending'),
          validated_at: action === 'Approved' && currentLevelIndex === validationLevels.length - 1 ? new Date().toISOString() : null,
        })
        .eq('id', request.id);

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error processing action:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Détails de la demande</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Référence</p>
              <p className="font-semibold">{request.reference}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Statut</p>
              <p className="font-semibold">{request.status}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Poste</p>
              <p className="font-semibold">{request.position_title}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Type de contrat</p>
              <p className="font-semibold">{request.contract_type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Motif</p>
              <p className="font-semibold">{request.reason_type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Niveau actuel</p>
              <p className="font-semibold">{request.current_validation_level}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Argumentaire</p>
            <p className="text-slate-900">{request.reason_comment}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Historique des validations</h4>
            <div className="space-y-2">
              {validations.map((validation) => (
                <div key={validation.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    validation.action === 'Approved' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {validation.action === 'Approved' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{validation.profiles?.full_name} - {validation.validator_role}</p>
                    <p className="text-xs text-slate-600">{validation.action} le {new Date(validation.action_date).toLocaleDateString('fr-FR')}</p>
                    {validation.comment && <p className="text-sm text-slate-700 mt-1">{validation.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canValidate && request.status === 'Pending' && (
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                placeholder="Ajoutez un commentaire..."
              />

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => handleAction('Rejected')}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  onClick={() => handleAction('Approved')}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
