import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrainFront,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const {
    dispatchTasks,
    maintenancePlans,
    qualityInspections,
    faultRecords,
    trains,
    maintenanceHistories,
    teams,
  } = useAppStore();

  const teamEfficiencyData = useMemo(() => {
    const teamMap = new Map();
    dispatchTasks.forEach((task) => {
      if (!task.teamName) return;
      if (!teamMap.has(task.teamName)) {
        teamMap.set(task.teamName, {
          name: task.teamName,
          totalTasks: 0,
          completedTasks: 0,
          totalDuration: 0,
          standardDuration: 0,
        });
      }
      const team = teamMap.get(task.teamName);
      team.totalTasks++;
      if (task.status === 'completed' && task.actualDuration) {
        team.completedTasks++;
        team.totalDuration += task.actualDuration;
        team.standardDuration += 60;
      }
    });
    return Array.from(teamMap.values()).map((team) => ({
      ...team,
      efficiency: team.completedTasks > 0
        ? Math.round((team.standardDuration / team.totalDuration) * 100)
        : 0,
      completionRate: team.totalTasks > 0
        ? Math.round((team.completedTasks / team.totalTasks) * 100)
        : 0,
    }));
  }, [dispatchTasks]);

  const reworkRateData = useMemo(() => {
    const total = qualityInspections.length;
    const reworkCount = qualityInspections.filter((i) => i.result === 'rework').length;
    const passCount = qualityInspections.filter((i) => i.result === 'pass').length;
    const failCount = qualityInspections.filter((i) => i.result === 'fail').length;
    return [
      { name: '合格', value: passCount },
      { name: '返工', value: reworkCount },
      { name: '不合格', value: failCount },
    ];
  }, [qualityInspections]);

  const faultTypeData = useMemo(() => {
    const typeMap = new Map();
    faultRecords.forEach((fault) => {
      if (!typeMap.has(fault.faultType)) {
        typeMap.set(fault.faultType, { name: fault.faultType, value: 0 });
      }
      typeMap.get(fault.faultType).value++;
    });
    return Array.from(typeMap.values());
  }, [faultRecords]);

  const trainAnalysisData = useMemo(() => {
    return trains.map((train) => {
      const histories = maintenanceHistories.filter((h) => h.trainId === train.id);
      const totalFaults = histories.reduce((sum, h) => sum + h.faultsFound, 0);
      const avgDuration = histories.length > 0
        ? Math.round(histories.reduce((sum, h) => sum + h.duration, 0) / histories.length)
        : 0;
      const reworkCount = histories.filter((h) => h.result === 'rework').length;
      return {
        name: train.trainNo,
        model: train.model,
        totalMileage: train.totalMileage,
        maintenanceCount: histories.length,
        totalFaults,
        avgDuration,
        reworkCount,
        status: train.status,
      };
    });
  }, [trains, maintenanceHistories]);

  const planFulfillmentData = useMemo(() => {
    const data = [];
    const levelLabels = { level1: '一级修', level2: '二级修' };

    teams.forEach((team) => {
      ['level1', 'level2'].forEach((level) => {
        const teamLevelPlans = maintenancePlans.filter(
          (p) => p.assignedTeam === team.id && p.level === level
        );
        const confirmedCount = teamLevelPlans.filter((p) => p.status !== 'pending').length;
        const completedCount = teamLevelPlans.filter((p) => p.status === 'completed').length;
        const overdueCount = teamLevelPlans.filter((p) => p.status === 'overdue').length;
        const totalCount = teamLevelPlans.length;

        if (totalCount > 0) {
          data.push({
            name: `${team.name}-${levelLabels[level as 'level1' | 'level2']}`,
            total: totalCount,
            confirmed: confirmedCount,
            completed: completedCount,
            overdue: overdueCount,
            fulfillmentRate: completedCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          });
        }
      });
    });

    return data;
  }, [maintenancePlans, teams]);

  const delayRiskData = useMemo(() => {
    const today = new Date();
    const atRisk = maintenancePlans.filter((p) => {
      if (p.status === 'completed') return false;
      const endDate = new Date(p.plannedEndDate);
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays >= 0;
    });

    const overdue = maintenancePlans.filter((p) => p.status === 'overdue');

    return {
      atRiskCount: atRisk.length,
      overdueCount: overdue.length,
      atRiskPlans: atRisk,
      overduePlans: overdue,
    };
  }, [maintenancePlans]);

  const summaryStats = useMemo(() => {
    const totalPlans = maintenancePlans.length;
    const pendingPlans = maintenancePlans.filter((p) => p.status === 'pending').length;
    const confirmedPlans = maintenancePlans.filter((p) => p.status !== 'pending').length;
    const completedPlans = maintenancePlans.filter((p) => p.status === 'completed').length;
    const totalTasks = dispatchTasks.length;
    const completedTasks = dispatchTasks.filter((t) => t.status === 'completed').length;
    const reworkRate = qualityInspections.length > 0
      ? Math.round((qualityInspections.filter((i) => i.result === 'rework').length / qualityInspections.length) * 100)
      : 0;
    const avgEfficiency = teamEfficiencyData.length > 0
      ? Math.round(teamEfficiencyData.reduce((sum, t) => sum + t.efficiency, 0) / teamEfficiencyData.length)
      : 0;
    const fulfillmentRate = confirmedPlans > 0
      ? Math.round((completedPlans / confirmedPlans) * 100)
      : 0;
    return {
      totalPlans,
      pendingPlans,
      confirmedPlans,
      completedPlans,
      totalTasks,
      completedTasks,
      reworkRate,
      avgEfficiency,
      fulfillmentRate,
    };
  }, [maintenancePlans, dispatchTasks, qualityInspections, teamEfficiencyData]);

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">统计报表</h1>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">检修计划总数</p>
              <p className="text-2xl font-bold text-neutral-900">{summaryStats.totalPlans}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-neutral-600">已完成 {summaryStats.completedPlans} 项</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">待确认计划</p>
              <p className="text-2xl font-bold text-neutral-900">{summaryStats.pendingPlans}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-neutral-600">需计划员确认</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">计划兑现率</p>
              <p className="text-2xl font-bold text-neutral-900">{summaryStats.fulfillmentRate}%</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-neutral-600">已确认 {summaryStats.confirmedPlans} 项</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">作业任务总数</p>
              <p className="text-2xl font-bold text-neutral-900">{summaryStats.totalTasks}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-neutral-600">已完成 {summaryStats.completedTasks} 项</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">延期风险</p>
              <p className="text-2xl font-bold text-neutral-900">{delayRiskData.overdueCount + delayRiskData.atRiskCount}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-neutral-600">临期 {delayRiskData.atRiskCount} · 已超期 {delayRiskData.overdueCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-neutral-900">效率分析</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamEfficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="efficiency" name="效率(%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completionRate" name="完成率(%)" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {teamEfficiencyData.map((team, index) => (
            <div key={index} className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm font-medium text-neutral-900">{team.name}</p>
              <p className="text-xs text-neutral-500 mt-1">
                效率 {team.efficiency}% · 完成率 {team.completionRate}%
              </p>
              <p className="text-xs text-neutral-500">
                完成 {team.completedTasks}/{team.totalTasks} 项
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-neutral-900">质量分析 - 返工率</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reworkRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {reworkRateData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-neutral-900">故障类型分布</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={faultTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {faultTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrainFront className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-neutral-900">车组档案分析</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">车组编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">车型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">总里程</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">检修次数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">平均时长</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">故障总数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">返工次数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {trainAnalysisData.map((train) => (
                <tr key={train.name} className="hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-neutral-900">{train.name}</span>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{train.model}</td>
                  <td className="py-3 px-4 text-neutral-600">
                    {(train.totalMileage / 10000).toFixed(1)} 万公里
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{train.maintenanceCount} 次</td>
                  <td className="py-3 px-4 text-neutral-600">
                    {Math.floor(train.avgDuration / 60)}小时{train.avgDuration % 60}分钟
                  </td>
                  <td className="py-3 px-4">
                    <span className={train.totalFaults > 3 ? 'text-red-600' : 'text-neutral-600'}>
                      {train.totalFaults} 项
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={train.reworkCount > 0 ? 'text-yellow-600' : 'text-green-600'}>
                      {train.reworkCount} 次
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-neutral-900">计划兑现率统计（按班组+等级）</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">班组-等级</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">计划总数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">已确认</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">已完成</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">已超期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">兑现率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {planFulfillmentData.length > 0 ? (
                  planFulfillmentData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-neutral-900">{item.name}</span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{item.total}</td>
                      <td className="py-3 px-4 text-blue-600">{item.confirmed}</td>
                      <td className="py-3 px-4 text-green-600">{item.completed}</td>
                      <td className="py-3 px-4">
                        <span className={item.overdue > 0 ? 'text-red-600' : 'text-neutral-600'}>
                          {item.overdue}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'font-semibold',
                          item.fulfillmentRate >= 90 ? 'text-green-600' :
                          item.fulfillmentRate >= 70 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {item.fulfillmentRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      暂无统计数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-neutral-900">延期风险预警</h2>
          </div>
          <div className="space-y-3">
            {delayRiskData.overduePlans.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">已超期计划</h4>
                <div className="space-y-2">
                  {delayRiskData.overduePlans.map((plan) => (
                    <div key={plan.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-800">
                          {plan.trainNo} - {plan.level === 'level1' ? '一级修' : '二级修'}
                        </span>
                        <span className="text-xs text-red-600">已超期</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        计划结束：{plan.plannedEndDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {delayRiskData.atRiskPlans.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-amber-600 mb-2">临期计划（2天内到期）</h4>
                <div className="space-y-2">
                  {delayRiskData.atRiskPlans.map((plan) => (
                    <div key={plan.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-800">
                          {plan.trainNo} - {plan.level === 'level1' ? '一级修' : '二级修'}
                        </span>
                        <span className="text-xs text-amber-600">即将到期</span>
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        计划结束：{plan.plannedEndDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {delayRiskData.atRiskPlans.length === 0 && delayRiskData.overduePlans.length === 0 && (
              <div className="py-8 text-center text-neutral-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>暂无延期风险计划</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
