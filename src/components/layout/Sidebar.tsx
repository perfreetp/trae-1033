import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Train,
  ClipboardList,
  Users,
  CheckSquare,
  Package,
  BarChart3,
} from 'lucide-react';

const menuItems = [
  { path: '/calendar', label: '检修日历', icon: Calendar },
  { path: '/trains', label: '车辆档案', icon: Train },
  { path: '/work-packages', label: '作业包', icon: ClipboardList },
  { path: '/dispatch', label: '派工看板', icon: Users },
  { path: '/quality', label: '质量验收', icon: CheckSquare },
  { path: '/materials', label: '物料领用', icon: Package },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <div className="w-60 bg-white border-r border-neutral-200 h-screen flex flex-col sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Train className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-neutral-800">动车检修系统</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium text-sm">管</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">管理员</p>
            <p className="text-xs text-neutral-500 truncate">计划员</p>
          </div>
        </div>
      </div>
    </div>
  );
}
