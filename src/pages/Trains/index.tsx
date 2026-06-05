import { useState, useMemo } from 'react';
import { Search, Train as TrainIcon, Wrench, Package, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const statusMap = {
  running: { label: '运行中', className: 'bg-green-100 text-green-700' },
  maintenance: { label: '检修中', className: 'bg-blue-100 text-blue-700' },
  idle: { label: '空闲', className: 'bg-gray-100 text-gray-700' },
  overdue: { label: '逾期', className: 'bg-red-100 text-red-700' },
};

const levelMap = {
  level1: '一级修',
  level2: '二级修',
};

const partStatusMap = {
  normal: { label: '正常', className: 'bg-green-100 text-green-700' },
  warning: { label: '预警', className: 'bg-yellow-100 text-yellow-700' },
  replace: { label: '需更换', className: 'bg-red-100 text-red-700' },
};

type TabType = 'basic' | 'maintenance' | 'parts';

export default function Trains() {
  const { trains, maintenanceHistories, partTrackings, selectedTrainId, setSelectedTrainId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const filteredTrains = useMemo(() => {
    return trains.filter((train) => {
      const matchesSearch = train.trainNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        train.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || train.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trains, searchQuery, statusFilter]);

  const selectedTrain = useMemo(() => {
    return trains.find((t) => t.id === selectedTrainId) || null;
  }, [trains, selectedTrainId]);

  const trainMaintenanceHistories = useMemo(() => {
    if (!selectedTrainId) return [];
    return maintenanceHistories
      .filter((h) => h.trainId === selectedTrainId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenanceHistories, selectedTrainId]);

  const trainPartTrackings = useMemo(() => {
    if (!selectedTrainId) return [];
    return partTrackings.filter((p) => p.trainId === selectedTrainId);
  }, [partTrackings, selectedTrainId]);

  const tabs = [
    { key: 'basic' as TabType, label: '基本信息', icon: TrainIcon },
    { key: 'maintenance' as TabType, label: '检修历史', icon: Wrench },
    { key: 'parts' as TabType, label: '关键配件追踪', icon: Package },
  ];

  return (
    <div className="flex h-full gap-6">
      <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">车组列表</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索车组编号或车型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="running">运行中</option>
              <option value="maintenance">检修中</option>
              <option value="idle">空闲</option>
              <option value="overdue">逾期</option>
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredTrains.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <TrainIcon className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">暂无匹配的车组</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {filteredTrains.map((train) => (
                <li
                  key={train.id}
                  onClick={() => setSelectedTrainId(train.id)}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-neutral-50 transition-colors',
                    selectedTrainId === train.id && 'bg-blue-50 border-l-4 border-l-blue-500'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-neutral-900">{train.trainNo}</span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusMap[train.status].className)}>
                      {statusMap[train.status].label}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-500">
                    <p>车型：{train.model}</p>
                    <p>总里程：{(train.totalMileage / 10000).toFixed(1)} 万公里</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-neutral-200">
        {selectedTrain ? (
          <>
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{selectedTrain.trainNo}</h2>
                  <p className="text-neutral-500 mt-1">{selectedTrain.model}</p>
                </div>
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusMap[selectedTrain.status].className)}>
                  {statusMap[selectedTrain.status].label}
                </span>
              </div>
            </div>

            <div className="border-b border-neutral-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900">基本信息</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">车组编号</p>
                      <p className="text-base font-medium text-neutral-900">{selectedTrain.trainNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">车型</p>
                      <p className="text-base font-medium text-neutral-900">{selectedTrain.model}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">制造日期</p>
                      <p className="text-base font-medium text-neutral-900">
                        {format(new Date(selectedTrain.manufactureDate), 'yyyy-MM-dd')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">总里程</p>
                      <p className="text-base font-medium text-neutral-900">
                        {(selectedTrain.totalMileage / 10000).toFixed(2)} 万公里
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">上次检修日期</p>
                      <p className="text-base font-medium text-neutral-900">
                        {format(new Date(selectedTrain.lastMaintenanceDate), 'yyyy-MM-dd')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">下次检修等级</p>
                      <p className="text-base font-medium text-neutral-900">
                        {levelMap[selectedTrain.nextMaintenanceLevel]}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">下次检修日期</p>
                      <p className="text-base font-medium text-neutral-900">
                        {format(new Date(selectedTrain.nextMaintenanceDate), 'yyyy-MM-dd')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-500">当前状态</p>
                      <span className={cn('inline-block px-3 py-1 rounded-full text-sm font-medium', statusMap[selectedTrain.status].className)}>
                        {statusMap[selectedTrain.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900">检修历史</h3>
                  {trainMaintenanceHistories.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <Wrench className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">暂无检修历史记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainMaintenanceHistories.map((history) => (
                        <div
                          key={history.id}
                          className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                history.result === 'pass' ? 'bg-green-100' : 'bg-yellow-100'
                              )}>
                                {history.result === 'pass' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900">
                                  {levelMap[history.level]}
                                </p>
                                <p className="text-sm text-neutral-500">
                                  {format(new Date(history.date), 'yyyy-MM-dd')}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              history.result === 'pass'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            )}>
                              {history.result === 'pass' ? '合格' : '返工'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-neutral-500">检修时长：</span>
                              <span className="text-neutral-900">{Math.floor(history.duration / 60)}小时{history.duration % 60}分钟</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">发现故障：</span>
                              <span className="text-neutral-900">{history.faultsFound} 项</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900">关键配件追踪</h3>
                  {trainPartTrackings.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">暂无配件追踪记录</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">配件名称</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">配件编号</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">安装日期</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">设计寿命</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">已用里程</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {trainPartTrackings.map((part) => {
                            const usagePercent = Math.min((part.currentMileage / part.lifespan) * 100, 100);
                            return (
                              <tr key={part.id} className="hover:bg-neutral-50">
                                <td className="py-3 px-4">
                                  <span className="font-medium text-neutral-900">{part.partName}</span>
                                </td>
                                <td className="py-3 px-4 text-neutral-600">{part.partNo}</td>
                                <td className="py-3 px-4 text-neutral-600">
                                  {format(new Date(part.installDate), 'yyyy-MM-dd')}
                                </td>
                                <td className="py-3 px-4 text-neutral-600">
                                  {(part.lifespan / 10000).toFixed(1)} 万公里
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          'h-full rounded-full',
                                          part.status === 'normal' ? 'bg-green-500' :
                                          part.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                        )}
                                        style={{ width: `${usagePercent}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-neutral-600">
                                      {(part.currentMileage / 10000).toFixed(1)} 万
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={cn('px-2 py-1 rounded text-xs font-medium', partStatusMap[part.status].className)}>
                                    {partStatusMap[part.status].label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <TrainIcon className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <p className="text-lg font-medium">请选择一个车组</p>
              <p className="text-sm mt-1">从左侧列表中选择车组查看详细信息</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
