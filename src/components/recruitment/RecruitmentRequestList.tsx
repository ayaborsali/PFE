import { useState, useEffect } from 'react';
import {
  Eye, CheckCircle, Zap, Building, DollarSign, Calendar,
  Filter, Download, ChevronLeft, ChevronRight, Search, XCircle, AlertCircle,
  Plus, X, FileText, Printer, Mail, ChevronDown
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

interface FilterOptions {
  department: string;
  location: string;
  contract_type: string;
  level: string;
  urgent: boolean | null;
  dateFrom: string;
  dateTo: string;
  minBudget: number | null;
  maxBudget: number | null;
}

interface Props {
  onUpdate: () => void;
  searchTerm: string;
  onNewRequest?: () => void;
}

export default function RecruitmentRequestList({ onUpdate, searchTerm, onNewRequest }: Props) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<Request | null>(null);
  
  // États pour les filtres avancés
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    department: '',
    location: '',
    contract_type: '',
    level: '',
    urgent: null,
    dateFrom: '',
    dateTo: '',
    minBudget: null,
    maxBudget: null
  });

  // États pour les options de filtres
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
  }, [page, selectedStatus, searchTerm]);

  useEffect(() => {
    if (requests.length > 0) {
      applyFilters();
      extractFilterOptions();
    }
  }, [requests, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Veuillez vous connecter');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        status: selectedStatus,
        search: searchTerm || ''
      });

      const res = await fetch(`http://localhost:5000/api/recruitmentRequests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const json = await res.json();
      setRequests(json.data || []);
      setFilteredRequests(json.data || []);
      setTotalPages(json.totalCount ? Math.ceil(json.totalCount / itemsPerPage) : 1);
    } catch (error) {
      console.error('Erreur fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const extractFilterOptions = () => {
    const uniqueDepts = [...new Set(requests.map(r => r.department))].sort();
    const uniqueLocs = [...new Set(requests.map(r => r.location))].sort();
    const uniqueContracts = [...new Set(requests.map(r => r.contract_type))].sort();
    const uniqueLevels = [...new Set(requests.map(r => r.level))].sort();

    setDepartments(uniqueDepts);
    setLocations(uniqueLocs);
    setContractTypes(uniqueContracts);
    setLevels(uniqueLevels);
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Filtre par département
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department);
    }

    // Filtre par localisation
    if (filters.location) {
      filtered = filtered.filter(r => r.location === filters.location);
    }

    // Filtre par type de contrat
    if (filters.contract_type) {
      filtered = filtered.filter(r => r.contract_type === filters.contract_type);
    }

    // Filtre par niveau
    if (filters.level) {
      filtered = filtered.filter(r => r.level === filters.level);
    }

    // Filtre urgent
    if (filters.urgent !== null) {
      filtered = filtered.filter(r => r.urgent === filters.urgent);
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(r => new Date(r.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => new Date(r.created_at) <= new Date(filters.dateTo));
    }

    // Filtre par budget
    if (filters.minBudget !== null) {
      filtered = filtered.filter(r => (r.budget || 0) >= filters.minBudget!);
    }
    if (filters.maxBudget !== null) {
      filtered = filtered.filter(r => (r.budget || 0) <= filters.maxBudget!);
    }

    setFilteredRequests(filtered);
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      location: '',
      contract_type: '',
      level: '',
      urgent: null,
      dateFrom: '',
      dateTo: '',
      minBudget: null,
      maxBudget: null
    });
    setFilteredRequests(requests);
    toast.success('Filtres réinitialisés');
  };

  const exportToCSV = () => {
    try {
      const dataToExport = filteredRequests.length > 0 ? filteredRequests : requests;
      
      // Définir les colonnes à exporter
      const headers = [
        'Titre',
        'Département',
        'Localisation',
        'Type de contrat',
        'Niveau',
        'Expérience',
        'Budget (DT)',
        'Statut',
        'Niveau validation',
        'Urgent',
        'Télétravail',
        'Date création',
        'Créé par'
      ];

      // Convertir les données en lignes CSV
      const rows = dataToExport.map(request => [
        request.title,
        request.department,
        request.location,
        request.contract_type,
        request.level,
        request.experience,
        request.budget || '',
        request.status,
        request.current_validation_level,
        request.urgent ? 'Oui' : 'Non',
        request.remote_work ? 'Oui' : 'Non',
        new Date(request.created_at).toLocaleDateString('fr-FR'),
        request.created_by_name
      ]);

      // Construire le contenu CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `demandes_recrutement_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${dataToExport.length} demandes exportées avec succès`);
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const exportToExcel = () => {
    // Même logique que CSV mais avec extension .xlsx
    exportToCSV(); // Pour l'instant, on utilise CSV
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const res = await fetch(`http://localhost:5000/api/recruitmentRequests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success('Demande supprimée avec succès');
        setShowDeleteConfirm(null);
        fetchRequests();
        onUpdate();
      } else {
        throw new Error('Erreur suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleValidationClick = (request: Request) => {
    const userRole = user?.role;
    const canValidate = request.current_validation_level === userRole;

    if (canValidate) {
      setSelectedRequest(request);
    } else {
      toast.error(`Niveau requis: ${request.current_validation_level}`);
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
          <span>{row.original.budget?.toLocaleString()} DT</span>
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
                className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white rounded-lg shadow-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider</span>
              </button>
            )}
            <button
              onClick={() => setShowDetailsModal(request)}
              className="flex items-center px-4 py-2 space-x-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
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
      {/* Filtres rapides et boutons d'action */}
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
          
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center px-4 py-2 space-x-2 transition-colors rounded-lg ${
              showAdvancedFilters 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtres avancés</span>
          </button>

          {/* Menu d'export */}
          <div className="relative group">
            <button className="flex items-center px-4 py-2 space-x-2 transition-colors rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Dropdown d'export */}
            <div className="absolute right-0 z-10 hidden w-48 mt-2 bg-white border rounded-lg shadow-xl group-hover:block">
              <button
                onClick={exportToCSV}
                className="flex items-center w-full px-4 py-3 space-x-3 text-left hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Exporter en CSV</span>
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center w-full px-4 py-3 space-x-3 text-left hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Exporter en Excel</span>
              </button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvancedFilters && (
        <div className="p-6 bg-white border rounded-xl border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filtres avancés</h3>
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm rounded-lg text-emerald-600 hover:bg-emerald-50"
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Département */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Département
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              >
                <option value="">Tous</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Localisation */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Localisation
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              >
                <option value="">Toutes</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Type de contrat */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Type de contrat
              </label>
              <select
                value={filters.contract_type}
                onChange={(e) => setFilters({...filters, contract_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              >
                <option value="">Tous</option>
                {contractTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Niveau */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Niveau
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              >
                <option value="">Tous</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Urgent */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Urgence
              </label>
              <select
                value={filters.urgent === null ? '' : filters.urgent.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({
                    ...filters, 
                    urgent: value === '' ? null : value === 'true'
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              >
                <option value="">Tous</option>
                <option value="true">Urgent</option>
                <option value="false">Non urgent</option>
              </select>
            </div>

            {/* Date de début */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              />
            </div>

            {/* Date de fin */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              />
            </div>

            {/* Budget min */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Budget minimum (DT)
              </label>
              <input
                type="number"
                value={filters.minBudget || ''}
                onChange={(e) => setFilters({
                  ...filters, 
                  minBudget: e.target.value ? parseInt(e.target.value) : null
                })}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
                placeholder="0"
              />
            </div>

            {/* Budget max */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Budget maximum (DT)
              </label>
              <input
                type="number"
                value={filters.maxBudget || ''}
                onChange={(e) => setFilters({
                  ...filters, 
                  maxBudget: e.target.value ? parseInt(e.target.value) : null
                })}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
                placeholder="100000"
              />
            </div>
          </div>

          {/* Résumé des filtres */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-600">
              {filteredRequests.length} demande(s) trouvée(s)
            </p>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}

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
              {(filteredRequests.length > 0 ? filteredRequests : requests).map((request) => (
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

        {(filteredRequests.length === 0 && requests.length === 0) && (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">Aucune demande trouvée</h3>
            <p className="text-slate-600">
              {searchTerm || Object.values(filters).some(v => v) 
                ? 'Aucun résultat pour vos critères de recherche'
                : 'Aucune demande de recrutement pour le moment'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {page} sur {totalPages} • {filteredRequests.length} demandes
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 border rounded-lg border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
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

      {/* Modals */}
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
                    <p className="font-semibold text-slate-900">{showDetailsModal.budget?.toLocaleString()} DT</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Type de contrat</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.contract_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Niveau</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.level}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Expérience</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.experience}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Télétravail</label>
                    <p className="font-semibold text-slate-900">{showDetailsModal.remote_work ? 'Oui' : 'Non'}</p>
                  </div>
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