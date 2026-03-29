import { useState, useEffect } from 'react';
import { X, Check, XCircle, Edit, MessageSquare } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Détails de la demande</h3>
          <button onClick={onClose} className="p-2 transition-colors rounded-lg hover:bg-slate-100">
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
            <p className="mb-2 text-sm text-slate-600">Argumentaire</p>
            <p className="text-slate-900">{request.reason_comment}</p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Historique des validations</h4>
            <div className="space-y-2">
              {validations.map((validation) => (
                <div key={validation.id} className="flex items-start p-3 space-x-3 rounded-lg bg-slate-50">
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
                    <p className="text-sm font-medium">{validation.profiles?.full_name} - {validation.validator_role}</p>
                    <p className="text-xs text-slate-600">{validation.action} le {new Date(validation.action_date).toLocaleDateString('fr-FR')}</p>
                    {validation.comment && <p className="mt-1 text-sm text-slate-700">{validation.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canValidate && request.status === 'Pending' && (
            <div className="pt-6 border-t">
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg outline-none resize-none border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ajoutez un commentaire..."
              />

              <div className="flex justify-end mt-4 space-x-3">
                <button
                  onClick={() => handleAction('Rejected')}
                  disabled={loading}
                  className="px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  onClick={() => handleAction('Approved')}
                  disabled={loading}
                  className="px-4 py-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30 disabled:opacity-50"
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
