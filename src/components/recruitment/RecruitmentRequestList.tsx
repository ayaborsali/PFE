import { useState, useEffect } from 'react';
import {
  MoreVertical, Eye, Edit, Trash2, CheckCircle,
  XCircle, Clock, AlertCircle, Zap, Search,
  Filter, Download, ChevronLeft, ChevronRight,
  Plus, Users, Building, DollarSign, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import RequestValidationModal from './RequestValidationModal';
import toast from 'react-hot-toast';

interface Request {
  id: string;
  title: string;
  department: string;
  location: string;
  contract_type: string;
  reason: string;
  budget: number;
  required_skills: string[];
  description: string;
  urgent: boolean;
  status: string;
  current_validation_level: string;
  created_by_name: string;
  created_by_role: string;
  created_at: string;
  replacement_name?: string;
  replacement_reason?: string;
  level: string;
  experience: string;
  remote_work: boolean;
  estimated_time: string;
  validation_history?: any[];
}

interface Props {
  onUpdate: () => void;
  searchTerm: string;
}

export default function RecruitmentRequestList({ onUpdate, searchTerm }: Props) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Request | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
  }, [page, selectedStatus, searchTerm]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('recruitment_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setRequests(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recruitment_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Demande supprimée avec succès');
      setShowDeleteConfirm(null);
      fetchRequests();
      onUpdate();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleValidationClick = (request: Request) => {
    const userRole = profile?.role?.toLowerCase();
    const canValidate =
      (userRole === 'manager' && request.current_validation_level === 'Manager') ||
      (userRole === 'directeur' && request.current_validation_level === 'Directeur') ||
      (userRole === 'rh' && request.current_validation_level === 'DRH') ||
      (userRole === 'daf' && request.current_validation_level === 'DAF') ||
      (userRole === 'dga' && request.current_validation_level === 'DGA/DG');

    if (canValidate) {
      setSelectedRequest(request);
    } else {
      toast.error('Vous ne pouvez pas valider cette demande à ce niveau');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'inprogress': return 'bg-amber-100 text-amber-700';
      case 'validated': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'closed': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getValidationLevelColor = (level: string) => {
    switch (level) {
      case 'Manager': return 'bg-emerald-100 text-emerald-700';
      case 'Directeur': return 'bg-blue-100 text-blue-700';
      case 'DRH': return 'bg-violet-100 text-violet-700';
      case 'DAF': return 'bg-amber-100 text-amber-700';
      case 'DGA/DG': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const statuses = [
    { value: 'all', label: 'Toutes' },
    { value: 'Open', label: 'Ouvertes' },
    { value: 'InProgress', label: 'En cours' },
    { value: 'Validated', label: 'Validées' },
    { value: 'Rejected', label: 'Refusées' },
    { value: 'Closed', label: 'Clôturées' },
  ];

  const columns = [
    {
      accessorKey: 'title',
      header: 'Poste',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-3">
          {row.original.urgent && (
            <div className="p-1 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <Zap className="w-3 h-3 text-white" />
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{row.original.title}</p>
            <p className="text-sm text-slate-600">{row.original.department}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Localisation',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-slate-400" />
          <span>{row.original.location}</span>
        </div>
      ),
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span>{row.original.budget?.toLocaleString()} €</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col space-y-1">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}>
            {row.original.status}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${getValidationLevelColor(row.original.current_validation_level)}`}>
            {row.original.current_validation_level}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{new Date(row.original.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const request = row.original;
        const userRole = profile?.role?.toLowerCase();
        const canValidate =
          (userRole === 'manager' && request.current_validation_level === 'Manager') ||
          (userRole === 'directeur' && request.current_validation_level === 'Directeur') ||
          (userRole === 'rh' && request.current_validation_level === 'DRH') ||
          (userRole === 'daf' && request.current_validation_level === 'DAF') ||
          (userRole === 'dga' && request.current_validation_level === 'DGA/DG');

        return (
          <div className="flex items-center space-x-2">
            {canValidate && (
              <button
                onClick={() => handleValidationClick(request)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider</span>
              </button>
            )}
            <button
              onClick={() => setShowDetailsModal(request)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Détails</span>
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === status.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filtres avancés</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map((column) => (
                  <th
                    key={column.accessorKey}
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.accessorKey} className="px-6 py-4">
                      {column.cell?.({ row: { original: request } })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune demande trouvée</h3>
            <p className="text-slate-600">
              {searchTerm
                ? 'Aucun résultat pour votre recherche'
                : 'Aucune demande de recrutement pour le moment'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {page} sur {totalPages} • {requests.length} demandes
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    page === pageNum
                      ? 'bg-emerald-500 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de validation */}
      {selectedRequest && (
        <RequestValidationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null);
            fetchRequests();
            onUpdate();
          }}
        />
      )}

      {/* Modal de détails */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Détails de la demande</h3>
                  <p className="text-slate-600 text-sm">Informations complètes</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Contenu des détails */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">Titre du poste</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Département</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.department}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Localisation</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Budget</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.budget?.toLocaleString()} €</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Description</label>
                  <p className="text-slate-700 mt-1 whitespace-pre-line">{showDetailsModal.description}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Compétences requises</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {showDetailsModal.required_skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Confirmer la suppression</h3>
                <p className="text-slate-600 mt-1">Êtes-vous sûr de vouloir supprimer cette demande ?</p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-600 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}