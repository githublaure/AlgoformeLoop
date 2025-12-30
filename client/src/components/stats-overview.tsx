import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalMonthlyCost: string;
  activeSubscriptions: number;
  upcomingRenewals: number;
  trialsEnding: number;
  trialCount: number;
  suspectMonthly: string;
  wastedEstimate: string;
  budgetCap: number;
  budgetGap: string;
}

export function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pigeon-card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Coût mensuel</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(258, 71%, 65%)' }}>
              €{stats?.totalMonthlyCost || '0.00'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Budget cible: €{stats?.budgetCap.toFixed(0)} {Number(stats?.budgetGap || 0) > 0 ? `(-${stats?.budgetGap} à réduire)` : '(ok)'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(258, 71%, 85%)' }}>
            <i className="fas fa-euro-sign" style={{ color: 'hsl(258, 71%, 65%)' }}></i>
          </div>
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Abonnements actifs</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(162, 64%, 36%)' }}>
              {stats?.activeSubscriptions || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">{stats?.upcomingRenewals || 0} renouvellements à venir</p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(162, 64%, 85%)' }}>
            <i className="fas fa-check-circle" style={{ color: 'hsl(162, 64%, 36%)' }}></i>
          </div>
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Essais gratuits</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(42, 96%, 70%)' }}>
              {stats?.trialCount || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">{stats?.trialsEnding || 0} finissent sous 7 jours</p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(42, 96%, 85%)' }}>
            <i className="fas fa-exclamation-triangle" style={{ color: 'hsl(42, 96%, 70%)' }}></i>
          </div>
        </div>
      </div>

      <div className="pigeon-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Risque d'arnaque</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(10, 72%, 61%)' }}>
              €{stats?.suspectMonthly || '0.00'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Perte estimée (peu utilisé): €{stats?.wastedEstimate || '0.00'}</p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(10, 72%, 90%)' }}>
            <i className="fas fa-skull-crossbones" style={{ color: 'hsl(10, 72%, 61%)' }}></i>
          </div>
        </div>
      </div>
    </div>
  );
}
