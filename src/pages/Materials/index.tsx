import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  ClipboardList,
  Filter,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Material, MaterialUsage } from '@/types';

type TabType = 'stock' | 'receive' | 'records';

export default function Materials() {
  const { materials, materialUsages, addMaterialUsage, maintenancePlans, dispatchTasks, teamMembers } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [receiveQuantity, setReceiveQuantity] = useState<string>('1');
  const [receiver, setReceiver] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const categories = useMemo(() => {
    const cats = new Set(materials.map((m) => m.category));
    return Array.from(cats);
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.partNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, categoryFilter]);

  const filteredRecords = useMemo(() => {
    return materialUsages
      .filter((usage) => {
        const matchesSearch =
          usage.materialName.toLowerCase().includes(recordSearchQuery.toLowerCase()) ||
          usage.receiver.toLowerCase().includes(recordSearchQuery.toLowerCase()) ||
          usage.trainNo.toLowerCase().includes(recordSearchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.receiveTime).getTime() - new Date(a.receiveTime).getTime());
  }, [materialUsages, recordSearchQuery]);

  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterialId) || null;
  }, [materials, selectedMaterialId]);

  const availableTasks = useMemo(() => {
    return dispatchTasks.filter((t) => t.status === 'in_progress' || t.status === 'assigned');
  }, [dispatchTasks]);

  const isStockLow = (material: Material) => {
    return material.stockQuantity <= material.safeStock;
  };

  const getStockStatus = (material: Material) => {
    if (material.stockQuantity <= 0) {
      return { label: '缺货', className: 'bg-red-100 text-red-700' };
    }
    if (material.stockQuantity <= material.safeStock * 0.5) {
      return { label: '严重不足', className: 'bg-red-100 text-red-700' };
    }
    if (material.stockQuantity <= material.safeStock) {
      return { label: '库存预警', className: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: '充足', className: 'bg-green-100 text-green-700' };
  };

  const handleReceiveSubmit = () => {
    if (!selectedMaterialId || !receiveQuantity || !receiver || !taskId) return;

    const qty = parseInt(receiveQuantity);
    if (isNaN(qty) || qty <= 0) return;

    if (selectedMaterial && qty > selectedMaterial.stockQuantity) {
      setErrorMessage(`库存不足，当前库存${selectedMaterial.stockQuantity}${selectedMaterial.unit}，您要领用${qty}${selectedMaterial.unit}`);
      return;
    }

    const task = dispatchTasks.find((t) => t.id === taskId);
    if (!task) return;

    const plan = maintenancePlans.find((p) => p.id === task.planId);

    const success = addMaterialUsage({
      materialId: selectedMaterialId,
      materialName: selectedMaterial?.name || '',
      taskId: taskId,
      planId: plan?.id || '',
      trainNo: task.trainNo,
      quantity: qty,
      receiver: receiver,
      receiveTime: new Date().toISOString(),
    });

    if (!success) {
      if (selectedMaterial) {
        setErrorMessage(`库存不足，当前库存${selectedMaterial.stockQuantity}${selectedMaterial.unit}，您要领用${qty}${selectedMaterial.unit}`);
      } else {
        setErrorMessage('领用失败，请重试');
      }
      return;
    }

    setErrorMessage('');
    setShowReceiveForm(false);
    setSelectedMaterialId('');
    setReceiveQuantity('1');
    setReceiver('');
    setTaskId('');
  };

  const openReceiveForm = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setErrorMessage('');
    setShowReceiveForm(true);
  };

  const tabs = [
    { key: 'stock' as TabType, label: '库存列表', icon: Package },
    { key: 'receive' as TabType, label: '领用登记', icon: Plus },
    { key: 'records' as TabType, label: '领用记录', icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
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

        <div className="p-6">
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="搜索配件名称或编号..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部分类</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">配件名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">配件编号</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">分类</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">库存数量</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">安全库存</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredMaterials.map((material) => {
                      const status = getStockStatus(material);
                      const lowStock = isStockLow(material);
                      return (
                        <tr
                          key={material.id}
                          className={cn('hover:bg-neutral-50', lowStock && 'bg-red-50/50')}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {lowStock && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={cn('font-medium', lowStock ? 'text-red-700' : 'text-neutral-900')}>
                                {material.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-neutral-600">{material.partNo}</td>
                          <td className="py-3 px-4 text-neutral-600">{material.category}</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              'font-semibold',
                              lowStock ? 'text-red-600' : 'text-neutral-900'
                            )}>
                              {material.stockQuantity} {material.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {material.safeStock} {material.unit}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn('px-2 py-1 rounded text-xs font-medium', status.className)}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => openReceiveForm(material.id)}
                              disabled={material.stockQuantity <= 0}
                              className={cn(
                                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                                material.stockQuantity > 0
                                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              )}
                            >
                              领用
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredMaterials.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">暂无匹配的配件</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">领用登记</h3>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errorMessage}
                  </p>
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">选择配件</label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">请选择配件</option>
                    {materials
                      .filter((m) => m.stockQuantity > 0)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.partNo}) - 库存: {m.stockQuantity} {m.unit}
                        </option>
                      ))}
                  </select>
                  {selectedMaterial && isStockLow(selectedMaterial) && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      该配件库存不足，请注意
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">领用数量</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedMaterial?.stockQuantity || 1}
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(e.target.value)}
                    className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入领用数量"
                  />
                  {selectedMaterial && (
                    <p className="mt-1 text-sm text-neutral-500">
                      可用库存: {selectedMaterial.stockQuantity} {selectedMaterial.unit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">选择任务</label>
                  <select
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">请选择关联任务</option>
                    {availableTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.trainNo} - {t.procedureName} ({t.teamName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">领用人</label>
                  <select
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">请选择领用人</option>
                    {teamMembers.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} - {m.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleReceiveSubmit}
                    disabled={!selectedMaterialId || !receiveQuantity || !receiver || !taskId}
                    className={cn(
                      'w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2',
                      selectedMaterialId && receiveQuantity && receiver && taskId
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    确认领用
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索配件名称、领用人或车组编号..."
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">领用时间</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">配件名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">车组编号</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">领用数量</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">领用人</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-neutral-50">
                        <td className="py-3 px-4 text-neutral-600">
                          {format(new Date(record.receiveTime), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-neutral-900">{record.materialName}</span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600">{record.trainNo}</td>
                        <td className="py-3 px-4 text-neutral-900 font-medium">{record.quantity}</td>
                        <td className="py-3 px-4 text-neutral-600">{record.receiver}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">暂无领用记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showReceiveForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">快速领用</h3>
              <button
                onClick={() => setShowReceiveForm(false)}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errorMessage}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">领用数量</label>
                <input
                  type="number"
                  min="1"
                  max={selectedMaterial?.stockQuantity || 1}
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(e.target.value)}
                  className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入领用数量"
                />
                {selectedMaterial && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {selectedMaterial.name} - 可用库存: {selectedMaterial.stockQuantity} {selectedMaterial.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">选择任务</label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择关联任务</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trainNo} - {t.procedureName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">领用人</label>
                <select
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full py-2 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择领用人</option>
                  {teamMembers.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setShowReceiveForm(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReceiveSubmit}
                disabled={!receiveQuantity || !receiver || !taskId}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  receiveQuantity && receiver && taskId
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                )}
              >
                确认领用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
