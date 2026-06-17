import { useState, useEffect } from 'react';
import { FoodItem, OwnerName } from './types';
import FoodForm from './components/FoodForm';
import FoodTable from './components/FoodTable';
import { RefreshCw, Sparkles, AlertTriangle, Wifi, CloudOff, Cloud, Check } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';

const SEED_DATA: FoodItem[] = [
  {
    id: 'seed-1',
    name: '瑞穗鮮乳',
    owner: 'Wei',
    expiryDate: '2026-06-30', // > 14 days away from 2026-06-15 (yellow-green)
    isEaten: false,
    createdAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'seed-2',
    name: '招牌便當',
    owner: 'Wu',
    expiryDate: '2026-06-14', // -1 day away (overdue, red, warnings visible!)
    isEaten: false,
    createdAt: '2026-06-13T12:00:00.000Z',
  },
  {
    id: 'seed-3',
    name: '三明治',
    owner: '大白',
    expiryDate: '2026-06-18', // 3 days away (red)
    isEaten: false,
    createdAt: '2026-06-14T08:30:00.000Z',
  },
  {
    id: 'seed-4',
    name: 'Red Bull 紅牛',
    owner: '67',
    expiryDate: '2026-07-15', // 30 days away (yellow-green)
    isEaten: false,
    createdAt: '2026-06-14T11:00:00.000Z',
  },
];

