import { useState, useMemo } from 'react';
import { FoodItem, OWNERS, OwnerName } from '../types';
import { Search, Calendar, User, Trash2, CheckSquare, Square, AlertCircle, ArrowUpDown, RefreshCw, Sparkles } from 'lucide-react';

interface FoodTableProps {
  items: FoodItem[];
  onToggleEaten: (id: string) => void;
  onDeleteItem: (id: string) => void;
  getDateDiff: (expiry: string) => number;
  todayStr: string;
}

type SortKey = 'expiry' | 'owner' | 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function FoodTable({ items, onToggleEaten, onDeleteItem, getDateDiff, todayStr }: FoodTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('expiry');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Interactive sorting toggle
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter and process list items
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Text Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.owner.toLowerCase().includes(q)
      );
    }

    // 2. Owner selection Filter
    if (selectedOwnerFilter !== 'All') {
      result = result.filter(item => item.owner === selectedOwnerFilter);
    }

    // 4. Sort calculations
    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'expiry') {
        comparison = a.expiryDate.localeCompare(b.expiryDate);
      } else if (sortKey === 'owner') {
        comparison = a.owner.localeCompare(b.owner, 'zh-Hant');
      } else if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name, 'zh-Hant');
      } else {
        comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, searchTerm, selectedOwnerFilter, sortKey, sortOrder, getDateDiff]);

  // Expiration color indicator logic aligned to Technical Grid Theme Spec
  const getExpiryBgClass = (diffDays: number) => {
    if (diffDays > 14) {
      // 黃綠色 (Yellow-Green #bef264)
      return {
        badge: 'bg-[#bef264] text-slate-900 border border-lime-400 font-bold shadow-sm',
        row: '',
        text: 'text-emerald-600 font-medium'
      };
    } else if (diffDays >= 7 && diffDays <= 14) {
      // 黃色 (Yellow #facc15)
      return {
        badge: 'bg-[#facc15] text-slate-900 border border-amber-400 font-bold shadow-sm',
        row: '',
        text: 'text-amber-700 font-medium'
      };
    } else {
      // < 7天 / 已過期 (Red #ef4444)
      return {
        badge: 'bg-[#ef4444] text-white border border-rose-600 font-bold shadow-sm',
        row: 'bg-rose-50/30',
        text: 'text-red-600 font-bold'
      };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
      {/* Filtering Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Title Indicator */}
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold font-display">
              List
            </span>
            全部保管食物 ({items.length})
          </h3>
        </div>

        {/* Search and Owner selection controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Quick search input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋食物名稱或成員..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800"
            />
          </div>

          {/* Owner filter dropdown */}
          <div className="relative">
            <select
              value={selectedOwnerFilter}
              onChange={(e) => setSelectedOwnerFilter(e.target.value)}
              className="w-full sm:w-40 pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All">👱 所有成員食物</option>
              {OWNERS.map(owner => (
                <option key={owner} value={owner}>
                  👤 {owner} 的保管區
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Sorting Controls for Mobile viewports */}
      <div className="flex sm:hidden flex-wrap items-center gap-2 pb-2 text-[11px] text-slate-500 border-b border-dashed border-slate-100">
        <span className="font-bold">排序方式：</span>
        <button
          onClick={() => handleSort('expiry')}
          className={`px-2 py-0.5 rounded-md border ${sortKey === 'expiry' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}
        >
          過期日 {sortKey === 'expiry' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('owner')}
          className={`px-2 py-0.5 rounded-md border ${sortKey === 'owner' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}
        >
          成員 {sortKey === 'owner' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('name')}
          className={`px-2 py-0.5 rounded-md border ${sortKey === 'name' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}
        >
          品名 {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Mobile view as concise list cards (Visible on mobile only) */}
      <div className="sm:hidden space-y-3">
        {processedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-3xl">📥</span>
              <p className="text-sm font-semibold text-slate-500">查無任何冰箱滿足條件食物</p>
              <p className="text-xs text-slate-400">請嘗試調整上方的篩選設定或在左側註冊新項目</p>
            </div>
          </div>
        ) : (
          processedItems.map((item) => {
            const diffDays = getDateDiff(item.expiryDate);
            const isOverdue = diffDays < 0;
            const styleMeta = getExpiryBgClass(diffDays);
            const shouldGrayOut = item.isEaten;
            const showUrgentOverdueAlert = isOverdue && !item.isEaten;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all relative flex gap-3 ${
                  shouldGrayOut 
                    ? 'opacity-40 grayscale filter line-through bg-slate-50/70 text-slate-400 border-slate-105' 
                    : isOverdue 
                    ? 'bg-rose-50/10 border-rose-100'
                    : 'bg-white border-slate-100 shadow-sm'
                } ${showUrgentOverdueAlert ? 'border-l-4 border-l-rose-500' : ''}`}
              >
                {/* Checkbox leading */}
                <div className="flex items-start justify-center pt-0.5 select-none">
                  <button
                    onClick={() => onToggleEaten(item.id)}
                    className={`p-1.5 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                      item.isEaten ? 'text-emerald-500' : 'text-slate-400 shadow-none'
                    }`}
                  >
                    {item.isEaten ? (
                      <CheckSquare className="w-5 h-5 fill-emerald-50 bg-white rounded" />
                    ) : (
                      <Square className="w-5 h-5 bg-white rounded" />
                    )}
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Name, Owner */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 tracking-tight text-sm break-all leading-snug">
                      {item.name}
                    </span>
                    <span className="shrink-0 px-2 py-0.5 text-[10px] text-slate-600 bg-slate-100 rounded-md border border-slate-200/60 font-semibold flex items-center gap-0.5">
                      👤 {item.owner}
                    </span>
                  </div>

                  {/* Urgent Alert - "過期提醒!!" with TWO red exclamation marks */}
                  {showUrgentOverdueAlert && (
                    <div className="flex items-center gap-0.5 text-rose-600 font-bold text-xs animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 fill-rose-50 stroke-[2.5]" />
                      <span>過期提醒</span>
                      <span className="text-red-600 font-extrabold text-sm leading-none">!!</span>
                    </div>
                  )}

                  {/* Expiry Date badge & Remaining calculation status */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold tracking-tight inline-flex items-center gap-1 ${styleMeta.badge}`}>
                      <Calendar className="w-3 h-3" />
                      {item.expiryDate}
                    </span>
                    
                    <span className="font-mono text-xs">
                      {item.isEaten ? (
                        <span className="text-slate-400 font-medium">不需追蹤</span>
                      ) : isOverdue ? (
                        <span className="text-rose-600 font-extrabold inline-flex items-center gap-0.5">
                          已過期 {Math.abs(diffDays)} 天
                          <span className="text-red-700 text-xs animate-bounce font-black">!!</span>
                        </span>
                      ) : diffDays === 0 ? (
                        <span className="text-orange-500 font-extrabold animate-pulse">
                          今天過期! 🙏
                        </span>
                      ) : (
                        <span className={`${styleMeta.text} font-bold`}>
                          剩餘 {diffDays} 天
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Deletion action */}
                <div className="flex items-start select-none">
                  {confirmDeleteId === item.id ? (
                    <div className="flex flex-col items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-100">
                      <button
                        onClick={() => {
                          onDeleteItem(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        確定
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer whitespace-nowrap"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all focus:outline-none cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main List Table (Visible on tablet/desktop displays) */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
              {/* Checkbox column */}
              <th className="py-3 px-4 w-12 text-center select-none border-r border-slate-100/50">食用</th>
              {/* Food Name column */}
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors select-none" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  名稱
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              {/* Expiry Date column */}
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors select-none w-44" onClick={() => handleSort('expiry')}>
                <div className="flex items-center gap-1">
                  過期日期
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              {/* Remaining calculation state tag */}
              <th className="py-3 px-4 w-40">剩餘天數</th>
              {/* Owner Name column */}
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/50 transition-colors select-none w-32" onClick={() => handleSort('owner')}>
                <div className="flex items-center gap-1">
                  擁有者
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              {/* Actions column */}
              <th className="py-3 px-4 w-16 text-center">刪除</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">📥</span>
                    <p className="text-sm font-semibold text-slate-500">查無任何冰箱符合條件食物</p>
                    <p className="text-xs text-slate-400">請嘗試調整上方的篩選設定或在左側註冊新罐頭/便當</p>
                  </div>
                </td>
              </tr>
            ) : (
              processedItems.map((item) => {
                const diffDays = getDateDiff(item.expiryDate);
                const isOverdue = diffDays < 0;
                
                // Specific coloring check rules
                const styleMeta = getExpiryBgClass(diffDays);

                // Specific rule: "當食物過期且食用完畢的打勾後打勾，食物列會反灰"
                // Let's implement full gray out if (isOverdue && item.isEaten), OR general dim if isEaten.
                // General gray out with grayscale and strikethrough for a great physical finish.
                const shouldGrayOut = item.isEaten;

                // Rule: "當食物過期且食用完畢的打勾未打勾時，需要出現過期提醒且需要兩個紅色的驚嘆號"
                const showUrgentOverdueAlert = isOverdue && !item.isEaten;

                return (
                  <tr
                    key={item.id}
                    className={`group transition-all text-sm ${
                      shouldGrayOut 
                        ? 'opacity-40 grayscale filter line-through bg-slate-50/70 text-slate-400' 
                        : isOverdue 
                        ? 'bg-rose-50/5 hover:bg-rose-50/20' 
                        : 'hover:bg-slate-50/40'
                    } ${showUrgentOverdueAlert ? 'border-l-4 border-rose-500' : ''}`}
                  >
                    {/* Checkbox toggle completion selection */}
                    <td className="py-3 px-4 text-center border-r border-slate-100/50">
                      <button
                        onClick={() => onToggleEaten(item.id)}
                        className={`p-1.5 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                          item.isEaten ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'
                        }`}
                        title={item.isEaten ? '標記為未食用完' : '標記為食用完畢'}
                      >
                        {item.isEaten ? (
                          <CheckSquare className="w-5 h-5 fill-emerald-50 bg-white rounded" />
                        ) : (
                          <Square className="w-5 h-5 bg-white rounded" />
                        )}
                      </button>
                    </td>

                    {/* Food Name details with alerts if any */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </span>
                        
                        {/* Urgent Alert Text Label - "過期提醒!!" with TWO red exclamation marks */}
                        {showUrgentOverdueAlert && (
                          <div className="flex items-center gap-0.5 mt-1 text-rose-600 font-bold text-xs animate-pulse tracking-wide scale-95 origin-left">
                            <AlertCircle className="w-3.5 h-3.5 fill-rose-50 stroke-[2.5]" />
                            <span>過期提醒</span>
                            <span className="text-red-600 font-extrabold text-base leading-none">!!</span>
                          </div>
                        )}
                        
                        {item.isEaten && (
                          <span className="text-[10px] text-emerald-600 font-semibold tracking-wider mt-0.5 block">
                            ✓ 完食登出
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Expiry date displaying color rules backgrounds */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-tight inline-flex items-center gap-1 ${styleMeta.badge}`}>
                        <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                        {item.expiryDate}
                      </span>
                    </td>

                    {/* Remaining/Status calculation widget */}
                    <td className="py-3 px-4 text-xs font-mono">
                      {item.isEaten ? (
                        <span className="text-slate-400 font-medium">不需追蹤</span>
                      ) : isOverdue ? (
                        <span className="text-rose-600 font-extrabold flex items-center gap-1">
                          已過期 {Math.abs(diffDays)} 天 &nbsp;
                          <span className="text-red-700 text-sm animate-bounce font-black">!!</span>
                        </span>
                      ) : diffDays === 0 ? (
                        <span className="text-orange-500 font-extrabold animate-pulse">
                          就在今天過期! 🙏
                        </span>
                      ) : (
                        <span className={`${styleMeta.text} font-bold`}>
                           剩餘 {diffDays} 天
                        </span>
                      )}
                    </td>

                    {/* Owner dropdown selector identifier */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 text-slate-700 bg-slate-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-slate-200">
                        <span className="text-xs">👤</span> {item.owner}
                      </span>
                    </td>

                     {/* Deletion action */}
                    <td className="py-3 px-4 text-center">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              onDeleteItem(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1 px-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all focus:outline-none cursor-pointer"
                          title="刪除登錄項目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
          </tbody>
        </table>
      </div>

      {/* Page counts breakdown statistics indicator on bottom row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400/95 pt-2 px-1">
        <div>
          目前顯示：<span className="font-bold text-slate-700">{processedItems.length}</span> / {items.length} 筆項目 &nbsp;
          {searchTerm && `(含搜尋關聯名: "${searchTerm}")`}
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#d9f99d] border border-lime-300 rounded inline-block" /> 黃綠色 (&gt;14天)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded inline-block" /> 黃色 (7-14天)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-100 border border-rose-300 rounded inline-block" /> 紅色 (&lt;7天)</span>
        </div>
      </div>
    </div>
  );
}
