import { create } from 'zustand';
import {
  Train,
  MaintenancePlan,
  WorkPackage,
  DispatchTask,
  TeamMember,
  FaultRecord,
  QualityInspection,
  Material,
  MaterialUsage,
  MaintenanceRule,
  MaintenanceHistory,
  PartTracking,
  PlanOperationLog,
} from '../types';
import {
  trains as initialTrains,
  maintenancePlans as initialPlans,
  workPackages as initialWorkPackages,
  dispatchTasks as initialTasks,
  teamMembers as initialMembers,
  faultRecords as initialFaults,
  qualityInspections as initialInspections,
  materials as initialMaterials,
  materialUsages as initialUsages,
  maintenanceRules as initialRules,
  maintenanceHistories as initialHistories,
  partTrackings as initialParts,
} from '../data/mockData';
import { teams } from '../data/mockData';

const STORAGE_KEY = 'train-maintenance-store';

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const getInitialState = () => {
  const stored = loadFromStorage<Partial<AppState> | null>(STORAGE_KEY, null);
  if (stored) {
    return {
      trains: stored.trains || initialTrains,
      maintenancePlans: stored.maintenancePlans || initialPlans,
      workPackages: stored.workPackages || initialWorkPackages,
      dispatchTasks: stored.dispatchTasks || initialTasks,
      teamMembers: stored.teamMembers || initialMembers,
      faultRecords: stored.faultRecords || initialFaults,
      qualityInspections: stored.qualityInspections || initialInspections,
      materials: stored.materials || initialMaterials,
      materialUsages: stored.materialUsages || initialUsages,
      maintenanceRules: stored.maintenanceRules || initialRules,
      maintenanceHistories: stored.maintenanceHistories || initialHistories,
      partTrackings: stored.partTrackings || initialParts,
      planOperationLogs: stored.planOperationLogs || [],
      selectedTrainId: stored.selectedTrainId || null,
      selectedDate: stored.selectedDate ? new Date(stored.selectedDate) : new Date(),
      currentUserRole: stored.currentUserRole || 'planner',
      currentOperator: stored.currentOperator || '计划员-系统',
    };
  }
  return {
    trains: initialTrains,
    maintenancePlans: initialPlans,
    workPackages: initialWorkPackages,
    dispatchTasks: initialTasks,
    teamMembers: initialMembers,
    faultRecords: initialFaults,
    qualityInspections: initialInspections,
    materials: initialMaterials,
    materialUsages: initialUsages,
    maintenanceRules: initialRules,
    maintenanceHistories: initialHistories,
    partTrackings: initialParts,
    planOperationLogs: [],
    selectedTrainId: null,
    selectedDate: new Date(),
    currentUserRole: 'planner' as const,
    currentOperator: '计划员-系统',
  };
};

interface AppState {
  trains: Train[];
  maintenancePlans: MaintenancePlan[];
  workPackages: WorkPackage[];
  dispatchTasks: DispatchTask[];
  teamMembers: TeamMember[];
  faultRecords: FaultRecord[];
  qualityInspections: QualityInspection[];
  materials: Material[];
  materialUsages: MaterialUsage[];
  maintenanceRules: MaintenanceRule[];
  maintenanceHistories: MaintenanceHistory[];
  partTrackings: PartTracking[];
  planOperationLogs: PlanOperationLog[];
  selectedTrainId: string | null;
  selectedDate: Date;
  currentUserRole: 'planner' | 'worker' | 'inspector';
  currentOperator: string;
  teams: { id: string; name: string }[];

  setSelectedTrainId: (id: string | null) => void;
  setSelectedDate: (date: Date) => void;
  setCurrentUserRole: (role: 'planner' | 'worker' | 'inspector') => void;

