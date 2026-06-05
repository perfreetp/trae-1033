export interface Train {
  id: string;
  trainNo: string;
  model: string;
  manufactureDate: string;
  totalMileage: number;
  lastMaintenanceDate: string;
  nextMaintenanceLevel: 'level1' | 'level2';
  nextMaintenanceDate: string;
  status: 'running' | 'maintenance' | 'idle' | 'overdue';
}

export interface PlanOperationLog {
  id: string;
  planId: string;
  action: 'created' | 'date_changed' | 'level_changed' | 'team_changed' | 'confirmed' | 'rejected';
  operator: string;
  operateTime: string;
  description: string;
  oldValue?: string;
  newValue?: string;
}

export interface MaintenancePlan {
  id: string;
  trainId: string;
  trainNo: string;
  level: 'level1' | 'level2';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: 'pending' | 'planned' | 'in_progress' | 'completed' | 'overdue';
  workPackageId: string;
  assignedTeam?: string;
  generatedFrom?: 'import' | 'manual';
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  standardTime: number;
  requiredSkill: string;
  safetyNotes?: string;
  qualityStandard?: string;
}

export interface WorkPackage {
  id: string;
  name: string;
  level: 'level1' | 'level2';
  description: string;
  estimatedHours: number;
  procedures: Procedure[];
}

export interface DispatchTask {
  id: string;
  planId: string;
  procedureId: string;
  procedureName: string;
  trainNo: string;
  teamId: string;
  teamName: string;
  assigneeId?: string;
  assigneeName?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rework';
  startTime?: string;
  endTime?: string;
  actualDuration?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  skills: string[];
  workload: number;
}

export interface FaultRecord {
  id: string;
  taskId: string;
  trainId: string;
  description: string;
  faultType: string;
  severity: 'minor' | 'major' | 'critical';
  handlingMeasures: string;
  replacedParts?: string[];
  handler: string;
  handleTime: string;
}

// 质量验收
export interface QualityInspection {
  id: string;
  taskId: string;
  planId: string;
  inspector: string;
  inspectionTime: string;
  result: 'pass' | 'fail' | 'rework';
  reinspectionOpinion?: string;
  releaseRemarks?: string;
  reworkRequired?: boolean;
  releaseConclusion?: 'released' | 'held';
}

export interface Material {
  id: string;
  name: string;
  partNo: string;
  category: string;
  stockQuantity: number;
  safeStock: number;
  unit: string;
}

export interface MaterialUsage {
  id: string;
  materialId: string;
  materialName: string;
  taskId: string;
  planId: string;
  trainNo: string;
  quantity: number;
  receiver: string;
  receiveTime: string;
}

export interface MaintenanceRule {
  level: 'level1' | 'level2';
  mileageThreshold: number;
  timeThreshold: number;
  description: string;
}

export interface MaintenanceHistory {
  id: string;
  trainId: string;
  date: string;
  level: 'level1' | 'level2';
  duration: number;
  faultsFound: number;
  result: 'pass' | 'rework';
}

export interface PartTracking {
  id: string;
  trainId: string;
  partName: string;
  partNo: string;
  installDate: string;
  lifespan: number;
  currentMileage: number;
  status: 'normal' | 'warning' | 'replace';
}
