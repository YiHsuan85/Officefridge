import React, { useState, useEffect } from 'react';
import { OWNERS, OwnerName, FoodItem } from '../types';
import { Calendar, Plus, RefreshCcw, User, Tag, ShoppingBag, Edit3, X } from 'lucide-react';

interface FoodFormProps {
  onAddItem: (itemDetails: { name: string; owner: OwnerName; expiryDate: string }) => void;
  todayStr: string;
  editingItem: FoodItem | null;
  onUpdateItem: (id: string, updatedDetails: { name: string; owner: OwnerName; expiryDate: string }) => void;
  onCancelEdit: () => void;
}

export default function FoodForm({ onAddItem, todayStr, editingItem, onUpdateItem, onCancelEdit }: FoodFormProps) {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState<OwnerName>('Wei'); // default
  const [expiryDate, setExpiryDate] = useState(() => {
    // Default to +7 days from basic baseline today, i.e., 2026-06-22
    const baseDate = new Date(todayStr);
    baseDate.setDate(baseDate.getDate() + 7);
    return baseDate.toISOString().split('T')[0];
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if editingItem shifts
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setOwner(editingItem.owner as OwnerName);
      setExpiryDate(editingItem.expiryDate);
    } else {
      setName('');
      const baseDate = new Date(todayStr);
      baseDate.setDate(baseDate.getDate() + 7);
      setExpiryDate(baseDate.toISOString().split('T')[0]);
    }
    setErrorMessage('');
  }, [editingItem?.id, todayStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('請填寫名稱！');
      return;
    }

    if (!expiryDate) {
      setErrorMessage('請選擇合理的過期日期！');
      return;
    }

    if (editingItem) {
      onUpdateItem(editingItem.id, {
        name: trimmedName,
        owner,
        expiryDate,
      });
    } else {
      onAddItem({
        name: trimmedName,
        owner,
        expiryDate,
      });
    }

    // Reset input states nicely
    setName('');
    // Keep most recent owner to speed up consecutive food additions
    // Reset date to +7 days again
    const baseDate = new Date(todayStr);
    baseDate.setDate(baseDate.getDate() + 7);
    setExpiryDate(baseDate.toISOString().split('T')[0]);
  };

  // Preset smart helpers to speed up date entry
  const setQuickExpiry = (daysFromToday: number) => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + daysFromToday);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {editingItem ? (
              <>
                <span className="p-1 px-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold font-display">
                  ⚡ Edit
                </span>
                編輯冰箱保管紀錄
              </>
            ) : (
              <>
                <span className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold font-display">
                  + Add
                </span>
                新增家族成員
              </>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {editingItem 
              ? `正在編輯「${editingItem.name}」的登錄設定。`
              : '輸入名稱、歸屬成員及指定過期日，即可登錄冰箱白板。'
            }
          </p>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
            名稱 <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="例如：藍莓希臘優格、鮮乳、肉乾..."
              className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:bg-white transition-all text-slate-800"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-medium">
              必填
            </div>
          </div>
        </div>

        {/* Owner dropdown input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
            <User className="w-3.5 h-3.5 text-slate-400" />
            擁有者姓名 <span className="text-indigo-500">*</span>
          </label>
          <div className="relative">
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value as OwnerName)}
              className="w-full pl-3 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:bg-white text-slate-800 transition-all appearance-none cursor-pointer"
            >
              {OWNERS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Date input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            食物過期日 <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:bg-white text-slate-800 transition-all"
          />

          {/* Quick timing click helpers */}
          <div className="grid grid-cols-4 gap-1 mt-2">
            <button
              type="button"
              onClick={() => setQuickExpiry(3)}
              className="px-1.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-150 transition-colors"
            >
              3天內 (急)
            </button>
            <button
              type="button"
              onClick={() => setQuickExpiry(7)}
              className="px-1.5 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-150 transition-colors"
            >
              1週內 (黃)
            </button>
            <button
              type="button"
              onClick={() => setQuickExpiry(14)}
              className="px-1.5 py-1 text-[10px] font-bold bg-lime-50 hover:bg-lime-100 text-lime-700 rounded-lg border border-lime-150 transition-colors"
            >
              2週內
            </button>
            <button
              type="button"
              onClick={() => setQuickExpiry(30)}
              className="px-1.5 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-150 transition-colors"
            >
              1個月 (綠)
            </button>
          </div>
        </div>

        {/* Render Form Validation Error alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-1.5 mt-2 animate-slide-down">
            <span>⚠️</span>
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {editingItem ? (
          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:transform active:scale-98 transition-all text-slate-705 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <X className="w-4 h-4 text-slate-500" />
              取消
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-98 transition-all text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
            >
              <Edit3 className="w-4 h-4" strokeWidth={2} />
              儲存修改
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-98 transition-all text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            新增成員
          </button>
        )}
      </form>


    </div>
  );
}
