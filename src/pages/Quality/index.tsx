import { useState } from 'react'
import {
  QrCode,
  Play,
  Square,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  XCircle,
  Send,
  ChevronRight,
  Clock,
  User,
  Train,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

type StepKey = 'scan' | 'fault' | 'reinspection' | 'conclusion'

const steps: { key: StepKey; title: string; description: string }[] = [
  { key: 'scan', title: '扫码确认', description: '开工/完工扫码确认' },
  { key: 'fault', title: '故障记录', description: '录入发现的故障信息' },
  { key: 'reinspection', title: '复检意见', description: '填写复检审核意见' },
  { key: 'conclusion', title: '放行结论', description: '判定最终放行结论' },
]

export default function Quality() {
  const dispatchTasks = useAppStore((state) => state.dispatchTasks)
  const faultRecords = useAppStore((state) => state.faultRecords)
  const qualityInspections = useAppStore((state) => state.qualityInspections)
  const teamMembers = useAppStore((state) => state.teamMembers)
  const addFaultRecord = useAppStore((state) => state.addFaultRecord)
  const addQualityInspection = useAppStore((state) => state.addQualityInspection)
  const startTask = useAppStore((state) => state.startTask)
  const completeTask = useAppStore((state) => state.completeTask)

  const [currentStep, setCurrentStep] = useState<StepKey>('scan')
  const [taskCode, setTaskCode] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [scanMessage, setScanMessage] = useState('')
  const [scanMessageType, setScanMessageType] = useState<'success' | 'error' | ''>('')

  const [faultDescription, setFaultDescription] = useState('')
  const [faultType, setFaultType] = useState('')
  const [faultSeverity, setFaultSeverity] = useState<'minor' | 'major' | 'critical'>('minor')
  const [handlingMeasures, setHandlingMeasures] = useState('')
  const [handlerName, setHandlerName] = useState('')

  const [reinspectionOpinion, setReinspectionOpinion] = useState('')
  const [inspectorName, setInspectorName] = useState('')

  const [releaseConclusion, setReleaseConclusion] = useState<'released' | 'held' | ''>('')
  const [finalRemarks, setFinalRemarks] = useState('')

  const selectedTask = dispatchTasks.find((t) => t.id === selectedTaskId)
  const taskFaults = faultRecords.filter((f) => f.taskId === selectedTaskId)
  const taskInspections = qualityInspections.filter((qi) => qi.taskId === selectedTaskId)

  const handleScan = () => {
    const task = dispatchTasks.find((t) => t.id === taskCode.trim())
    if (task) {
      setSelectedTaskId(task.id)
      setScanMessage(`找到任务：${task.procedureName} - ${task.trainNo}`)
      setScanMessageType('success')
    } else {
      setScanMessage('未找到对应的任务，请检查任务编号')
      setScanMessageType('error')
    }
  }

  const handleStartTask = () => {
    if (selectedTaskId && selectedTask?.status === 'assigned') {
      startTask(selectedTaskId)
      setScanMessage('任务已开工')
      setScanMessageType('success')
    }
  }

  const handleCompleteTask = () => {
    if (selectedTaskId && selectedTask?.status === 'in_progress') {
      completeTask(selectedTaskId)
      setScanMessage('任务已完工')
      setScanMessageType('success')
    }
  }

  const handleSubmitFault = () => {
    if (!selectedTaskId || !faultDescription || !faultType || !handlerName) {
      return
    }
    addFaultRecord({
      taskId: selectedTaskId,
      trainId: selectedTask?.planId || '',
      description: faultDescription,
      faultType,
      severity: faultSeverity,
      handlingMeasures,
      handler: handlerName,
      handleTime: new Date().toISOString(),
    })
    setFaultDescription('')
    setFaultType('')
    setFaultSeverity('minor')
    setHandlingMeasures('')
  }

  const handleSubmitInspection = () => {
    if (!selectedTaskId || !inspectorName || !reinspectionOpinion) {
      return
    }
    addQualityInspection({
      taskId: selectedTaskId,
      planId: selectedTask?.planId || '',
      inspector: inspectorName,
      inspectionTime: new Date().toISOString(),
      result: releaseConclusion === 'released' ? 'pass' : 'rework',
      reinspectionOpinion: reinspectionOpinion,
      releaseRemarks: finalRemarks || undefined,
      reworkRequired: releaseConclusion === 'held',
      releaseConclusion: releaseConclusion || undefined,
    })
    setReinspectionOpinion('')
    setInspectorName('')
    setFinalRemarks('')
  }

  const goToNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key)
    }
  }

  const goToPrevStep = () => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key)
    }
  }

  const getStepStatus = (stepKey: StepKey) => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep)
    const stepIndex = steps.findIndex((s) => s.key === stepKey)
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待分配',
      assigned: '已分配',
      in_progress: '进行中',
      completed: '已完成',
      rework: '返工',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      assigned: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      rework: 'bg-red-100 text-red-700',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-700'
  }

  const getSeverityText = (severity: string) => {
    const severityMap: Record<string, string> = {
      minor: '轻微',
      major: '严重',
      critical: '危急',
    }
    return severityMap[severity] || severity
  }

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, string> = {
      minor: 'bg-yellow-100 text-yellow-700',
      major: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    }
    return colorMap[severity] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">质量验收</h1>
        <p className="text-gray-500 mt-1">动车组检修质量验收流程管理</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    getStepStatus(step.key) === 'completed' && 'bg-green-500 text-white',
                    getStepStatus(step.key) === 'current' && 'bg-blue-500 text-white ring-4 ring-blue-100',
                    getStepStatus(step.key) === 'pending' && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {getStepStatus(step.key) === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      getStepStatus(step.key) === 'current' ? 'text-blue-600' : 'text-gray-600'
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-1 rounded-full',
                      getStepStatus(step.key) === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {currentStep === 'scan' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <QrCode className="w-6 h-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">扫码开工/完工</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输入任务编号
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={taskCode}
                      onChange={(e) => setTaskCode(e.target.value)}
                      placeholder="请输入或扫描任务编号（如：task1）"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleScan}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                    >
                      <QrCode className="w-4 h-4" />
                      扫码
                    </button>
                  </div>
                </div>

                {scanMessage && (
                  <div
                    className={cn(
                      'p-4 rounded-lg flex items-center gap-3',
                      scanMessageType === 'success' && 'bg-green-50 text-green-700 border border-green-200',
                      scanMessageType === 'error' && 'bg-red-50 text-red-700 border border-red-200'
                    )}
                  >
                    {scanMessageType === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{scanMessage}</span>
                  </div>
                )}

                {selectedTask && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleStartTask}
                      disabled={selectedTask.status !== 'assigned'}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all',
                        selectedTask.status === 'assigned'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      <Play className="w-4 h-4" />
                      开工
                    </button>
                    <button
                      onClick={handleCompleteTask}
                      disabled={selectedTask.status !== 'in_progress'}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all',
                        selectedTask.status === 'in_progress'
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      <Square className="w-4 h-4" />
                      完工
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-medium text-gray-800 mb-4">任务信息</h3>
                {selectedTask ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Train className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">车组号</div>
                        <div className="font-medium text-gray-800">{selectedTask.trainNo}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">工序名称</div>
                        <div className="font-medium text-gray-800">{selectedTask.procedureName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">作业人员</div>
                        <div className="font-medium text-gray-800">
                          {selectedTask.assigneeName || '未分配'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">状态</div>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium inline-block mt-1',
                            getStatusColor(selectedTask.status)
                          )}
                        >
                          {getStatusText(selectedTask.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>请扫码或输入任务编号</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'fault' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-800">故障记录录入</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    故障描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={faultDescription}
                    onChange={(e) => setFaultDescription(e.target.value)}
                    placeholder="请详细描述发现的故障"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      故障类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={faultType}
                      onChange={(e) => setFaultType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">请选择</option>
                      <option value="车体损伤">车体损伤</option>
                      <option value="电气故障">电气故障</option>
                      <option value="机械故障">机械故障</option>
                      <option value="制动故障">制动故障</option>
                      <option value="空调故障">空调故障</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      严重程度
                    </label>
                    <select
                      value={faultSeverity}
                      onChange={(e) => setFaultSeverity(e.target.value as 'minor' | 'major' | 'critical')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="minor">轻微</option>
                      <option value="major">严重</option>
                      <option value="critical">危急</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    处理措施
                  </label>
                  <textarea
                    value={handlingMeasures}
                    onChange={(e) => setHandlingMeasures(e.target.value)}
                    placeholder="请填写采取的处理措施"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    处理人员 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={handlerName}
                    onChange={(e) => setHandlerName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">请选择</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name} - {member.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSubmitFault}
                  disabled={!selectedTaskId || !faultDescription || !faultType || !handlerName}
                  className={cn(
                    'w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all',
                    selectedTaskId && faultDescription && faultType && handlerName
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                  提交故障记录
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-medium text-gray-800 mb-4">已记录故障</h3>
                {taskFaults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {taskFaults.map((fault) => (
                      <div key={fault.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              getSeverityColor(fault.severity)
                            )}
                          >
                            {getSeverityText(fault.severity)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(fault.handleTime).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 mb-1">
                          {fault.faultType}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{fault.description}</p>
                        {fault.handlingMeasures && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            处理措施：{fault.handlingMeasures}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          处理人：{fault.handler}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无故障记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'reinspection' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <FileCheck className="w-6 h-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">复检意见填写</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    复检人员 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="请输入复检人员姓名"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    复检意见 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reinspectionOpinion}
                    onChange={(e) => setReinspectionOpinion(e.target.value)}
                    placeholder="请填写详细的复检意见"
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-medium text-gray-800 mb-4">相关信息</h3>
                {selectedTask ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="text-xs text-gray-400 mb-1">任务概况</div>
                      <div className="text-sm font-medium text-gray-800">
                        {selectedTask.procedureName}
                      </div>
                      <div className="text-sm text-gray-500">{selectedTask.trainNo}</div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="text-xs text-gray-400 mb-2">故障数量</div>
                      <div className="text-2xl font-bold text-orange-500">
                        {taskFaults.length} 项
                      </div>
                    </div>

                    {taskFaults.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="text-xs text-gray-400 mb-2">故障列表</div>
                        <div className="space-y-2">
                          {taskFaults.map((fault, index) => (
                            <div key={fault.id} className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 truncate">{fault.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>请先选择任务</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'conclusion' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-800">放行结论判定</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    放行结论 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setReleaseConclusion('released')}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                        releaseConclusion === 'released'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <CheckCircle
                        className={cn(
                          'w-10 h-10',
                          releaseConclusion === 'released' ? 'text-green-500' : 'text-gray-400'
                        )}
                      />
                      <div
                        className={cn(
                          'font-medium',
                          releaseConclusion === 'released' ? 'text-green-700' : 'text-gray-600'
                        )}
                      >
                        合格放行
                      </div>
                      <div className="text-xs text-gray-400">检修质量合格，准予放行</div>
                    </button>
                    <button
                      onClick={() => setReleaseConclusion('held')}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                        releaseConclusion === 'held'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <XCircle
                        className={cn(
                          'w-10 h-10',
                          releaseConclusion === 'held' ? 'text-red-500' : 'text-gray-400'
                        )}
                      />
                      <div
                        className={cn(
                          'font-medium',
                          releaseConclusion === 'held' ? 'text-red-700' : 'text-gray-600'
                        )}
                      >
                        扣留返工
                      </div>
                      <div className="text-xs text-gray-400">存在质量问题，需返工处理</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注说明
                  </label>
                  <textarea
                    value={finalRemarks}
                    onChange={(e) => setFinalRemarks(e.target.value)}
                    placeholder="请填写备注说明（可选）"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitInspection}
                  disabled={!selectedTaskId || !inspectorName || !reinspectionOpinion || !releaseConclusion}
                  className={cn(
                    'w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all',
                    selectedTaskId && inspectorName && reinspectionOpinion && releaseConclusion
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  提交验收结论
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-medium text-gray-800 mb-4">验收记录</h3>
                {taskInspections.length > 0 ? (
                  <div className="space-y-3">
                    {taskInspections.map((inspection) => (
                      <div key={inspection.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              inspection.releaseConclusion === 'released'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {inspection.releaseConclusion === 'released' ? '放行' : '扣留'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(inspection.inspectionTime).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 mb-2">
                          质检员：{inspection.inspector}
                        </div>
                        {inspection.reinspectionOpinion && (
                          <div className="mb-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <div className="text-xs font-medium text-blue-700 mb-1">复检意见</div>
                            <p className="text-sm text-blue-800">{inspection.reinspectionOpinion}</p>
                          </div>
                        )}
                        {inspection.releaseRemarks && (
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-1">放行备注</div>
                            <p className="text-sm text-gray-700">{inspection.releaseRemarks}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无验收记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 'scan'}
            className={cn(
              'px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
              currentStep === 'scan'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            )}
          >
            上一步
          </button>
          <div className="text-sm text-gray-500">
            第 {steps.findIndex((s) => s.key === currentStep) + 1} 步，共 {steps.length} 步
          </div>
          <button
            onClick={goToNextStep}
            disabled={currentStep === 'conclusion'}
            className={cn(
              'px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
              currentStep === 'conclusion'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            )}
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