export default function App() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [syncing, setSyncing] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Set reference simulated "Today's Date" to align with current time 2026-06-15.
  const [todayStr, setTodayStr] = useState<string>('2026-06-15');

  // Active editing item state
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Manual cloud synchronization feedback states
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState<boolean>(false);
  const [syncedDetails, setSyncedDetails] = useState<{ count: number; time: string } | null>(null);

  // Load items & configurations on initialize with Firestore live snapshot subscriptions
  useEffect(() => {
    const cachedToday = localStorage.getItem('fridge_simulated_today');

    if (cachedToday) {
      setTodayStr(cachedToday);
    } else {
      setTodayStr('2026-06-15');
      localStorage.setItem('fridge_simulated_today', '2026-06-15');
    }

    // Connection testing check (as suggested in documentation guidance)
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'food_items', 'ping'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.warn("Firestore client appears offline:", error.message);
        }
      }
    };
    testConnection();

    const q = collection(db, 'food_items');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const dbItems: FoodItem[] = [];
      snapshot.forEach((docSnap) => {
        // Exclude system verification metadata from active foods list
        if (docSnap.id === 'last_sync_verification' || docSnap.id === 'ping') {
          return;
        }

        const data = docSnap.data();
        let owner = (data.owner || '') as OwnerName;
        if (owner === '龐龐' as any) {
          owner = 'Q';
          const docRef = doc(db, 'food_items', docSnap.id);
          updateDoc(docRef, { owner: 'Q' }).catch((e) => console.error("Error migrating owner '龐龐':", e));
        } else if (owner === '687' as any) {
          owner = '67';
          const docRef = doc(db, 'food_items', docSnap.id);
          updateDoc(docRef, { owner: '67' }).catch((e) => console.error("Error migrating owner '687':", e));
        }

        dbItems.push({
          id: docSnap.id,
          name: data.name || '',
          owner,
          expiryDate: data.expiryDate || '',
          isEaten: !!data.isEaten,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort by createdAt descending initially so new records show first in UI
      dbItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      // Always commit the items array to the react state so the screen reflects reality instantly
      setItems(dbItems);

      // Auto-seeds Firestore on initial first boot setup if collection is empty AND we haven't seeded yet
      const hasSeededBefore = localStorage.getItem('fridge_db_seeded') === 'true';
      if (snapshot.empty && !hasSeededBefore) {
        try {
          for (const item of SEED_DATA) {
            const docRef = doc(db, 'food_items', item.id);
            await setDoc(docRef, {
              name: item.name,
              owner: item.owner,
              expiryDate: item.expiryDate,
              isEaten: item.isEaten,
              createdAt: item.createdAt,
            });
          }
          localStorage.setItem('fridge_db_seeded', 'true');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'food_items');
        }
      }
      setSyncing(false);
      setSyncError(null);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'food_items');
      setSyncError("Cloud Sync Offline");
      setSyncing(false);
    });

    return () => unsubscribe();
  }, []);

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
  const handleAddItem = async (details: { name: string; owner: OwnerName; expiryDate: string }) => {
    const newId = `food-${Date.now()}`;
    const path = `food_items/${newId}`;
    try {
      const docRef = doc(db, 'food_items', newId);
      await setDoc(docRef, {
        name: details.name,
        owner: details.owner,
        expiryDate: details.expiryDate,
        isEaten: false,
        createdAt: new Date().toISOString(),
      });
      // Mark as seeded in local storage since they completed a manual insert
      localStorage.setItem('fridge_db_seeded', 'true');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // 1b. Update existing food item
  const handleUpdateItem = async (id: string, updatedDetails: { name: string; owner: OwnerName; expiryDate: string }) => {
    const path = `food_items/${id}`;
    try {
      const docRef = doc(db, 'food_items', id);
      await updateDoc(docRef, {
        name: updatedDetails.name,
        owner: updatedDetails.owner,
        expiryDate: updatedDetails.expiryDate,
      });
      setEditingItem(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleEditItemSelect = (item: FoodItem) => {
    setEditingItem(item);
  };

  // 2. Toggle item eaten/finished state
  const handleToggleEaten = async (id: string) => {
    const path = `food_items/${id}`;
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;
      const docRef = doc(db, 'food_items', id);
      await updateDoc(docRef, {
        isEaten: !item.isEaten,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // 3. Delete food item from system
  const handleDeleteItem = async (id: string) => {
    const path = `food_items/${id}`;
    try {
      const docRef = doc(db, 'food_items', id);
      await deleteDoc(docRef);
      if (editingItem?.id === id) {
        setEditingItem(null);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // 3.5 Manual Save and Force Cloud Synchronization Verification
  const handleForceSyncAndSave = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      // 1. Force write a verification health heartbeat status to ensure cloud connection is active safely within the primary food_items collection
      const syncMetaRef = doc(db, 'food_items', 'last_sync_verification');
      const syncedTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      
      await setDoc(syncMetaRef, {
        lastSyncedAt: new Date().toISOString(),
        itemCount: items.length,
        status: 'healthy_verified',
        updatedBy: 'user'
      });

      // 2. Ensure all current local items state exist synchronously in Firestore
      for (const item of items) {
        const itemRef = doc(db, 'food_items', item.id);
        await setDoc(itemRef, {
          name: item.name,
          owner: item.owner,
          expiryDate: item.expiryDate,
          isEaten: item.isEaten,
          createdAt: item.createdAt,
        }, { merge: true });
      }

      // 3. Store details to display a beautiful checkmark toast confirmation
      setSyncedDetails({
        count: items.length,
        time: syncedTime,
      });
      setShowSyncSuccessToast(true);

      // Dismiss floating alert automatically after 4 seconds
      setTimeout(() => {
        setShowSyncSuccessToast(false);
      }, 4000);

    } catch (err) {
      console.error("Force cloud sync failed:", err);
      handleFirestoreError(err, OperationType.WRITE, 'food_items/last_sync_verification');
      setSyncError("手動同步失敗，請檢查網路連線");
    } finally {
      setSyncing(false);
    }
  };

  // 4. Force default seed reset helper
  const handleResetData = async () => {
    setSyncing(true);
    try {
      // Clean everything
      for (const item of items) {
        const docRef = doc(db, 'food_items', item.id);
        await deleteDoc(docRef);
      }
      // Re-populate seeds
      for (const item of SEED_DATA) {
        const docRef = doc(db, 'food_items', item.id);
        await setDoc(docRef, {
          name: item.name,
          owner: item.owner,
          expiryDate: item.expiryDate,
          isEaten: item.isEaten,
          createdAt: item.createdAt,
        });
      }
      setTodayStr('2026-06-15');
      setEditingItem(null);
      localStorage.setItem('fridge_simulated_today', '2026-06-15');
      localStorage.setItem('fridge_db_seeded', 'true');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'food_items/reset');
    } finally {
      setSyncing(false);
    }
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
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-2">
                冰箱戶口名簿
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-100">
                  Grid v2.1
                </span>
                {syncing ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded border border-indigo-100 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    雲端同步中...
                  </span>
                ) : syncError ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded border border-rose-100">
                    <CloudOff className="w-2.5 h-2.5" />
                    連線失敗
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded border border-emerald-100">
                    <Wifi className="w-2.5 h-2.5 text-emerald-550 shrink-0" />
                    已連線 Firebase Cloud
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Quick global system reset config */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleForceSyncAndSave}
              disabled={syncing}
              title="儲存資料並確定資料與雲端同步"
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              {syncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              儲存並同步至雲端
            </button>
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

      {/* Floating Active Synchronization Status/Success Dialog Alert */}
      {showSyncSuccessToast && syncedDetails && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl flex items-start gap-3 animate-slide-up max-w-sm">
          <div className="p-2 bg-emerald-500 text-slate-900 rounded-xl">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-50 flex items-center gap-1.5">
              雲端存檔同步成功！
              <span className="w-2 h-2 rounded-full bg-emerald-450 animate-ping" />
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              已將 <span className="font-bold text-emerald-400">{syncedDetails.count} 筆</span> 家人成員與冰箱保管紀錄安全寫入且完成 100% 雲端同步校對。
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              驗證時間碼：{syncedDetails.time}
            </p>
          </div>
        </div>
      )}

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
