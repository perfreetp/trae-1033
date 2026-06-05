import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, Shield, Award, Wrench, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store'
import { WorkPackage, Procedure } from '@/types'
import { cn } from '@/lib/utils'

export default function WorkPackages() {
  const workPackages = useAppStore((state) => state.workPackages)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const level1Packages = workPackages.filter((wp) => wp.level === 'level1')
  const level2Packages = workPackages.filter((wp) => wp.level === 'level2')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">作业包管理</h1>
        <p className="text-gray-500 mt-1">查看动车组检修作业包及详细工序</p>
      </div>

      <div className="space-y-8">
        <Section title="一级修作业包" packages={level1Packages} expandedIds={expandedIds} onToggle={toggleExpand} />
        <Section title="二级修作业包" packages={level2Packages} expandedIds={expandedIds} onToggle={toggleExpand} />
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  packages: WorkPackage[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

function Section({ title, packages, expandedIds, onToggle }: SectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-blue-500 pl-3">{title}</h2>
      <div className="space-y-3">
        {packages.map((wp) => (
          <WorkPackageCard
            key={wp.id}
            workPackage={wp}
            isExpanded={expandedIds.has(wp.id)}
            onToggle={() => onToggle(wp.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface WorkPackageCardProps {
  workPackage: WorkPackage
  isExpanded: boolean
  onToggle: () => void
}

function WorkPackageCard({ workPackage, isExpanded, onToggle }: WorkPackageCardProps) {
  const levelText = workPackage.level === 'level1' ? '一级修' : '二级修'
  const levelColor = workPackage.level === 'level1' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{workPackage.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{workPackage.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', levelColor)}>{levelText}</span>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>预计 {workPackage.estimatedHours} 小时</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{workPackage.procedures.length} 道工序</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="space-y-3">
            {workPackage.procedures.map((procedure, index) => (
              <ProcedureCard key={procedure.id} procedure={procedure} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ProcedureCardProps {
  procedure: Procedure
  index: number
}

function ProcedureCard({ procedure, index }: ProcedureCardProps) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
            {index + 1}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{procedure.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{procedure.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
          <Clock className="w-4 h-4" />
          <span>{procedure.standardTime} 分钟</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoItem icon={<Wrench className="w-4 h-4" />} label="所需技能" value={procedure.requiredSkill} />
        {procedure.safetyNotes && (
          <InfoItem
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            label="安全注意事项"
            value={procedure.safetyNotes}
            valueClass="text-amber-700"
          />
        )}
        {procedure.qualityStandard && (
          <InfoItem
            icon={<Award className="w-4 h-4 text-green-500" />}
            label="质量标准"
            value={procedure.qualityStandard}
            valueClass="text-green-700"
          />
        )}
      </div>
    </div>
  )
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}

function InfoItem({ icon, label, value, valueClass }: InfoItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className={cn('text-sm text-gray-700', valueClass)}>{value}</div>
      </div>
    </div>
  )
}
