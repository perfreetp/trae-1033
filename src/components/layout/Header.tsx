import { Bell, Search, Settings } from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function Header() {
  const { selectedDate } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-800">
          {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索车组、任务..."
            className="input pl-9 w-64"
          />
        </div>

        <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors relative">
          <Bell className="w-5 h-5 text-neutral-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
          <Settings className="w-5 h-5 text-neutral-600" />
        </button>
      </div>
    </header>
  );
}
