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
  
  setSelectedTrainId: (id: string | null) => void;
  setSelectedDate: (date: Date) => void;
  setCurrentUserRole: (role: 'planner' | 'worker' | 'inspector') => void;
  
  updateTaskStatus: (taskId: string, status: DispatchTask['status']) => void;
  addFaultRecord: (record: Omit<FaultRecord, 'id'>) => void;
  addQualityInspection: (inspection: Omit<QualityInspection, 'id'>) => void;
  addMaterialUsage: (usage: Omit<MaterialUsage, 'id'>) => void;
  updateMaintenancePlan: (planId: string, updates: Partial<MaintenancePlan>) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
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
  currentUserRole: 'planner',

  setSelectedTrainId: (id) => set({ selectedTrainId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),

  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      dispatchTasks: state.dispatchTasks.map((t) =>
        t.id === taskId ? { ...t, status } : t
      ),
    })),

  addFaultRecord: (record) =>
    set((state) => ({
      faultRecords: [
        ...state.faultRecords,
        { ...record, id: `f${Date.now()}` },
      ],
    })),

  addQualityInspection: (inspection) =>
    set((state) => ({
      qualityInspections: [
        ...state.qualityInspections,
        { ...inspection, id: `qi${Date.now()}` },
      ],
    })),

  addMaterialUsage: (usage) =>
    set((state) => ({
      materialUsages: [
        ...state.materialUsages,
        { ...usage, id: `mu${Date.now()}` },
      ],
      materials: state.materials.map((m) =>
        m.id === usage.materialId
          ? { ...m, stockQuantity: m.stockQuantity - usage.quantity }
          : m
      ),
    })),

  updateMaintenancePlan: (planId, updates) =>
    set((state) => ({
      maintenancePlans: state.maintenancePlans.map((p) =>
        p.id === planId ? { ...p, ...updates } : p
      ),
    })),

  startTask: (taskId) =>
    set((state) => ({
      dispatchTasks: state.dispatchTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'in_progress', startTime: new Date().toISOString() }
          : t
      ),
    })),

  completeTask: (taskId) =>
    set((state) => {
      const task = state.dispatchTasks.find((t) => t.id === taskId);
      if (!task || !task.startTime) return state;
      const duration = Math.round(
        (new Date().getTime() - new Date(task.startTime).getTime()) / 60000
      );
      return {
        dispatchTasks: state.dispatchTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed',
                endTime: new Date().toISOString(),
                actualDuration: duration,
              }
            : t
        ),
      };
    }),
}));
