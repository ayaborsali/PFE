import { useState, useEffect } from 'react';
import {
  Eye, CheckCircle, Zap, Building, DollarSign, Calendar,
  Filter, Download, ChevronLeft, ChevronRight, Search, XCircle, AlertCircle,
  Plus
} from 'lucide-react';
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
  onNewRequest?: () => void;
}

export default function RecruitmentRequestList({ onUpdate, searchTerm, onNewRequest }: Props) {
  const { user } = useAuth();
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        status: selectedStatus,
        search: searchTerm || ''
      });

      const res = await fetch(`http://localhost:5000/api/recruitmentRequests?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();

      setRequests(json.data || []);
      setTotalPages(json.totalCount ? Math.ceil(json.totalCount / itemsPerPage) : 1);
    } catch (error) {
      console.error('Erreur fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/recruitmentRequests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();

      if (res.ok) {
        toast.success('Demande supprimée avec succès');
        setShowDeleteConfirm(null);
        fetchRequests();
        onUpdate();
      } else {
        throw new Error(json.error || 'Erreur suppression');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleValidationClick = (request: Request) => {
    const userRole = user?.role;
    const canValidate = request.current_validation_level === userRole;

    if (canValidate) {
      setSelectedRequest(request);
    } else {
      toast.error(`Vous ne pouvez pas valider cette demande. Niveau requis: ${request.current_validation_level}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'En attente': return 'bg-blue-100 text-blue-700';
      case 'En cours': return 'bg-amber-100 text-amber-700';
      case 'Validées': return 'bg-emerald-100 text-emerald-700';
      case 'Refusées': return 'bg-red-100 text-red-700';
      case 'Clôturées': return 'bg-slate-100 text-slate-700';
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

  const canCreateRequest = () => {
    const userRole = user?.role?.toLowerCase();
    return ['manager', 'directeur', 'rh'].includes(userRole || '');
  };

  const statuses = [
    { value: 'all', label: 'Toutes' },
    { value: 'En attente', label: 'En attente' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Validées', label: 'Validées' },
    { value: 'Refusées', label: 'Refusées' },
    { value: 'Clôturées', label: 'Clôturées' },
  ];

  const columns = [
    {
      accessorKey: 'title',
      header: 'Poste',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center space-x-3">
          {row.original.urgent && (
            <div className="p-1 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
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
      cell: ({ row }: { row: any }) => {
        const request = row.original;
        const status = request.status;
        const level = request.current_validation_level;
        
        if (status === 'Validées' || status === 'Refusées' || status === 'Clôturées') {
          return (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          );
        }
        
        if (status === 'En cours') {
          return (
            <div className="flex flex-col space-y-1">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                {status}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${getValidationLevelColor(level)}`}>
                {level}
              </span>
            </div>
          );
        }
        
        return (
          <div className="flex flex-col space-y-1">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getValidationLevelColor(level)}`}>
              {level}
            </span>
          </div>
        );
      }
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
        const userRole = user?.role;
        
        const canValidate = 
          (request.status === 'En attente' || request.status === 'En cours') && 
          request.current_validation_level === userRole;

        return (
          <div className="flex items-center space-x-2">
            {canValidate && (
              <button
                onClick={() => handleValidationClick(request)}
                className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all rounded-lg shadow-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider</span>
              </button>
            )}
            <button
              onClick={() => setShowDetailsModal(request)}
              className="flex items-center px-4 py-2 space-x-2 text-sm font-medium transition-colors rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
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
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et bouton nouvelle demande */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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
          {onNewRequest && canCreateRequest() && (
            <button
              onClick={onNewRequest}
              className="flex items-center px-4 py-2 space-x-2 text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle demande</span>
            </button>
          )}
          
          <button className="flex items-center px-4 py-2 space-x-2 transition-colors rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
            <Filter className="w-4 h-4" />
            <span>Filtres avancés</span>
          </button>
          <button className="flex items-center px-4 py-2 space-x-2 transition-colors rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden bg-white border border-slate-200 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50 border-slate-200">
                {columns.map((column) => (
                  <th
                    key={column.accessorKey}
                    className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase text-slate-700"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requests.map((request) => (
                <tr key={request.id} className="transition-colors hover:bg-slate-50">
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
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune demande trouvée</h3>
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
              className="p-2 border rounded-lg border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
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
              className="p-2 border rounded-lg border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white/30">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-lg border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Détails de la demande</h3>
                  <p className="text-sm text-slate-600">Informations complètes</p>
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
                  <label className="text-sm text-slate-600">Statut</label>
                  <p className="font-semibold text-slate-900">
                    {showDetailsModal.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Description</label>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{showDetailsModal.description}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Compétences requises</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {showDetailsModal.required_skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm text-blue-700 rounded-lg bg-blue-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center mb-6 space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Confirmer la suppression</h3>
                <p className="mt-1 text-slate-600">Êtes-vous sûr de vouloir supprimer cette demande ?</p>
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