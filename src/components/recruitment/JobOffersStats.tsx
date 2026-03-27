// components/recruitment/JobOffersStats.tsx
import { Briefcase, Globe, Edit2, CheckCircle } from 'lucide-react';

interface JobOffersStatsProps {
  total: number;
  published: number;
  draft: number;
  closed: number;
}

export const JobOffersStats = ({ total, published, draft, closed }: JobOffersStatsProps) => {
  const stats = [
    { label: 'Total', value: total, icon: Briefcase, color: 'emerald', bg: 'from-emerald-50 to-teal-50', border: 'emerald-200' },
    { label: 'Publiées', value: published, icon: Globe, color: 'blue', bg: 'from-blue-50 to-cyan-50', border: 'blue-200' },
    { label: 'Brouillons', value: draft, icon: Edit2, color: 'amber', bg: 'from-amber-50 to-orange-50', border: 'amber-200' },
    { label: 'Clôturées', value: closed, icon: CheckCircle, color: 'violet', bg: 'from-violet-50 to-purple-50', border: 'violet-200' }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`p-5 border bg-gradient-to-r ${stat.bg} border-${stat.border} rounded-xl`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium text-${stat.color}-700`}>{stat.label}</span>
            <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
          </div>
          <div className={`text-3xl font-bold text-${stat.color}-900`}>{stat.value}</div>
          <p className={`text-sm text-${stat.color}-700`}>
            {stat.label === 'Total' ? 'Offres créées' : 
             stat.label === 'Publiées' ? 'Actuellement en ligne' :
             stat.label === 'Brouillons' ? 'À publier' : 'Recrutement terminé'}
          </p>
        </div>
      ))}
    </div>
  );
};