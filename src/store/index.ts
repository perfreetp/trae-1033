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
      selectedTrainId: stored.selectedTrainId || null,
      selectedDate: stored.selectedDate ? new Date(stored.selectedDate) : new Date(),
      currentUserRole: stored.currentUserRole || 'planner',
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
    selectedTrainId: null,
    selectedDate: new Date(),
    currentUserRole: 'planner' as const,
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
  selectedTrainId: string | null;
  selectedDate: Date;
  currentUserRole: 'planner' | 'worker' | 'inspector';
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
      selectedTrainId: toSave.selectedTrainId,
      selectedDate: toSave.selectedDate.toISOString(),
      currentUserRole: toSave.currentUserRole,
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
      const newTasks: DispatchTask[] = [];
      let planCounter = 0;

      importData.forEach((item) => {
        const train = trains.find((t) => t.id === item.trainId);
        if (!train) {
          failed.push({ trainNo: '未知', reason: '车组不存在' });
          return;
        }
        if (!item.mileage || item.mileage <= 0) {
          failed.push({ trainNo: train.trainNo, reason: '里程数据无效' });
          return;
        }
        if (!item.level1Threshold || item.level1Threshold <= 0) {
          failed.push({ trainNo: train.trainNo, reason: '一级修到期规则无效' });
          return;
        }
        if (!item.level2Threshold || item.level2Threshold <= 0) {
          failed.push({ trainNo: train.trainNo, reason: '二级修到期规则无效' });
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
          failed.push({ trainNo: train.trainNo, reason: '里程未达到任何检修阈值' });
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
          status: 'planned',
          workPackageId: workPackage?.id || 'wp1',
        });

        if (workPackage) {
          workPackage.procedures.forEach((proc, idx) => {
            newTasks.push({
              id: `task${Date.now()}_${planCounter}_${idx}`,
              planId,
              procedureId: proc.id,
              procedureName: proc.name,
              trainNo: train.trainNo,
              teamId: '',
              teamName: '待分配',
              status: 'pending',
            });
          });
        }

        success.push(`${train.trainNo} - ${level === 'level1' ? '一级修' : '二级修'}（建议${suggestedDate}）`);
      });

      if (newPlans.length > 0) {
        set((state) => ({
          maintenancePlans: [...state.maintenancePlans, ...newPlans],
          dispatchTasks: [...state.dispatchTasks, ...newTasks],
        }));
        persist({
          maintenancePlans: get().maintenancePlans,
          dispatchTasks: get().dispatchTasks,
        });
      }

      return { success, failed };
    },
  };
});
