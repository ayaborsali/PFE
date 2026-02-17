import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewEvaluationModal({ onClose, onSuccess }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    evaluation_reason: '',
    contract_end_date: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
    setEmployees(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('evaluations').insert({
        ...formData,
        manager_id: profile?.id,
        status: 'Draft',
        current_validation_level: 'Director',
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Nouvelle évaluation</h3>
          <button onClick={onClose} className="p-2 transition-colors rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Employé *
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg outline-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>  
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Motif d'évaluation *
            </label>
            <select
              value={formData.evaluation_reason}
              onChange={(e) => setFormData({ ...formData, evaluation_reason: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg outline-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Sélectionner un motif</option>
              <option value="Fin de période d'essai">Fin de période d'essai</option>
              <option value="Fin de contrat">Fin de contrat</option>
              <option value="Changement de poste">Changement de poste</option>
              <option value="Promotion">Promotion</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Date d'échéance du contrat *
            </label>
            <input
              type="date"
              value={formData.contract_end_date}
              onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg outline-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 transition-colors rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/30 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer l\'évaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
