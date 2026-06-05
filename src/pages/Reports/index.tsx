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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const {
    dispatchTasks,
    maintenancePlans,
    qualityInspections,
    faultRecords,
    trains,
    maintenanceHistories,
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

  const summaryStats = useMemo(() => {
    const totalPlans = maintenancePlans.length;
    const completedPlans = maintenancePlans.filter((p) => p.status === 'completed').length;
    const totalTasks = dispatchTasks.length;
    const completedTasks = dispatchTasks.filter((t) => t.status === 'completed').length;
    const reworkRate = qualityInspections.length > 0
      ? Math.round((qualityInspections.filter((i) => i.result === 'rework').length / qualityInspections.length) * 100)
      : 0;
    const avgEfficiency = teamEfficiencyData.length > 0
      ? Math.round(teamEfficiencyData.reduce((sum, t) => sum + t.efficiency, 0) / teamEfficiencyData.length)
      : 0;
    return {
      totalPlans,
      completedPlans,
      totalTasks,
      completedTasks,
      reworkRate,
      avgEfficiency,
    };
  }, [maintenancePlans, dispatchTasks, qualityInspections, teamEfficiencyData]);

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">统计报表</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
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
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">返工率</p>
              <p className="text-2xl font-bold text-neutral-900">{summaryStats.reworkRate}%</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-neutral-600">质量控制良好</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">平均效率</p>
              <p className="text-2xl font-bold text-neutral-900">{summaryStats.avgEfficiency}%</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-neutral-600">效率正常</span>
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
    </div>
  );
}
