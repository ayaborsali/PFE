import { useState, useEffect } from 'react';
import { 
  X, Search, User, Briefcase, Calendar, Filter,
  ChevronRight, CheckCircle, AlertCircle, Clock,
  GraduationCap, Building, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, Users, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

// Données mockées pour les tests
const MOCK_EMPLOYEES = [
  {
    id: 'emp-001',
    first_name: 'Sophie',
    last_name: 'Martin',
    email: 'sophie.martin@entreprise.com',
    phone: '06 12 34 56 78',
    position: 'Développeuse Full Stack',
    department: 'IT',
    site: 'Paris',
    status: 'active',
    probation_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // J+5
    probation_evaluation_completed: false,
    hire_date: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-001',
        manager_id: 'manager-001',
        manager: {
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean.dupont@entreprise.com'
        },
        start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: []
  },
  {
    id: 'emp-002',
    first_name: 'Thomas',
    last_name: 'Bernard',
    email: 'thomas.bernard@entreprise.com',
    phone: '06 23 45 67 89',
    position: 'Chef de projet Marketing',
    department: 'Marketing',
    site: 'Lyon',
    status: 'active',
    probation_end_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // J+12
    probation_evaluation_completed: false,
    hire_date: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-002',
        manager_id: 'manager-002',
        manager: {
          first_name: 'Marie',
          last_name: 'Lambert',
          email: 'marie.lambert@entreprise.com'
        },
        start_date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: []
  },
  {
    id: 'emp-003',
    first_name: 'Léa',
    last_name: 'Petit',
    email: 'lea.petit@entreprise.com',
    phone: '06 34 56 78 90',
    position: 'Comptable',
    department: 'Finance',
    site: 'Paris',
    status: 'active',
    probation_end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // J+25
    probation_evaluation_completed: false,
    hire_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-003',
        manager_id: 'manager-003',
        manager: {
          first_name: 'Pierre',
          last_name: 'Moreau',
          email: 'pierre.moreau@entreprise.com'
        },
        start_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: []
  },
  {
    id: 'emp-004',
    first_name: 'Nicolas',
    last_name: 'Dubois',
    email: 'nicolas.dubois@entreprise.com',
    phone: '06 45 67 89 01',
    position: 'Commercial',
    department: 'Sales',
    site: 'Bordeaux',
    status: 'active',
    probation_end_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // J-3 (dépassé)
    probation_evaluation_completed: false,
    hire_date: new Date(Date.now() - 63 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-004',
        manager_id: 'emp-001',
        manager: {
          first_name: 'Sophie',
          last_name: 'Martin',
          email: 'sophie.martin@entreprise.com'
        },
        start_date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: []
  },
  {
    id: 'emp-005',
    first_name: 'Emma',
    last_name: 'Roux',
    email: 'emma.roux@entreprise.com',
    phone: '06 56 78 90 12',
    position: 'Responsable RH',
    department: 'HR',
    site: 'Lyon',
    status: 'active',
    probation_end_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // J-15 (déjà évaluée)
    probation_evaluation_completed: true,
    hire_date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-005',
        manager_id: 'manager-004',
        manager: {
          first_name: 'Claire',
          last_name: 'Fontaine',
          email: 'claire.fontaine@entreprise.com'
        },
        start_date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: [
      {
        id: 'eval-001',
        status: 'completed',
        evaluation_type: 'probation',
        due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'emp-006',
    first_name: 'Lucas',
    last_name: 'Moreau',
    email: 'lucas.moreau@entreprise.com',
    phone: '06 67 89 01 23',
    position: 'Technicien Support',
    department: 'IT',
    site: 'Paris',
    status: 'active',
    probation_end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // J+2 (TRÈS URGENT)
    probation_evaluation_completed: false,
    hire_date: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-006',
        manager_id: 'manager-001',
        manager: {
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean.dupont@entreprise.com'
        },
        start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: []
  },
  {
    id: 'emp-007',
    first_name: 'Camille',
    last_name: 'Leroy',
    email: 'camille.leroy@entreprise.com',
    phone: '06 78 90 12 34',
    position: 'Assistante Direction',
    department: 'Administration',
    site: 'Paris',
    status: 'active',
    probation_end_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // J+18
    probation_evaluation_completed: false,
    hire_date: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    contracts: [
      {
        id: 'ctr-007',
        manager_id: 'manager-005',
        manager: {
          first_name: 'Philippe',
          last_name: 'Dubois',
          email: 'philippe.dubois@entreprise.com'
        },
        start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        contract_type: 'CDI',
        status: 'active'
      }
    ],
    evaluations: []
  }
];

export default function EmployeeSelector({ 
  onClose, 
  onSelect, 
  filterType = 'all',
  title = "Sélectionner un employé",
  useMockData = true // Option pour utiliser les données mockées
}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSite, setSelectedSite] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [sites, setSites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [filterType]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let data = [];

      if (useMockData) {
        // Utiliser les données mockées
        data = MOCK_EMPLOYEES;
        
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        // Utiliser Supabase
        let query = supabase
          .from('employees')
          .select(`
            *,
            contracts:employee_contracts(
              *,
              manager:profiles(*)
            ),
            evaluations:evaluations(
              id,
              status,
              evaluation_type,
              due_date
            )
          `)
          .eq('status', 'active');

        // Filtres selon le type
        if (filterType === 'probation') {
          query = query
            .not('probation_end_date', 'is', null)
            .eq('probation_evaluation_completed', false);
        } else if (filterType === 'contract') {
          query = query
            .not('contract_end_date', 'is', null);
        }

        const { data: supabaseData, error } = await query;
        if (error) throw error;
        data = supabaseData || [];
      }

      // Filtrer selon le type si on utilise les données mockées
      let filteredData = data;
      if (filterType === 'probation' && useMockData) {
        filteredData = data.filter(emp => 
          emp.probation_end_date && !emp.probation_evaluation_completed
        );
      }

      setEmployees(filteredData);

      // Extraire les départements et sites uniques
      const uniqueDepts = [...new Set(filteredData?.map(emp => emp.department).filter(Boolean))];
      const uniqueSites = [...new Set(filteredData?.map(emp => emp.site).filter(Boolean))];
      setDepartments(uniqueDepts);
      setSites(uniqueSites);

    } catch (error) {
      console.error('Erreur chargement employés:', error);
      toast.error('Erreur lors du chargement des employés');
      
      // En cas d'erreur, utiliser les données mockées comme fallback
      if (!useMockData) {
        const fallbackData = MOCK_EMPLOYEES.filter(emp => 
          filterType === 'probation' ? emp.probation_end_date && !emp.probation_evaluation_completed : true
        );
        setEmployees(fallbackData);
        
        const uniqueDepts = [...new Set(fallbackData.map(emp => emp.department).filter(Boolean))];
        const uniqueSites = [...new Set(fallbackData.map(emp => emp.site).filter(Boolean))];
        setDepartments(uniqueDepts);
        setSites(uniqueSites);
        
        toast.info('Utilisation des données de démonstration');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les employés
  const filteredEmployees = employees
    .filter(emp => {
      // Recherche textuelle
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const email = emp.email?.toLowerCase() || '';
        const position = emp.position?.toLowerCase() || '';
        
        if (!fullName.includes(searchLower) && 
            !email.includes(searchLower) && 
            !position.includes(searchLower)) {
          return false;
        }
      }

      // Filtre département
      if (selectedDepartment !== 'all' && emp.department !== selectedDepartment) {
        return false;
      }

      // Filtre site
      if (selectedSite !== 'all' && emp.site !== selectedSite) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
          break;
        case 'department':
          comparison = (a.department || '').localeCompare(b.department || '');
          break;
        case 'site':
          comparison = (a.site || '').localeCompare(b.site || '');
          break;
        case 'probation':
          if (a.probation_end_date && b.probation_end_date) {
            comparison = new Date(a.probation_end_date) - new Date(b.probation_end_date);
          }
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getProbationStatus = (employee) => {
    if (!employee.probation_end_date) return null;
    
    const today = new Date();
    const endDate = new Date(employee.probation_end_date);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (employee.probation_evaluation_completed) {
      return {
        label: 'Évalué',
        color: 'text-emerald-700 bg-emerald-100',
        icon: CheckCircle
      };
    }
    
    if (daysRemaining < 0) {
      return {
        label: `Dépassé (J${daysRemaining})`,
        color: 'text-rose-700 bg-rose-100',
        icon: AlertCircle
      };
    }
    
    if (daysRemaining <= 7) {
      return {
        label: `URGENT J-${daysRemaining}`,
        color: 'text-red-700 bg-red-100',
        icon: Clock
      };
    }
    
    if (daysRemaining <= 15) {
      return {
        label: `J-${daysRemaining}`,
        color: 'text-amber-700 bg-amber-100',
        icon: Clock
      };
    }
    
    return {
      label: `J-${daysRemaining}`,
      color: 'text-green-700 bg-green-100',
      icon: Clock
    };
  };

  const getContractStatus = (employee) => {
    if (!employee.contracts || employee.contracts.length === 0) return null;
    
    const activeContract = employee.contracts.find(c => c.status === 'active');
    if (!activeContract || !activeContract.end_date) return null;
    
    const today = new Date();
    const endDate = new Date(activeContract.end_date);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 30) {
      return {
        label: `Contrat J-${daysRemaining}`,
        color: 'text-purple-700 bg-purple-100',
        icon: Calendar
      };
    }
    
    return null;
  };

  const handleSelectEmployee = (employee) => {
    // Vérifier si l'employé a déjà une évaluation en cours
    const hasPendingEvaluation = employee.evaluations?.some(
      e => e.status !== 'completed' && e.status !== 'cancelled'
    );

    if (hasPendingEvaluation) {
      toast.error('Cet employé a déjà une évaluation en cours');
      return;
    }

    if (employee.probation_evaluation_completed) {
      toast.error('Cet employé a déjà été évalué');
      return;
    }

    onSelect(employee);
  };

  const toggleEmployeeExpand = (employeeId, e) => {
    e.stopPropagation();
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl mx-4 my-8">
        <div className="overflow-hidden bg-white shadow-2xl rounded-2xl">
          {/* En-tête */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{title}</h2>
                  <p className="text-blue-100">
                    {filteredEmployees.length} employé(s) trouvé(s)
                    {useMockData && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        Mode démo
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 transition-colors rounded-lg hover:bg-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou poste..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-all ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filtres</span>
              </button>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Département
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les départements</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Site
                  </label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="w-full px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les sites</option>
                    {sites.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700">
                    Trier par
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Nom</option>
                      <option value="department">Département</option>
                      <option value="site">Site</option>
                      {filterType === 'probation' && (
                        <option value="probation">Fin période d'essai</option>
                      )}
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-white border rounded-lg border-slate-300 hover:bg-slate-50"
                    >
                      {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Liste des employés */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 font-medium text-slate-600">Chargement des employés...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-slate-100">
                  <Users className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Aucun employé trouvé
                </h3>
                <p className="text-sm text-slate-600">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredEmployees.map((employee) => {
                  const probationStatus = getProbationStatus(employee);
                  const contractStatus = getContractStatus(employee);
                  const StatusIcon = probationStatus?.icon || contractStatus?.icon || User;
                  const isExpanded = expandedEmployee === employee.id;

                  return (
                    <div
                      key={employee.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      {/* Ligne principale */}
                      <div className="flex items-center p-4 cursor-pointer" onClick={() => handleSelectEmployee(employee)}>
                        <div className="flex-shrink-0 mr-4">
                          <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {employee.first_name} {employee.last_name}
                            </h3>
                            {probationStatus && (
                              <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${probationStatus.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {probationStatus.label}
                              </span>
                            )}
                            {contractStatus && (
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${contractStatus.color}`}>
                                <contractStatus.icon className="w-3 h-3 mr-1" />
                                {contractStatus.label}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center text-sm text-slate-600">
                              <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                              {employee.position || 'Poste non défini'}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                              <Building className="w-4 h-4 mr-2 text-slate-400" />
                              {employee.department || 'Département non défini'}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                              {employee.site || 'Site non défini'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center ml-4 space-x-2">
                          <button
                            onClick={(e) => toggleEmployeeExpand(employee.id, e)}
                            className="p-2 text-slate-400 hover:text-slate-600"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Détails étendus */}
                      {isExpanded && (
                        <div className="px-4 pb-4 ml-16">
                          <div className="p-4 rounded-lg bg-slate-100">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-600">{employee.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-600">{employee.phone || 'Non renseigné'}</span>
                              </div>
                            </div>

                            {/* Informations contrat */}
                            {employee.contracts && employee.contracts.length > 0 && (
                              <div className="mb-4">
                                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                                  Contrat actif
                                </h4>
                                {employee.contracts
                                  .filter(c => c.status === 'active')
                                  .map(contract => (
                                    <div key={contract.id} className="p-3 bg-white rounded-lg">
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <p className="text-xs text-slate-500">Date de début</p>
                                          <p className="text-sm font-medium">
                                            {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-slate-500">Date de fin</p>
                                          <p className="text-sm font-medium">
                                            {contract.end_date ? new Date(contract.end_date).toLocaleDateString('fr-FR') : 'CDI'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-slate-500">Manager</p>
                                          <p className="text-sm font-medium">
                                            {contract.manager?.first_name} {contract.manager?.last_name}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

                            {/* Période d'essai */}
                            {employee.probation_end_date && (
                              <div className="mb-4">
                                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                                  Période d'essai
                                </h4>
                                <div className="p-3 bg-white rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-slate-500">Date de fin</p>
                                      <p className="text-sm font-medium">
                                        {new Date(employee.probation_end_date).toLocaleDateString('fr-FR')}
                                      </p>
                                    </div>
                                    {probationStatus && (
                                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${probationStatus.color}`}>
                                        {probationStatus.label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Bouton de sélection */}
                            <button
                              onClick={() => handleSelectEmployee(employee)}
                              className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            >
                              Sélectionner cet employé
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pied de page */}
          <div className="px-6 py-4 border-t bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {filteredEmployees.length} employé(s) sur {employees.length} total
                {useMockData && (
                  <span className="ml-2 text-xs text-slate-400">
                    (Mode démonstration)
                  </span>
                )}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}