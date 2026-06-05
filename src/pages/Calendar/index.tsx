import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Lightbulb,
  Upload,
  X,
  Edit,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Info,
  Filter,
  Clock,
  User,
  FileText,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type { MaintenancePlan, PlanOperationLog } from '../../types';
import { cn } from '../../lib/utils';

interface ImportItem {
  id: string;
  trainId: string;
  mileage: string;
  level1Threshold: string;
  level2Threshold: string;
}

export default function CalendarPage() {
  const {
    maintenancePlans,
    trains,
    teams,
    updateMaintenancePlan,
    batchGenerateSuggestions,
    confirmPlan,
    rejectPlan,
    getPlanLogs,
  } = useAppStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importItems, setImportItems] = useState<ImportItem[]>([
    { id: '1', trainId: '', mileage: '', level1Threshold: '4000', level2Threshold: '8000' },
  ]);
  const [importResult, setImportResult] = useState<{
    success: string[];
    failed: Array<{ trainNo: string; reason: string }>;
  } | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [editForm, setEditForm] = useState({
    plannedStartDate: '',
    plannedEndDate: '',
    level: 'level1' as 'level1' | 'level2',
    assignedTeam: '',
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showSuccess, setShowSuccess] = useState('');

  const filteredPlans = useMemo(() => {
    return maintenancePlans.filter((plan) => {
      if (filterTeam !== 'all' && plan.assignedTeam !== filterTeam) {
        return false;
      }
      if (filterLevel !== 'all' && plan.level !== filterLevel) {
        return false;
      }
      if (filterStatus !== 'all' && plan.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [maintenancePlans, filterTeam, filterLevel, filterStatus]);

  const planLogs = useMemo(() => {
    if (!selectedPlan) return [];
    return getPlanLogs(selectedPlan.id);
  }, [selectedPlan, getPlanLogs]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const prefixDays = Array.from({ length: startDayOfWeek }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startDayOfWeek - i));
    return d;
  });

  const getPlansForDate = (date: Date): MaintenancePlan[] => {
    return filteredPlans.filter((plan) => {
      const start = new Date(plan.plannedStartDate);
      const end = new Date(plan.plannedEndDate);
      const current = startOfDay(date);
      return current >= startOfDay(start) && current <= startOfDay(end);
    });
  };

  const isOverdue = (plan: MaintenancePlan): boolean => {
    if (plan.status === 'overdue') return true;
    const endDate = new Date(plan.plannedEndDate);
    return isBefore(endDate, startOfDay(new Date())) && plan.status !== 'completed';
  };

  const getPlanColor = (plan: MaintenancePlan): string => {
    if (plan.status === 'pending') return 'bg-amber-500';
    if (isOverdue(plan)) return 'bg-red-500';
    return plan.level === 'level1' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const smartSuggestions = useMemo(() => {
    const today = startOfDay(new Date());
    const suggestions: { type: string; message: string; trainNo: string }[] = [];

    maintenancePlans.forEach((plan) => {
      if (isOverdue(plan)) {
        suggestions.push({
          type: 'warning',
          message: '检修计划已超期，请尽快安排',
          trainNo: plan.trainNo,
        });
      }
    });

    trains.forEach((train) => {
      const nextDate = new Date(train.nextMaintenanceDate);
      const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays > 0) {
        suggestions.push({
          type: 'info',
          message: `距离下次${train.nextMaintenanceLevel === 'level1' ? '一级修' : '二级修'}还有${diffDays}天`,
          trainNo: train.trainNo,
        });
      }
    });

    return suggestions;
  }, [maintenancePlans, trains]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const addImportItem = () => {
    setImportItems([
      ...importItems,
      {
        id: Date.now().toString(),
        trainId: '',
        mileage: '',
        level1Threshold: '4000',
        level2Threshold: '8000',
      },
    ]);
  };

  const removeImportItem = (id: string) => {
    if (importItems.length > 1) {
      setImportItems(importItems.filter((item) => item.id !== id));
    }
  };

  const updateImportItem = (id: string, field: keyof ImportItem, value: string) => {
    setImportItems(
      importItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleImportSubmit = () => {
    const data = importItems
      .filter((item) => item.trainId && item.mileage)
      .map((item) => ({
        trainId: item.trainId,
        mileage: parseFloat(item.mileage),
        level1Threshold: parseFloat(item.level1Threshold),
        level2Threshold: parseFloat(item.level2Threshold),
      }));

    if (data.length === 0) {
      setImportResult({
        success: [],
        failed: [{ trainNo: '全部', reason: '请至少填写一条完整的车组数据' }],
      });
      return;
    }

    const result = batchGenerateSuggestions(data);
    setImportResult(result);

    if (result.success.length > 0) {
      setShowSuccess(`成功生成 ${result.success.length} 条检修计划！`);
      setTimeout(() => setShowSuccess(''), 5000);
    }
  };

  const resetImportForm = () => {
    setImportItems([
      { id: '1', trainId: '', mileage: '', level1Threshold: '4000', level2Threshold: '8000' },
    ]);
    setImportResult(null);
  };

  const handlePlanClick = (plan: MaintenancePlan) => {
    setSelectedPlan(plan);
    const teamName = teams.find((t) => t.id === plan.assignedTeam)?.name || '';
    setEditForm({
      plannedStartDate: plan.plannedStartDate,
      plannedEndDate: plan.plannedEndDate,
      level: plan.level,
      assignedTeam: plan.assignedTeam || '',
    });
    setShowDetailModal(true);
  };

  const handleEditSubmit = () => {
    if (!selectedPlan) return;
    const selectedTeam = teams.find((t) => t.id === editForm.assignedTeam);
    updateMaintenancePlan(selectedPlan.id, {
      plannedStartDate: editForm.plannedStartDate,
      plannedEndDate: editForm.plannedEndDate,
      level: editForm.level,
      assignedTeam: editForm.assignedTeam || undefined,
    });
    setSelectedPlan({
      ...selectedPlan,
      plannedStartDate: editForm.plannedStartDate,
      plannedEndDate: editForm.plannedEndDate,
      level: editForm.level,
      assignedTeam: editForm.assignedTeam || undefined,
    });
    setShowSuccess('检修计划更新成功！');
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const getTeamName = (teamId: string | undefined) => {
    if (!teamId) return '未分配';
    return teams.find((t) => t.id === teamId)?.name || '未分配';
  };

  const handleConfirmPlan = () => {
    if (!selectedPlan) return;
    confirmPlan(selectedPlan.id);
    setSelectedPlan({ ...selectedPlan, status: 'planned' });
    setShowSuccess('计划已确认，正式生效！');
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleRejectPlan = () => {
    if (!selectedPlan || !rejectReason.trim()) return;
    rejectPlan(selectedPlan.id, rejectReason);
    setShowRejectModal(false);
    setShowDetailModal(false);
    setSelectedPlan(null);
    setRejectReason('');
    setShowSuccess('计划已驳回');
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const getActionLabel = (action: PlanOperationLog['action']) => {
    const labels: Record<string, string> = {
      created: '创建',
      date_changed: '日期调整',
      level_changed: '等级变更',
      team_changed: '班组变更',
      confirmed: '确认排程',
      rejected: '驳回',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: PlanOperationLog['action']) => {
    const colors: Record<string, string> = {
      created: 'bg-blue-100 text-blue-700',
      date_changed: 'bg-purple-100 text-purple-700',
      level_changed: 'bg-indigo-100 text-indigo-700',
      team_changed: 'bg-green-100 text-green-700',
      confirmed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 space-y-6 relative">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          <span>{showSuccess}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">检修日历</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              导入数据
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-600">待确认</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">一级修</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">二级修</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">超期</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">筛选条件：</span>
          </div>
          <div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">全部等级</option>
              <option value="level1">一级修</option>
              <option value="level2">二级修</option>
            </select>
          </div>
          <div>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">全部班组</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">全部状态</option>
              <option value="pending">待确认</option>
              <option value="planned">已计划</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="overdue">已超期</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFilterLevel('all');
              setFilterTeam('all');
              setFilterStatus('all');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            清空筛选
          </button>
          <span className="text-sm text-gray-500 ml-auto">
            共 {filteredPlans.length} 条计划
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentMonth, 'yyyy年MM月')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {prefixDays.map((day, idx) => (
            <div
              key={`prefix-${idx}`}
              className="min-h-24 p-2 border-b border-r border-gray-100 bg-gray-50"
            >
              <span className="text-sm text-gray-400">{format(day, 'd')}</span>
            </div>
          ))}

          {daysInMonth.map((day) => {
            const plans = getPlansForDate(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-24 p-2 border-b border-r border-gray-100',
                  isToday(day) && 'bg-blue-50'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isToday(day)
                      ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white'
                      : 'text-gray-700'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {plans.slice(0, 2).map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanClick(plan)}
                      className={cn(
                        'text-xs px-2 py-1 rounded truncate text-white cursor-pointer hover:opacity-90',
                        getPlanColor(plan)
                      )}
                      title={`${plan.trainNo} - ${plan.level === 'level1' ? '一级修' : '二级修'}`}
                    >
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        {plan.trainNo}
                      </span>
                    </div>
                  ))}
                  {plans.length > 2 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{plans.length - 2} 更多
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {smartSuggestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">智能检修建议</h3>
          </div>
          <div className="space-y-3">
            {smartSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  suggestion.type === 'warning'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                )}
              >
                {suggestion.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Wrench className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-medium text-gray-800">
                    {suggestion.trainNo}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {suggestion.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                批量导入车组里程和到期规则
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">使用说明：</p>
                    <p>1. 为每个车组填写当前运行里程和一、二级修的到期里程阈值</p>
                    <p>2. 系统自动判断：达到二级修阈值生成二级修，仅达到一级修阈值生成一级修</p>
                    <p>3. 未达阈值或数据不完整的车组不会生成计划，但不影响其他车组</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {importItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">车组 {index + 1}</span>
                      {importItems.length > 1 && (
                        <button
                          onClick={() => removeImportItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          选择车组 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.trainId}
                          onChange={(e) =>
                            updateImportItem(item.id, 'trainId', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="">请选择车组</option>
                          {trains.map((train) => (
                            <option key={train.id} value={train.id}>
                              {train.trainNo} - {train.model}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          当前里程 (公里) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.mileage}
                          onChange={(e) =>
                            updateImportItem(item.id, 'mileage', e.target.value)
                          }
                          placeholder="如：4500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          一级修阈值 (公里)
                        </label>
                        <input
                          type="number"
                          value={item.level1Threshold}
                          onChange={(e) =>
                            updateImportItem(item.id, 'level1Threshold', e.target.value)
                          }
                          placeholder="默认：4000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          二级修阈值 (公里)
                        </label>
                        <input
                          type="number"
                          value={item.level2Threshold}
                          onChange={(e) =>
                            updateImportItem(item.id, 'level2Threshold', e.target.value)
                          }
                          placeholder="默认：8000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addImportItem}
                className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加车组
              </button>

              {importResult && (
                <div className="mt-4 space-y-3">
                  {importResult.success.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        成功生成 {importResult.success.length} 条计划：
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        {importResult.success.map((s, i) => (
                          <li key={i}>✓ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResult.failed.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {importResult.failed.length} 条数据未生成计划：
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.failed.map((f, i) => (
                          <li key={i}>✗ {f.trainNo}: {f.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={resetImportForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                重置表单
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                批量生成检修计划
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                检修计划详情
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPlan(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {selectedPlan.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                    <Clock className="w-5 h-5" />
                    待确认计划
                  </div>
                  <p className="text-sm text-amber-600 mb-3">
                    该计划由导入生成，尚未确认排程。请确认后正式生效，确认后将自动生成派工任务。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmPlan}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      确认排程
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      驳回
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">车组号：</span>
                    <span className="font-medium text-gray-800">
                      {selectedPlan.trainNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">计划状态：</span>
                    <span
                      className={cn(
                        'font-medium',
                        selectedPlan.status === 'completed'
                          ? 'text-green-600'
                          : selectedPlan.status === 'in_progress'
                          ? 'text-blue-600'
                          : selectedPlan.status === 'overdue'
                          ? 'text-red-600'
                          : selectedPlan.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-gray-800'
                      )}
                    >
                      {selectedPlan.status === 'planned'
                        ? '已计划'
                        : selectedPlan.status === 'in_progress'
                        ? '进行中'
                        : selectedPlan.status === 'completed'
                        ? '已完成'
                        : selectedPlan.status === 'pending'
                        ? '待确认'
                        : '已超期'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">当前检修等级：</span>
                    <span
                      className={cn(
                        'font-medium',
                        selectedPlan.level === 'level1'
                          ? 'text-blue-600'
                          : 'text-purple-600'
                      )}
                    >
                      {selectedPlan.level === 'level1' ? '一级修' : '二级修'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">当前负责班组：</span>
                    <span className="font-medium text-gray-800">
                      {getTeamName(selectedPlan.assignedTeam)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">开始日期：</span>
                    <span className="font-medium text-gray-800">
                      {selectedPlan.plannedStartDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">结束日期：</span>
                    <span className="font-medium text-gray-800">
                      {selectedPlan.plannedEndDate}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={editForm.plannedStartDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, plannedStartDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={editForm.plannedEndDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, plannedEndDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  检修等级
                </label>
                <select
                  value={editForm.level}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      level: e.target.value as 'level1' | 'level2',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="level1">一级修</option>
                  <option value="level2">二级修</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  负责班组
                </label>
                <select
                  value={editForm.assignedTeam}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assignedTeam: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">请选择班组</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  操作记录
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {planLogs.length > 0 ? (
                    planLogs.map((log) => (
                      <div key={log.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full h-fit', getActionColor(log.action))}>
                          {getActionLabel(log.action)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{log.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.operator}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(log.operateTime), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">暂无操作记录</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPlan(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                驳回计划
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                驳回原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请填写驳回原因..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRejectPlan}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
