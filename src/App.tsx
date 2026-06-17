import { useState, useEffect } from 'react';
import { FoodItem, OwnerName } from './types';
import FoodForm from './components/FoodForm';
import FoodTable from './components/FoodTable';
import { RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';

const SEED_DATA: FoodItem[] = [
  {
    id: 'seed-1',
    name: '瑞穗鮮乳 936ml',
    owner: 'Wei',
    expiryDate: '2026-06-30', // > 14 days away from 2026-06-15 (yellow-green)
    isEaten: false,
    createdAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'seed-2',
    name: '溫泉蛋 (2入)',
    owner: '恩7',
    expiryDate: '2026-06-25', // 10 days away (yellow)
    isEaten: false,
    createdAt: '2026-06-12T10:15:00.000Z',
  },
  {
    id: 'seed-3',
    name: '招牌便當',
    owner: 'Wu',
    expiryDate: '2026-06-14', // -1 day away (overdue, red, warnings visible!)
    isEaten: false,
    createdAt: '2026-06-13T12:00:00.000Z',
  },
  {
    id: 'seed-4',
    name: '三明治',
    owner: '大白',
    expiryDate: '2026-06-18', // 3 days away (red)
    isEaten: false,
    createdAt: '2026-06-14T08:30:00.000Z',
  },
  {
    id: 'seed-5',
    name: '鮮奶茶 (大)',
    owner: '龐龐',
    expiryDate: '2026-06-12', // Expired (-3 days), and isEaten is TRUE! (row is grayed out/muted)
    isEaten: true,
    createdAt: '2026-06-11T16:45:00.000Z',
  },
  {
    id: 'seed-6',
    name: '優格',
    owner: '語蓁',
    expiryDate: '2026-06-24', // 9 days away (yellow)
    isEaten: false,
    createdAt: '2026-06-13T14:20:00.000Z',
  },
  {
    id: 'seed-7',
    name: 'Red Bull 能量飲料',
    owner: '687',
    expiryDate: '2026-07-15', // 30 days away (yellow-green)
    isEaten: false,
    createdAt: '2026-06-14T11:00:00.000Z',
  },
];

export default function App() {
  const [items, setItems] = useState<FoodItem[]>([]);
  
  // Set reference simulated "Today's Date" to align with current time 2026-06-15.
  const [todayStr, setTodayStr] = useState<string>('2026-06-15');

  // Active editing item state
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Load items & configurations on initialize
  useEffect(() => {
    const cachedItems = localStorage.getItem('fridge_food_items_list');
    const cachedToday = localStorage.getItem('fridge_simulated_today');

    if (cachedItems) {
      try {
        setItems(JSON.parse(cachedItems));
      } catch (e) {
        setItems(SEED_DATA);
      }
    } else {
      setItems(SEED_DATA);
      localStorage.setItem('fridge_food_items_list', JSON.stringify(SEED_DATA));
    }

    if (cachedToday) {
      setTodayStr(cachedToday);
    } else {
      setTodayStr('2026-06-15');
      localStorage.setItem('fridge_simulated_today', '2026-06-15');
    }
  }, []);

  // Standard persisting wrapper
  const updateAndPersistItems = (newItems: FoodItem[]) => {
    setItems(newItems);
    localStorage.setItem('fridge_food_items_list', JSON.stringify(newItems));
  };

  const handleUpdateToday = (dateVal: string) => {
    setTodayStr(dateVal);
    localStorage.setItem('fridge_simulated_today', dateVal);
  };

  // Date calculation utility used inside dashboards & list tables
  const getDateDiff = (expiryStr: string): number => {
    const expiry = new Date(expiryStr);
    const today = new Date(todayStr);

    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 1. Add food item
  const handleAddItem = (details: { name: string; owner: OwnerName; expiryDate: string }) => {
    const newItem: FoodItem = {
      id: `food-${Date.now()}`,
      name: details.name,
      owner: details.owner,
      expiryDate: details.expiryDate,
      isEaten: false,
      createdAt: new Date().toISOString(),
    };

    updateAndPersistItems([newItem, ...items]);
  };

  // 1b. Update existing food item
  const handleUpdateItem = (id: string, updatedDetails: { name: string; owner: OwnerName; expiryDate: string }) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          name: updatedDetails.name,
          owner: updatedDetails.owner,
          expiryDate: updatedDetails.expiryDate,
        };
      }
      return item;
    });
    updateAndPersistItems(updated);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleEditItemSelect = (item: FoodItem) => {
    setEditingItem(item);
  };

  // 2. Toggle item eaten/finished state
  const handleToggleEaten = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isEaten: !item.isEaten,
        };
      }
      return item;
    });
    updateAndPersistItems(updated);
  };

  // 3. Delete food item from system
  const handleDeleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    updateAndPersistItems(updated);
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
  };

  // 4. Force default seed reset helper
  const handleResetData = () => {
    updateAndPersistItems(SEED_DATA);
    setTodayStr('2026-06-15');
    setEditingItem(null);
    localStorage.setItem('fridge_simulated_today', '2026-06-15');
  };

  // Helper calculation counts
  const overdueCount = items.filter(i => getDateDiff(i.expiryDate) < 0).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col pb-16 font-sans">
      
      {/* Visual Header Banner in Technical Dashboard / Grid Style */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand info in Technical Theme Style */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded flex items-center justify-center text-lg shadow-sm">
              ❄️
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Smart Office Management</span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                冰箱戶口名簿
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-100">
                  Grid v2.1
                </span>
              </h1>
            </div>
          </div>

          {/* Quick global system reset config */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              title="重設原始測試資料"
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 bg-white border border-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重設範例資料
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard space body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full space-y-6">
        
        {/* Urgent alarm message top notify banner if we have overdue food */}
        {overdueCount > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-2xl text-rose-700 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-slide-down">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🚨</span>
              <div>
                <h4 className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                  過期警報！！共有 <span className="underline decoration-wavy font-extrabold text-base">{overdueCount}</span> 件過期
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 bg-rose-100 rounded-lg text-rose-900 font-bold border border-rose-200">
                已過期提醒!!
              </span>
            </div>
          </div>
        )}

        {/* 2. Base content: split form left and core data tables list on right */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left tools configuration panel: add/edit form and date shift simulation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main ADD/EDIT record Form */}
            <FoodForm 
              onAddItem={handleAddItem} 
              todayStr={todayStr} 
              editingItem={editingItem}
              onUpdateItem={handleUpdateItem}
              onCancelEdit={handleCancelEdit}
            />
          </div>

          {/* Right actual record tables list visualization */}
          <div className="lg:col-span-8">
            <FoodTable
              items={items}
              onToggleEaten={handleToggleEaten}
              onDeleteItem={handleDeleteItem}
              getDateDiff={getDateDiff}
              todayStr={todayStr}
              onEditItem={handleEditItemSelect}
              activeEditId={editingItem?.id}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