  updateTaskStatus: (taskId: string, status: DispatchTask['status']) => void;
  assignTask: (taskId: string, teamId: string, teamName: string, assigneeId: string, assigneeName: string) => void;
  addFaultRecord: (record: Omit<FaultRecord, 'id'>) => void;
  addQualityInspection: (inspection: Omit<QualityInspection, 'id'>) => void;
  addMaterialUsage: (usage: Omit<MaterialUsage, 'id'>) => boolean;
  updateMaintenancePlan: (planId: string, updates: Partial<MaintenancePlan>) => void;
  addMaintenancePlan: (plan: Omit<MaintenancePlan, 'id'>) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  updateTeamMemberWorkload: (memberId: string, workloadDelta: number) => void;
  generateMaintenanceSuggestion: (trainId: string, level: 'level1' | 'level2', date: string) => void;
  batchGenerateSuggestions: (importData: Array<{ trainId: string; mileage: number; level1Threshold: number; level2Threshold: number }>) => { success: string[]; failed: Array<{ trainNo: string; reason: string }> };
  confirmPlan: (planId: string) => void;
  rejectPlan: (planId: string, reason: string) => void;
  addPlanOperationLog: (planId: string, action: PlanOperationLog['action'], description: string, oldValue?: string, newValue?: string) => void;
  getPlanLogs: (planId: string) => PlanOperationLog[];
}

