import { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { DispatchTask, TeamMember, WorkPackage, Procedure } from '../../types';
import { User, Train, Clock, CheckCircle, AlertCircle, Play, Users, Filter, X, Send, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

const statusConfig = {
  pending: { label: '待分配', color: 'bg-gray-100 text-gray-700 border-gray-200', dotColor: 'bg-gray-400' },
  assigned: { label: '已分配', color: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  in_progress: { label: '进行中', color: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  completed: { label: '已完成', color: 'bg-green-50 text-green-700 border-green-200', dotColor: 'bg-green-500' },
  rework: { label: '返工', color: 'bg-red-50 text-red-700 border-red-200', dotColor: 'bg-red-500' },
};



const displayStatuses: Array<'pending' | 'assigned' | 'in_progress' | 'completed'> = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
];

function TaskCard({ task, onAssign }: { task: DispatchTask; onAssign?: (taskId: string) => void }) {
  const config = statusConfig[task.status];
  const startTask = useAppStore((state) => state.startTask);
  const completeTask = useAppStore((state) => state.completeTask);

  const handleStart = () => {
    if (task.status === 'assigned') {
      startTask(task.id);
    }
  };

  const handleComplete = () => {
    if (task.status === 'in_progress') {
      completeTask(task.id);
    }
  };

  const handleAssign = () => {
    if (task.status === 'pending' && onAssign) {
      onAssign(task.id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Train className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900 text-sm">{task.trainNo}</span>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
            config.color
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
          {config.label}
        </span>
      </div>

      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">{task.procedureName}</h4>
        <p className="text-xs text-gray-500">{task.teamName}</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
        <User className="w-3.5 h-3.5" />
        <span>{task.assigneeName || '未分配'}</span>
      </div>

      {task.status === 'pending' && (
        <button
          onClick={handleAssign}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          派工
        </button>
      )}

      {task.status === 'assigned' && (
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          开始作业
        </button>
      )}

      {task.status === 'in_progress' && (
        <button
          onClick={handleComplete}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          完成作业
        </button>
      )}

      {task.actualDuration && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <Clock className="w-3.5 h-3.5" />
          <span>用时 {task.actualDuration} 分钟</span>
        </div>
      )}
    </div>
  );
}

function WorkloadBar({ member }: { member: TeamMember }) {
  const workloadColor = member.workload >= 100
    ? 'bg-red-500'
    : member.workload >= 80
    ? 'bg-amber-500'
    : 'bg-green-500';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-500">{member.teamName}</p>
          </div>
        </div>
        <span
          className={cn(
            'text-sm font-bold',
            member.workload >= 100
              ? 'text-red-600'
              : member.workload >= 80
              ? 'text-amber-600'
              : 'text-green-600'
          )}
        >
          {member.workload}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', workloadColor)}
          style={{ width: `${Math.min(member.workload, 100)}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {member.skills.map((skill) => (
          <span
            key={skill}
            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DispatchBoard() {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [assignTeamId, setAssignTeamId] = useState<string>('');
  const [assignMemberId, setAssignMemberId] = useState<string>('');
  
  const dispatchTasks = useAppStore((state) => state.dispatchTasks);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const teams = useAppStore((state) => state.teams);
  const maintenancePlans = useAppStore((state) => state.maintenancePlans);
  const workPackages = useAppStore((state) => state.workPackages);
  const assignTask = useAppStore((state) => state.assignTask);

  const plansWithTasks = useMemo(() => {
    const planMap = new Map<string, { plan: typeof maintenancePlans[0]; taskCount: number }>();
    dispatchTasks.forEach((task) => {
      const plan = maintenancePlans.find((p) => p.id === task.planId);
      if (plan) {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, { plan, taskCount: 0 });
        }
        planMap.get(plan.id)!.taskCount++;
      }
    });
    return Array.from(planMap.values());
  }, [dispatchTasks, maintenancePlans]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null;
    return maintenancePlans.find((p) => p.id === selectedPlanId) || null;
  }, [selectedPlanId, maintenancePlans]);

  const selectedWorkPackage = useMemo(() => {
    if (!selectedPlan) return null;
    return workPackages.find((wp) => wp.id === selectedPlan.workPackageId) || null;
  }, [selectedPlan, workPackages]);

  const filteredTasks = useMemo(() => {
    let tasks = dispatchTasks;
    if (selectedTeam !== 'all') {
      tasks = tasks.filter((task) => task.teamId === selectedTeam);
    }
    if (selectedPlanId) {
      tasks = tasks.filter((task) => task.planId === selectedPlanId);
    }
    return tasks;
  }, [dispatchTasks, selectedTeam, selectedPlanId]);

  const filteredMembers = useMemo(() => {
    if (selectedTeam === 'all') return teamMembers;
    return teamMembers.filter((member) => member.teamId === selectedTeam);
  }, [teamMembers, selectedTeam]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, DispatchTask[]> = {
      pending: [],
      assigned: [],
      in_progress: [],
      completed: [],
    };
    filteredTasks.forEach((task) => {
      if (task.status in grouped) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [filteredTasks]);

  const overloadedMembers = useMemo(
    () => filteredMembers.filter((m) => m.workload >= 100),
    [filteredMembers]
  );

  const avgWorkload = useMemo(() => {
    if (filteredMembers.length === 0) return 0;
    const total = filteredMembers.reduce((sum, m) => sum + m.workload, 0);
    return Math.round(total / filteredMembers.length);
  }, [filteredMembers]);

  const teamsWithAll = useMemo(() => [
    { id: 'all', name: '全部班组' },
    ...teams
  ], [teams]);

  const assignableMembers = useMemo(() => {
    if (!assignTeamId) return [];
    return teamMembers.filter(m => m.teamId === assignTeamId);
  }, [teamMembers, assignTeamId]);

  const handleOpenAssignModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setAssignTeamId('');
    setAssignMemberId('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
    setAssignTeamId('');
    setAssignMemberId('');
  };

  const handleConfirmAssign = () => {
    if (!selectedTaskId || !assignTeamId || !assignMemberId) return;
    
    const team = teams.find(t => t.id === assignTeamId);
    const member = teamMembers.find(m => m.id === assignMemberId);
    
    if (team && member) {
      assignTask(selectedTaskId, team.id, team.name, member.id, member.name);
      handleCloseModal();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
        {selectedPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPlanId(null)}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-blue-600" />
                </button>
                <div>
                  <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    计划：{selectedPlan.trainNo} - {selectedPlan.level === 'level1' ? '一级修' : '二级修'}
                  </h3>
                  <p className="text-sm text-blue-600">
                    日期：{selectedPlan.plannedStartDate} ~ {selectedPlan.plannedEndDate}
                    {selectedWorkPackage && ` | 作业包：${selectedWorkPackage.name}（${selectedWorkPackage.estimatedHours}小时）`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanId(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                返回全部任务
              </button>
            </div>
            {selectedWorkPackage && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">作业包工序（{selectedWorkPackage.procedures.length}道）：</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedWorkPackage.procedures.map((proc) => (
                    <div key={proc.id} className="bg-white rounded px-3 py-2 text-sm">
                      <div className="font-medium text-gray-800">{proc.name}</div>
                      <div className="text-xs text-gray-500">标准工时：{proc.standardTime}分钟</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">派工看板</h1>
            <p className="text-sm text-gray-500 mt-1">实时监控任务进度与人员负荷</p>
          </div>
          <div className="flex items-center gap-4">
            {!selectedPlanId && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value=""
                  onChange={(e) => e.target.value && setSelectedPlanId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">按计划筛选...</option>
                  {plansWithTasks.map(({ plan, taskCount }) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.trainNo} - {plan.level === 'level1' ? '一级修' : '二级修'}（{taskCount}道工序）
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {teamsWithAll.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">任务总数</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTasks.length}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-600 mb-1">进行中</p>
            <p className="text-2xl font-bold text-amber-700">
              {tasksByStatus['in_progress']?.length || 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 mb-1">已完成</p>
            <p className="text-2xl font-bold text-green-700">
              {tasksByStatus['completed']?.length || 0}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">平均负荷</p>
            <p className="text-2xl font-bold text-blue-700">{avgWorkload}%</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-4 gap-4 h-full">
            {displayStatuses.map((status) => (
              <div key={status} className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      statusConfig[status].dotColor
                    )}
                  />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {statusConfig[status].label}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {tasksByStatus[status]?.length || 0}
                  </span>
                </div>
                <div className="flex-1 overflow-auto space-y-3 pr-1">
                  {tasksByStatus[status]?.map((task) => (
                    <TaskCard key={task.id} task={task} onAssign={handleOpenAssignModal} />
                  ))}
                  {(!tasksByStatus[status] || tasksByStatus[status].length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm">暂无任务</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">人员负荷</h3>
              <span className="text-xs text-gray-500">({filteredMembers.length}人)</span>
            </div>
            {overloadedMembers.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{overloadedMembers.length} 人负荷过载</span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {filteredMembers.map((member) => (
              <WorkloadBar key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">派工</h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  选择班组
                </label>
                <select
                  value={assignTeamId}
                  onChange={(e) => {
                    setAssignTeamId(e.target.value);
                    setAssignMemberId('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">请选择班组</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  选择人员
                </label>
                <select
                  value={assignMemberId}
                  onChange={(e) => setAssignMemberId(e.target.value)}
                  disabled={!assignTeamId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">请选择人员</option>
                  {assignableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.workload}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!assignTeamId || !assignMemberId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                确认派工
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
