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
import { ChevronLeft, ChevronRight, AlertTriangle, Wrench, Lightbulb } from 'lucide-react';
import { useAppStore } from '../../store';
import type { MaintenancePlan } from '../../types';
import { cn } from '../../lib/utils';

export default function CalendarPage() {
  const { maintenancePlans, trains } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    return maintenancePlans.filter((plan) => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">检修日历</h1>
        <div className="flex items-center gap-4">
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
    </div>
  );
}