export const useAppStore = create<AppState>((set, get) => {
  const persist = (state: Partial<AppState>) => {
    const currentState = get();
    const toSave = {
      ...currentState,
      ...state,
    };
    saveToStorage(STORAGE_KEY, {
      trains: toSave.trains,
      maintenancePlans: toSave.maintenancePlans,
      dispatchTasks: toSave.dispatchTasks,
      teamMembers: toSave.teamMembers,
      faultRecords: toSave.faultRecords,
      qualityInspections: toSave.qualityInspections,
      materials: toSave.materials,
      materialUsages: toSave.materialUsages,
      maintenanceRules: toSave.maintenanceRules,
      maintenanceHistories: toSave.maintenanceHistories,
      partTrackings: toSave.partTrackings,
      planOperationLogs: toSave.planOperationLogs,
      selectedTrainId: toSave.selectedTrainId,
      selectedDate: toSave.selectedDate.toISOString(),
      currentUserRole: toSave.currentUserRole,
      currentOperator: toSave.currentOperator,
    });
  };

  return {
    ...getInitialState(),
    teams,

    setSelectedTrainId: (id) => {
      set({ selectedTrainId: id });
      persist({ selectedTrainId: id });
    },

    setSelectedDate: (date) => {
      set({ selectedDate: date });
      persist({ selectedDate: date });
    },

    setCurrentUserRole: (role) => {
      set({ currentUserRole: role });
      persist({ currentUserRole: role });
    },

    updateTaskStatus: (taskId, status) => {
      set((state) => ({
        dispatchTasks: state.dispatchTasks.map((t) =>
          t.id === taskId ? { ...t, status } : t
        ),
      }));
      persist({ dispatchTasks: get().dispatchTasks });
    },

    assignTask: (taskId, teamId, teamName, assigneeId, assigneeName) => {
      set((state) => ({
        dispatchTasks: state.dispatchTasks.map((t) =>
          t.id === taskId
            ? { ...t, teamId, teamName, assigneeId, assigneeName, status: 'assigned' as const }
            : t
        ),
        teamMembers: state.teamMembers.map((m) =>
          m.id === assigneeId
            ? { ...m, workload: Math.min(m.workload + 15, 150) }
            : m
        ),
      }));
      persist({ dispatchTasks: get().dispatchTasks, teamMembers: get().teamMembers });
    },

    addFaultRecord: (record) => {
      const newRecord = { ...record, id: `f${Date.now()}` };
      set((state) => ({
        faultRecords: [...state.faultRecords, newRecord],
      }));
      persist({ faultRecords: get().faultRecords });
    },

    addQualityInspection: (inspection) => {
      const newInspection = { ...inspection, id: `qi${Date.now()}` };
      set((state) => ({
        qualityInspections: [...state.qualityInspections, newInspection],
      }));
      persist({ qualityInspections: get().qualityInspections });
    },

    addMaterialUsage: (usage) => {
      const material = get().materials.find((m) => m.id === usage.materialId);
      if (!material || usage.quantity > material.stockQuantity) {
        return false;
      }
      const newUsage = { ...usage, id: `mu${Date.now()}` };
      set((state) => ({
        materialUsages: [...state.materialUsages, newUsage],
        materials: state.materials.map((m) =>
          m.id === usage.materialId
            ? { ...m, stockQuantity: m.stockQuantity - usage.quantity }
            : m
        ),
      }));
      persist({ materialUsages: get().materialUsages, materials: get().materials });
      return true;
    },

    updateMaintenancePlan: (planId, updates) => {
      const plan = get().maintenancePlans.find((p) => p.id === planId);
      if (!plan) return;

      let action: PlanOperationLog['action'] | null = null;
      let description = '';
      let oldValue = '';
      let newValue = '';

      if (updates.plannedStartDate !== undefined || updates.plannedEndDate !== undefined) {
        action = 'date_changed';
        oldValue = `${plan.plannedStartDate} ~ ${plan.plannedEndDate}`;
        newValue = `${updates.plannedStartDate || plan.plannedStartDate} ~ ${updates.plannedEndDate || plan.plannedEndDate}`;
        description = `调整检修日期：从 ${oldValue} 改为 ${newValue}`;
      } else if (updates.level !== undefined) {
        action = 'level_changed';
        oldValue = plan.level === 'level1' ? '一级修' : '二级修';
        newValue = updates.level === 'level1' ? '一级修' : '二级修';
        description = `变更检修等级：从 ${oldValue} 改为 ${newValue}`;
      } else if (updates.assignedTeam !== undefined) {
        action = 'team_changed';
        const oldTeam = plan.assignedTeam ? get().teams.find((t) => t.id === plan.assignedTeam)?.name : '未分配';
        const newTeam = updates.assignedTeam ? get().teams.find((t) => t.id === updates.assignedTeam)?.name : '未分配';
        oldValue = oldTeam || '未分配';
        newValue = newTeam || '未分配';
        description = `变更负责班组：从 ${oldValue} 改为 ${newValue}`;
      }

      if (action) {
        get().addPlanOperationLog(planId, action, description, oldValue, newValue);
      }

      set((state) => ({
        maintenancePlans: state.maintenancePlans.map((p) =>
          p.id === planId ? { ...p, ...updates } : p
        ),
      }));
      persist({ maintenancePlans: get().maintenancePlans });
    },

    addMaintenancePlan: (plan) => {
      const newPlan = { ...plan, id: `plan${Date.now()}` };
      set((state) => ({
        maintenancePlans: [...state.maintenancePlans, newPlan],
      }));
      persist({ maintenancePlans: get().maintenancePlans });
    },

    startTask: (taskId) => {
      set((state) => ({
        dispatchTasks: state.dispatchTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: 'in_progress' as const, startTime: new Date().toISOString() }
            : t
        ),
      }));
      persist({ dispatchTasks: get().dispatchTasks });
    },

    completeTask: (taskId) => {
      const task = get().dispatchTasks.find((t) => t.id === taskId);
      if (!task || !task.startTime) return;
      const duration = Math.round(
        (new Date().getTime() - new Date(task.startTime).getTime()) / 60000
      );
      set((state) => ({
        dispatchTasks: state.dispatchTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed' as const,
                endTime: new Date().toISOString(),
                actualDuration: duration,
              }
            : t
        ),
        teamMembers: state.teamMembers.map((m) =>
          m.id === task.assigneeId
            ? { ...m, workload: Math.max(m.workload - 15, 0) }
            : m
        ),
      }));
      persist({ dispatchTasks: get().dispatchTasks, teamMembers: get().teamMembers });
    },

    updateTeamMemberWorkload: (memberId, workloadDelta) => {
      set((state) => ({
        teamMembers: state.teamMembers.map((m) =>
          m.id === memberId
            ? { ...m, workload: Math.max(0, Math.min(m.workload + workloadDelta, 150)) }
            : m
        ),
      }));
      persist({ teamMembers: get().teamMembers });
    },

    generateMaintenanceSuggestion: (trainId, level, date) => {
      const train = get().trains.find((t) => t.id === trainId);
      if (!train) return;
      const workPackage = get().workPackages.find((wp) => wp.level === level);
      const newPlanId = `plan${Date.now()}`;
      const newPlan: MaintenancePlan = {
        id: newPlanId,
        trainId,
        trainNo: train.trainNo,
        level,
        plannedStartDate: date,
        plannedEndDate: date,
        status: 'planned',
        workPackageId: workPackage?.id || 'wp1',
      };

      const newTasks: DispatchTask[] = [];
      if (workPackage) {
        workPackage.procedures.forEach((proc, idx) => {
          newTasks.push({
            id: `task${Date.now()}_${idx}`,
            planId: newPlanId,
            procedureId: proc.id,
            procedureName: proc.name,
            trainNo: train.trainNo,
            teamId: '',
            teamName: '待分配',
            status: 'pending',
          });
        });
      }

      set((state) => ({
        maintenancePlans: [...state.maintenancePlans, newPlan],
        dispatchTasks: [...state.dispatchTasks, ...newTasks],
      }));
      persist({ maintenancePlans: get().maintenancePlans, dispatchTasks: get().dispatchTasks });
    },

    batchGenerateSuggestions: (importData) => {
      const { trains, workPackages } = get();
      const success: string[] = [];
      const failed: Array<{ trainNo: string; reason: string }> = [];
      const newPlans: MaintenancePlan[] = [];
      const newLogs: PlanOperationLog[] = [];
      let planCounter = 0;

      importData.forEach((item, index) => {
        const train = trains.find((t) => t.id === item.trainId);
        if (!item.trainId) {
          failed.push({ trainNo: `车组${index + 1}`, reason: '未选择车组' });
          return;
        }
        if (!train) {
          failed.push({ trainNo: `车组${index + 1}`, reason: '车组不存在' });
          return;
        }
        if (!item.mileage) {
          failed.push({ trainNo: train.trainNo, reason: '里程未填写' });
          return;
        }
        if (isNaN(item.mileage) || item.mileage <= 0) {
          failed.push({ trainNo: train.trainNo, reason: '里程数据无效，必须为大于0的数字' });
          return;
        }
        if (!item.level1Threshold) {
          failed.push({ trainNo: train.trainNo, reason: '一级修到期规则未填写' });
          return;
        }
        if (isNaN(item.level1Threshold) || item.level1Threshold <= 0) {
          failed.push({ trainNo: train.trainNo, reason: '一级修到期规则无效，必须为大于0的数字' });
          return;
        }
        if (!item.level2Threshold) {
          failed.push({ trainNo: train.trainNo, reason: '二级修到期规则未填写' });
          return;
        }
        if (isNaN(item.level2Threshold) || item.level2Threshold <= 0) {
          failed.push({ trainNo: train.trainNo, reason: '二级修到期规则无效，必须为大于0的数字' });
          return;
        }
        if (item.level2Threshold <= item.level1Threshold) {
          failed.push({ trainNo: train.trainNo, reason: '二级修阈值必须大于一级修阈值' });
          return;
        }

        let level: 'level1' | 'level2';
        let daysToAdd: number;

        if (item.mileage >= item.level2Threshold) {
          level = 'level2';
          const remaining = item.mileage - item.level2Threshold;
          daysToAdd = Math.min(Math.ceil(remaining / 1000), 3);
        } else if (item.mileage >= item.level1Threshold) {
          level = 'level1';
          const remaining = item.mileage - item.level1Threshold;
          daysToAdd = Math.min(Math.ceil(remaining / 500), 2);
        } else {
          failed.push({ trainNo: train.trainNo, reason: `里程 ${item.mileage} 未达到任何检修阈值（一级修${item.level1Threshold}，二级修${item.level2Threshold}）` });
          return;
        }

        const today = new Date();
        today.setDate(today.getDate() + daysToAdd);
        const suggestedDate = today.toISOString().split('T')[0];

        const workPackage = workPackages.find((wp) => wp.level === level);
        const planId = `plan${Date.now()}_${planCounter++}`;

        newPlans.push({
          id: planId,
          trainId: item.trainId,
          trainNo: train.trainNo,
          level,
          plannedStartDate: suggestedDate,
          plannedEndDate: suggestedDate,
          status: 'pending',
          workPackageId: workPackage?.id || 'wp1',
          generatedFrom: 'import',
        });

        newLogs.push({
          id: `log${Date.now()}_${planCounter}`,
          planId,
          action: 'created',
          operator: get().currentOperator,
          operateTime: new Date().toISOString(),
          description: `导入生成检修建议：${level === 'level1' ? '一级修' : '二级修'}，建议日期 ${suggestedDate}，当前里程 ${item.mileage} 公里`,
        });

        success.push(`${train.trainNo} - ${level === 'level1' ? '一级修' : '二级修'}（建议${suggestedDate}，待确认）`);
      });

      if (newPlans.length > 0) {
        set((state) => ({
          maintenancePlans: [...state.maintenancePlans, ...newPlans],
          planOperationLogs: [...state.planOperationLogs, ...newLogs],
        }));
        persist({
          maintenancePlans: get().maintenancePlans,
          planOperationLogs: get().planOperationLogs,
        });
      }

      return { success, failed };
    },

    confirmPlan: (planId) => {
      const plan = get().maintenancePlans.find((p) => p.id === planId);
      if (!plan || plan.status !== 'pending') return;

      const workPackage = get().workPackages.find((wp) => wp.id === plan.workPackageId);
      const newTasks: DispatchTask[] = [];

      if (workPackage) {
        workPackage.procedures.forEach((proc, idx) => {
          newTasks.push({
            id: `task${Date.now()}_${idx}`,
            planId,
            procedureId: proc.id,
            procedureName: proc.name,
            trainNo: plan.trainNo,
            teamId: '',
            teamName: '待分配',
            status: 'pending',
          });
        });
      }

      set((state) => ({
        maintenancePlans: state.maintenancePlans.map((p) =>
          p.id === planId ? { ...p, status: 'planned' as const } : p
        ),
        dispatchTasks: [...state.dispatchTasks, ...newTasks],
      }));

      get().addPlanOperationLog(planId, 'confirmed', '计划员确认排程，计划正式生效');

      persist({
        maintenancePlans: get().maintenancePlans,
        dispatchTasks: get().dispatchTasks,
        planOperationLogs: get().planOperationLogs,
      });
    },

    rejectPlan: (planId, reason) => {
      const plan = get().maintenancePlans.find((p) => p.id === planId);
      if (!plan || plan.status !== 'pending') return;

      set((state) => ({
        maintenancePlans: state.maintenancePlans.filter((p) => p.id !== planId),
      }));

      get().addPlanOperationLog(planId, 'rejected', `计划被驳回，原因：${reason}`);

      persist({
        maintenancePlans: get().maintenancePlans,
        planOperationLogs: get().planOperationLogs,
      });
    },

    addPlanOperationLog: (planId, action, description, oldValue, newValue) => {
      const newLog: PlanOperationLog = {
        id: `log${Date.now()}`,
        planId,
        action,
        operator: get().currentOperator,
        operateTime: new Date().toISOString(),
        description,
        oldValue,
        newValue,
      };
      set((state) => ({
        planOperationLogs: [...state.planOperationLogs, newLog],
      }));
    },

    getPlanLogs: (planId) => {
      return get()
        .planOperationLogs.filter((log) => log.planId === planId)
        .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
    },
  };
});
