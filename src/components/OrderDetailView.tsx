import { useState, useEffect } from 'react';
import { 
  ReceptionOrder, 
  MenuItem, 
  Staff, 
  OrderItem, 
  SpecialServiceEntry, 
  MenuCategory,
  ServiceStatus
} from '../types';
import { api } from '../lib/api';
import { formatGil, formatTime, generateBillReceiptText, generateCheckoutMacro } from '../lib/format';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Copy, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  Palette, 
  Camera, 
  AlertCircle, 
  Lock, 
  Unlock, 
  HeartHandshake,
  FileText,
  Play,
  Clock
} from 'lucide-react';

interface OrderDetailViewProps {
  order: ReceptionOrder;
  menu: MenuItem[];
  staffList: Staff[];
  currentStaff: Staff | null;
  onBack: () => void;
  onUpdateOrder: (updated: ReceptionOrder, isServiceUpdate?: boolean) => Promise<void>;
  onCheckout: (orderId: string) => Promise<void>;
  onReopen: (orderId: string) => Promise<void>;
}

export function OrderDetailView({
  order,
  menu,
  staffList,
  currentStaff,
  onBack,
  onUpdateOrder,
  onCheckout,
  onReopen
}: OrderDetailViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');
  const [macroCopied, setMacroCopied] = useState(false);
  const [receiptCopied, setReceiptCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  // Tip form state
  const [tipAmount, setTipAmount] = useState<number>(order.tip?.amount || 0);
  const [tipType, setTipType] = useState<'shared' | 'designated'>(order.tip?.type || 'shared');
  const [tipDesignatedStaffId, setTipDesignatedStaffId] = useState<string>(
    order.tip?.designatedStaffId || order.assignedStaffId || staffList[0]?.id || ''
  );

  // Special Service Modal States
  const [showServiceModal, setShowServiceModal] = useState<'chat' | 'sketch' | 'photo' | null>(null);
  const [serviceStaffId, setServiceStaffId] = useState(order.assignedStaffId);
  const [serviceNote, setServiceNote] = useState('');
  const [chatSessions, setChatSessions] = useState<number>(1);
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);

  // Chat countdown timer ticker
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isManager = currentStaff?.role === 'manager';
  const isLocked = order.isLocked;

  // Add food item
  const handleAddItem = async (item: MenuItem) => {
    if (isLocked) return;
    const existingIndex = order.items.findIndex(it => it.menuItemId === item.id);
    let newItems: OrderItem[];

    if (existingIndex >= 0) {
      newItems = order.items.map((it, idx) => {
        if (idx === existingIndex) {
          return { ...it, quantity: it.quantity + 1 };
        }
        return it;
      });
    } else {
      const newItem: OrderItem = {
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: item.id,
        name: item.name,
        category: item.category,
        unitPrice: item.price,
        cost: item.cost,
        poolShare: item.poolShare || (item.category === 'specialty' ? 10000 : 0),
        quantity: 1,
        recommendedStaffId: item.recommendedStaffId || (item.category === 'specialty' ? order.assignedStaffId : undefined),
        recommendedStaffName: item.recommendedStaffName || (item.category === 'specialty' ? order.assignedStaffName : undefined),
      };
      newItems = [...order.items, newItem];
    }

    await saveOrderChanges({ items: newItems });
  };

  // Adjust quantity
  const handleQuantityChange = async (itemId: string, delta: number) => {
    if (isLocked) return;
    const newItems = order.items
      .map(it => {
        if (it.id === itemId) {
          const newQty = it.quantity + delta;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        }
        return it;
      })
      .filter((it): it is OrderItem => it !== null);

    await saveOrderChanges({ items: newItems });
  };

  // Remove item
  const handleRemoveItem = async (itemId: string) => {
    if (isLocked) return;
    const newItems = order.items.filter(it => it.id !== itemId);
    await saveOrderChanges({ items: newItems });
  };

  // Update item recommendation
  const handleSetItemRecommendation = async (itemId: string, staffId: string) => {
    if (isLocked) return;
    const staff = staffList.find(s => s.id === staffId);
    const newItems = order.items.map(it => {
      if (it.id === itemId) {
        return {
          ...it,
          recommendedStaffId: staffId,
          recommendedStaffName: staff?.name || ''
        };
      }
      return it;
    });
    await saveOrderChanges({ items: newItems });
  };

  // Add Special Service
  const handleAddService = async () => {
    if (!showServiceModal || isLocked) return;

    const staff = staffList.find(s => s.id === serviceStaffId) || staffList[0];
    let newService: SpecialServiceEntry;

    if (showServiceModal === 'chat') {
      const sessions = chatSessions;
      newService = {
        id: `srv-${Date.now()}`,
        serviceType: 'chat',
        name: '指名聊天',
        staffId: staff.id,
        staffName: staff.name,
        price: 200000 * sessions,
        poolShare: 60000 * sessions,
        status: 'pending',
        sessions,
        startedAt: undefined,
        endsAt: undefined,
        note: serviceNote.trim()
      };
    } else if (showServiceModal === 'sketch') {
      const qty = Math.max(1, serviceQuantity || 1);
      newService = {
        id: `srv-${Date.now()}`,
        serviceType: 'sketch',
        name: '簽繪',
        staffId: staff.id,
        staffName: staff.name,
        price: 200000 * qty,
        poolShare: 20000 * qty,
        quantity: qty,
        status: 'pending',
        note: serviceNote.trim()
      };
    } else {
      const qty = Math.max(1, serviceQuantity || 1);
      newService = {
        id: `srv-${Date.now()}`,
        serviceType: 'photo',
        name: '純拍照留影',
        staffId: staff.id,
        staffName: staff.name,
        price: 100000 * qty,
        poolShare: 10000 * qty,
        quantity: qty,
        status: 'pending',
        note: serviceNote.trim()
      };
    }

    const updatedServices = [...order.services, newService];
    
    let newStatus = order.status;
    if (order.status === 'active') {
      newStatus = 'pending_service';
    }

    await saveOrderChanges({ 
      services: updatedServices,
      status: newStatus
    });

    setShowServiceModal(null);
    setServiceNote('');
    setServiceQuantity(1);
  };

  const handleServiceQuantityChange = async (serviceId: string, delta: number) => {
    if (isLocked) return;
    const updatedServices = order.services.map(sv => {
      if (sv.id === serviceId && sv.serviceType !== 'chat') {
        const curQty = sv.quantity || 1;
        const newQty = Math.max(1, curQty + delta);
        const unitPrice = sv.serviceType === 'sketch' ? 200000 : 100000;
        const unitPool = sv.serviceType === 'sketch' ? 20000 : 10000;
        return {
          ...sv,
          quantity: newQty,
          price: unitPrice * newQty,
          poolShare: unitPool * newQty
        };
      }
      return sv;
    });
    await saveOrderChanges({ services: updatedServices });
  };

  const handleUpdateServiceStatus = async (serviceId: string, status: ServiceStatus) => {
    if (isLocked) return;
    const updatedServices = order.services.map(s => {
      if (s.id === serviceId) {
        return { ...s, status };
      }
      return s;
    });
    await saveOrderChanges({ services: updatedServices });
  };

  const saveServiceChangesOnly = async (updatedServices: SpecialServiceEntry[]) => {
    setIsUpdating(true);
    try {
      let servicesSubtotal = 0;
      let servicesPool = 0;
      for (const sv of updatedServices) {
        servicesSubtotal += sv.price;
        servicesPool += sv.poolShare;
      }
      const updatedOrder: ReceptionOrder = {
        ...order,
        services: updatedServices,
        servicesSubtotal,
        totalAmount: order.foodSubtotal + servicesSubtotal + (order.tip?.amount || 0)
      };
      await onUpdateOrder(updatedOrder, true);
    } catch (err) {
      console.error('Failed to update service timing:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartChatTimer = async (serviceId: string) => {
    const updatedServices = order.services.map(s => {
      if (s.id === serviceId && s.serviceType === 'chat') {
        const sessions = s.sessions || 1;
        const durationMin = sessions * 20;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);
        return {
          ...s,
          status: 'in_progress' as ServiceStatus,
          startedAt: startTime.toISOString(),
          endsAt: endTime.toISOString()
        };
      }
      return s;
    });
    await saveServiceChangesOnly(updatedServices);
  };

  const handleResetChatTimer = async (serviceId: string) => {
    const updatedServices = order.services.map(s => {
      if (s.id === serviceId && s.serviceType === 'chat') {
        return {
          ...s,
          status: 'pending' as ServiceStatus,
          startedAt: undefined,
          endsAt: undefined
        };
      }
      return s;
    });
    await saveServiceChangesOnly(updatedServices);
  };

  const handleCompleteChatService = async (serviceId: string) => {
    const updatedServices = order.services.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          status: 'completed' as ServiceStatus
        };
      }
      return s;
    });
    await saveServiceChangesOnly(updatedServices);
  };

  const handleRemoveService = async (serviceId: string) => {
    if (isLocked) return;
    const updatedServices = order.services.filter(s => s.id !== serviceId);
    await saveOrderChanges({ services: updatedServices });
  };

  const handleApplyTip = async () => {
    if (isLocked) return;
    const designatedStaff = staffList.find(s => s.id === tipDesignatedStaffId);
    await saveOrderChanges({
      tip: {
        amount: Number(tipAmount) || 0,
        type: tipType,
        designatedStaffId: tipType === 'designated' ? tipDesignatedStaffId : undefined,
        designatedStaffName: tipType === 'designated' ? designatedStaff?.name : undefined
      }
    });
  };

  const saveOrderChanges = async (partial: Partial<ReceptionOrder>) => {
    setIsUpdating(true);
    try {
      const merged: ReceptionOrder = {
        ...order,
        ...partial
      };

      let foodSubtotal = 0;
      let foodProfit = 0;
      let specialtyPool = 0;
      for (const it of merged.items) {
        const line = it.unitPrice * it.quantity;
        if (it.category === 'specialty') {
          foodSubtotal += line;
          specialtyPool += (it.poolShare || 10000) * it.quantity;
        } else {
          foodSubtotal += line;
          const lineCost = (it.cost || 0) * it.quantity;
          foodProfit += (line - lineCost);
        }
      }

      let servicesSubtotal = 0;
      let servicesPool = 0;
      for (const sv of merged.services) {
        servicesSubtotal += sv.price;
        servicesPool += sv.poolShare;
      }

      const tipAmt = merged.tip?.amount || 0;
      merged.foodSubtotal = foodSubtotal;
      merged.servicesSubtotal = servicesSubtotal;
      merged.totalAmount = foodSubtotal + servicesSubtotal + tipAmt;
      merged.foodProfit = foodProfit;
      merged.poolContribution = foodProfit + specialtyPool + servicesPool;

      await onUpdateOrder(merged);
    } catch (err) {
      console.error('Failed to update order:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyMacro = () => {
    const text = generateCheckoutMacro(order);
    navigator.clipboard.writeText(text);
    setMacroCopied(true);
    setTimeout(() => setMacroCopied(false), 2500);
  };

  const handleCopyReceipt = () => {
    const text = generateBillReceiptText(order);
    navigator.clipboard.writeText(text);
    setReceiptCopied(true);
    setTimeout(() => setReceiptCopied(false), 2500);
  };


  const MIN_SPEND = 30000;
  const isBelowMinSpend = order.totalAmount < MIN_SPEND;
  const minSpendDifference = MIN_SPEND - order.totalAmount;

  const categories: { id: MenuCategory | 'all'; label: string }[] = [
    { id: 'all', label: '全部菜品' },
    { id: 'drink', label: '飲品' },
    { id: 'main', label: '主餐' },
    { id: 'dessert_salad', label: '甜點／沙拉' },
    { id: 'set', label: '套餐' },
    { id: 'specialty', label: '特色餐點' }
  ];

  const filteredMenuItems = menu.filter(m => {
    if (!m.isAvailable) return false;
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar in cream & powder blue */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8E2D7] p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-[#F4EFE6] hover:bg-[#EBE3D5] text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-manor text-lg font-bold text-slate-800 flex items-center gap-2">
                {order.guestName}
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-medium bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE]">
                  {order.tableNo}
                </span>
              </h1>
              {isLocked && (
                <span className="flex items-center gap-1 text-[11px] text-amber-800 font-medium px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                  <Lock className="w-3 h-3" />
                  已結帳鎖定
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>擔當侍從：<strong className="text-slate-800">{order.assignedStaffName}</strong></span>
              <span>·</span>
              <span>單號：<span className="font-mono">{order.orderNumber}</span></span>
              <span>·</span>
              <span>入館時間：{formatTime(order.entryTime)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Main button: 複製結帳巨集 */}
          <button
            onClick={handleCopyMacro}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#E8F1F8] hover:bg-[#D5E5F2] text-[#245280] border border-[#BFD7EE] rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            title="自動複製 FF14 送餐結帳巨集（自動帶入計算後之總金額）"
          >
            {macroCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#5B88B4]" />}
            <span>{macroCopied ? '已複製結帳巨集！' : '複製結帳巨集'}</span>
          </button>

          {/* Secondary button: 複製文字帳單明細 */}
          <button
            onClick={handleCopyReceipt}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium bg-[#F4EFE6] hover:bg-[#EAE2D3] text-slate-600 border border-[#DFD6C7] rounded-xl transition-all cursor-pointer"
            title="複製完整點餐明細與客製紀錄"
          >
            {receiptCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{receiptCopied ? '已複製明細！' : '明細帳單'}</span>
          </button>

          {isLocked ? (
            isManager && (
              <button
                onClick={() => onReopen(order.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl transition-colors cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>店長解鎖此單</span>
              </button>
            )
          ) : (
            <button
              onClick={() => setShowCheckoutConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>確認結帳</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Menu & Special Service Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Special Service Buttons */}
          <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#245280] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#5B88B4]" />
                特別侍奉服務 (Specialty Services)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Chat */}
              <button
                onClick={() => setShowServiceModal('chat')}
                disabled={isLocked}
                className="p-3 bg-[#FAF8F5] hover:bg-[#E8F1F8] border border-[#E8E2D7] hover:border-[#BFD7EE] rounded-xl text-left transition-all group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#245280]">指名聊天</span>
                  <MessageSquare className="w-4 h-4 text-[#5B88B4]" />
                </div>
                <div className="mt-1 text-xs font-mono font-semibold text-[#245280]">200,000 Gil</div>
                <div className="text-[10px] text-slate-500 mt-0.5">每節 20 分鐘</div>
              </button>

              {/* Sketch */}
              <button
                onClick={() => {
                  setServiceQuantity(1);
                  setShowServiceModal('sketch');
                }}
                disabled={isLocked}
                className="p-3 bg-[#FAF8F5] hover:bg-[#EFF2FD] border border-[#E8E2D7] hover:border-[#D1D9F9] rounded-xl text-left transition-all group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#485392]">客製簽繪</span>
                  <Palette className="w-4 h-4 text-[#6A78BD]" />
                </div>
                <div className="mt-1 text-xs font-mono font-semibold text-[#245280]">200,000 Gil / 張</div>
                <div className="text-[10px] text-slate-500 mt-0.5">可自選填寫張數</div>
              </button>

              {/* Photo */}
              <button
                onClick={() => {
                  setServiceQuantity(1);
                  setShowServiceModal('photo');
                }}
                disabled={isLocked}
                className="p-3 bg-[#FAF8F5] hover:bg-amber-50 border border-[#E8E2D7] hover:border-amber-200 rounded-xl text-left transition-all group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-800">純拍照留影</span>
                  <Camera className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-1 text-xs font-mono font-semibold text-[#245280]">100,000 Gil / 次</div>
                <div className="text-[10px] text-slate-500 mt-0.5">可自選填寫次數</div>
              </button>
            </div>
          </div>

          {/* Menu Categories Bar */}
          <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                館內典藏餐點 (Manor Menu)
              </span>
              <span className="text-[11px] text-slate-500">入席基本低消 30,000 Gil</span>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#F1ECE1] rounded-xl border border-[#DFD6C7]">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-white border border-[#BFD7EE] text-[#245280] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Menu Items Grid - Clean, High-efficiency, No descriptions or profit text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredMenuItems.map(item => {
                const isSpecialty = item.category === 'specialty';
                const isSet = item.category === 'set';
                return (
                  <div
                    key={item.id}
                    onClick={() => !isLocked && handleAddItem(item)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 group cursor-pointer ${
                      isSet
                        ? 'bg-[#F4F6FC] border-[#D1D9F9] hover:border-[#6A78BD] hover:bg-[#EDF1FA]'
                        : isSpecialty
                        ? 'bg-[#FEF9EE] border-amber-200 hover:border-amber-400 hover:bg-[#FCF5E3]'
                        : 'bg-[#FAF8F5] border-[#E8E2D7] hover:border-[#5B88B4] hover:bg-[#F3ECE1]'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#245280]">
                          {item.name}
                        </span>
                        {item.recommendedStaffName && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE] shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5B88B4]"></span>
                            {item.recommendedStaffName}推薦
                          </span>
                        )}
                        {isSet && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#1E293B] text-amber-200 border border-slate-700 shrink-0">
                            <span>✦</span>
                            莊園尊榮套餐
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-medium text-[#245280] mt-0.5">
                        {formatGil(item.price)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) handleAddItem(item);
                      }}
                      disabled={isLocked}
                      className="p-1.5 rounded-lg bg-white border border-[#DFD6C7] group-hover:border-[#5B88B4] group-hover:bg-[#5B88B4] group-hover:text-white text-slate-700 transition-colors shadow-xs shrink-0 cursor-pointer"
                      title="點選加入"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Bill & Real-time Bill Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E8E2D7] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
              <span className="font-manor text-sm font-bold text-slate-800">
                接待帳單明細 (Current Bill)
              </span>
              <span className="text-xs font-mono text-slate-500">
                已點 {order.items.reduce((s, i) => s + i.quantity, 0)} 品項 · {order.services.length} 服務
              </span>
            </div>

            {/* Minimum Spend Alert Box */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${
              isBelowMinSpend 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">入席最低消費：30,000 Gil</span>
                  <span className="font-mono text-[11px] font-bold">
                    {isBelowMinSpend ? `還差 ${formatGil(minSpendDifference)}` : '已達低消'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isBelowMinSpend 
                    ? '目前消費未達每位貴賓基本低消門檻，結帳前可提醒加點飲品或甜點。' 
                    : '已滿足最低消費門檻，感謝 主人／大小姐 點選。'}
                </p>
              </div>
            </div>

            {/* Food Items List */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                點選餐飲品項
              </span>
              {order.items.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-[#DFD6C7] rounded-xl bg-[#FAF8F5]">
                  尚未點選餐點，請點選左側菜單加入
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {order.items.map(it => {
                    const isSpecialty = it.category === 'specialty';
                    return (
                      <div
                        key={it.id}
                        className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl flex flex-col gap-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-xs font-medium text-slate-800 truncate">{it.name}</span>
                            {it.recommendedStaffName && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE] shrink-0">
                                {it.recommendedStaffName}推薦
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono font-semibold text-[#245280]">
                            {formatGil(it.unitPrice * it.quantity)}
                          </span>
                        </div>

                        {/* Recommendation selector for Specialty item */}
                        {isSpecialty && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                            <span className="shrink-0 font-medium">推薦侍從:</span>
                            <select
                              value={it.recommendedStaffId || order.assignedStaffId}
                              onChange={e => handleSetItemRecommendation(it.id, e.target.value)}
                              disabled={isLocked}
                              className="bg-white border border-amber-300 text-slate-800 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                            >
                              {staffList.filter(s => s.isActive).map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EAE3D6]">
                          <span className="text-[11px] text-slate-500">
                            單價 {formatGil(it.unitPrice)}
                          </span>
                          {!isLocked && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleQuantityChange(it.id, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-[#F1ECE1] hover:bg-[#E5DDD0] text-slate-700 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs w-5 text-center text-slate-800 font-semibold">
                                {it.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(it.id, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-[#F1ECE1] hover:bg-[#E5DDD0] text-slate-700 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(it.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Special Services List */}
            {order.services.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EAE3D6]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#245280] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#5B88B4]" />
                  進行中特別服務 ({order.services.length})
                </span>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {order.services.map(sv => {
                    const isChat = sv.serviceType === 'chat';
                    let remainingSeconds = 0;
                    if (isChat && sv.endsAt) {
                      const end = new Date(sv.endsAt).getTime();
                      remainingSeconds = Math.max(0, Math.floor((end - nowTs) / 1000));
                    }
                    const min = Math.floor(remainingSeconds / 60);
                    const sec = remainingSeconds % 60;

                    return (
                      <div
                        key={sv.id}
                        className="p-2.5 bg-[#F4F8FC] border border-[#BFD7EE] rounded-xl space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                              {sv.name}
                              {sv.quantity && sv.quantity > 1 && (
                                <span className="px-1.5 py-0.2 rounded bg-[#E8F1F8] text-[#245280] font-mono font-bold text-[11px] border border-[#BFD7EE]">
                                  ×{sv.quantity}{sv.serviceType === 'sketch' ? '張' : '次'}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-[#245280] font-medium">[{sv.staffName}]</span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-[#245280]">
                            {formatGil(sv.price)}
                          </span>
                        </div>

                        {sv.note && (
                          <p className="text-[11px] text-slate-600 italic">備註：{sv.note}</p>
                        )}

                        {/* Chat Service Lifecycle & Countdown Controls */}
                        {isChat && (
                          <div className="space-y-2 pt-1">
                            {!sv.startedAt || sv.status === 'pending' ? (
                              isLocked || order.status === 'settled' ? (
                                <div className="bg-[#E8F1F8] p-3 rounded-xl border border-[#BFD7EE] space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#245280] flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      已確認結帳 · 侍從就座後點擊開始
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-500">
                                      共 {sv.sessions || 1} 節 ({(sv.sessions || 1) * 20} 分鐘)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleStartChatTimer(sv.id)}
                                    className="w-full py-2.5 px-3 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>手動開始聊天計時 ({(sv.sessions || 1) * 20}分鐘)</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-xs bg-amber-50/90 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span className="text-[11px] font-medium">
                                      指名聊天 ({sv.sessions || 1}節 / {(sv.sessions || 1) * 20}分)
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded font-medium border border-amber-200">
                                    請確認結帳後，再由侍從點擊開始計算
                                  </span>
                                </div>
                              )
                            ) : sv.status === 'in_progress' && sv.endsAt ? (
                              <div className="bg-white p-2.5 rounded-xl border border-[#BFD7EE] space-y-2 shadow-xs">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600 text-[11px] flex items-center gap-1.5 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-[#5B88B4] animate-spin" />
                                    聊天計時進行中 ({sv.sessions}節/共{(sv.sessions || 1) * 20}分)
                                  </span>
                                  <span className={`font-mono font-bold text-sm ${remainingSeconds > 0 ? 'text-amber-600 animate-pulse' : 'text-rose-600'}`}>
                                    {remainingSeconds > 0 ? `剩餘 ${min}分 ${sec}秒` : '聊天時間結束'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => handleResetChatTimer(sv.id)}
                                    className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                                  >
                                    重置計時
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteChatService(sv.id)}
                                    className="px-3 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>完成聊天</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-xs bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-800">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="text-[11px] font-medium">指名聊天侍奉已圓滿完成</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleResetChatTimer(sv.id)}
                                  className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                                >
                                  重新計時
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status switcher & Quantity Stepper */}
                        <div className="flex items-center justify-between pt-1">
                          {!isLocked && sv.serviceType !== 'chat' ? (
                            <div className="flex items-center gap-1 bg-white border border-[#DFD6C7] rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleServiceQuantityChange(sv.id, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#FAF8F5] text-slate-600 transition-colors cursor-pointer"
                                title="減少數量"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs w-6 text-center font-bold text-slate-800">
                                {sv.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleServiceQuantityChange(sv.id, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#FAF8F5] text-slate-600 transition-colors cursor-pointer"
                                title="增加數量"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : <div />}

                          {!isLocked && (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={sv.status}
                                onChange={e => handleUpdateServiceStatus(sv.id, e.target.value as ServiceStatus)}
                                className="bg-white border border-[#DFD6C7] text-slate-800 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                              >
                                <option value="pending">待處理</option>
                                <option value="in_progress">進行中</option>
                                <option value="completed">已完成</option>
                              </select>
                              <button
                                onClick={() => handleRemoveService(sv.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tip Configuration */}
            <div className="pt-2 border-t border-[#EAE3D6] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                  心意小費 (Tips)
                </span>
                <span className="text-[10px] text-slate-500">獨立結算，不混入餐飲成本</span>
              </div>

              {!isLocked ? (
                <div className="space-y-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D7]">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      value={tipAmount || ''}
                      onChange={e => setTipAmount(Number(e.target.value))}
                      placeholder="小費金額 (Gil)"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#DFD6C7] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                    />
                    <select
                      value={tipType}
                      onChange={e => setTipType(e.target.value as 'shared' | 'designated')}
                      className="px-2 py-1.5 text-xs bg-white border border-[#DFD6C7] rounded-lg text-slate-800 focus:outline-none"
                    >
                      <option value="shared">全店共同小費</option>
                      <option value="designated">指定店員小費</option>
                    </select>
                  </div>

                  {tipType === 'designated' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 shrink-0">指定侍從：</span>
                      <select
                        value={tipDesignatedStaffId}
                        onChange={e => setTipDesignatedStaffId(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-[#DFD6C7] rounded-lg text-slate-800"
                      >
                        {staffList.filter(s => s.isActive).map(st => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleApplyTip}
                      className="px-3 py-1 bg-white hover:bg-[#F3ECE1] text-[#245280] text-[11px] font-medium rounded-lg border border-[#BFD7EE] transition-colors cursor-pointer"
                    >
                      儲存小費設定
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-700 flex items-center justify-between">
                  <span>{order.tip?.type === 'designated' ? `指定小費 (${order.tip.designatedStaffName || '侍從'})` : '全店共同小費'}</span>
                  <span className="font-mono font-semibold">{formatGil(order.tip?.amount || 0)}</span>
                </div>
              )}
            </div>

            {/* Subtotal & Grand Total Summary */}
            <div className="pt-3 border-t border-[#EAE3D6] space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>餐飲小計 (Food Subtotal)</span>
                <span className="font-mono font-medium text-slate-800">{formatGil(order.foodSubtotal)}</span>
              </div>
              {order.servicesSubtotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>服務小計 (Services Subtotal)</span>
                  <span className="font-mono font-medium text-slate-800">{formatGil(order.servicesSubtotal)}</span>
                </div>
              )}
              {order.tip && order.tip.amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>小費 (Tips)</span>
                  <span className="font-mono font-medium">{formatGil(order.tip.amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-[#EAE3D6]">
                <span className="font-manor text-[#245280]">應收總計 (Grand Total)</span>
                <span className="font-mono text-[#245280]">{formatGil(order.totalAmount)}</span>
              </div>
            </div>

            {/* Bottom Primary Checkout Button */}
            {!isLocked && (
              <button
                onClick={() => setShowCheckoutConfirm(true)}
                disabled={order.totalAmount === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-700/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>完成招待 · 確認結帳 ({formatGil(order.totalAmount)})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Special Service Setup Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5B88B4]" />
                登記特別服務：
                {showServiceModal === 'chat' ? '指名聊天' : showServiceModal === 'sketch' ? '客製簽繪' : '純拍照留影'}
              </h3>
              <button onClick={() => setShowServiceModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">指定負責侍從：</label>
                <select
                  value={serviceStaffId}
                  onChange={e => setServiceStaffId(e.target.value)}
                  className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                >
                  {staffList.filter(s => s.isActive).map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.roleTitle})</option>
                  ))}
                </select>
              </div>

              {showServiceModal === 'chat' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">聊天節數 (1節20分鐘，最多2節)：</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChatSessions(1)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        chatSessions === 1 
                          ? 'border-[#BFD7EE] bg-[#E8F1F8] text-[#245280]' 
                          : 'border-[#DFD6C7] bg-[#FAF8F5] text-slate-600'
                      }`}
                    >
                      <div className="font-semibold">1 節 (20分鐘)</div>
                      <div className="text-[10px] mt-0.5 font-mono">200,000 Gil</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatSessions(2)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        chatSessions === 2 
                          ? 'border-[#BFD7EE] bg-[#E8F1F8] text-[#245280]' 
                          : 'border-[#DFD6C7] bg-[#FAF8F5] text-slate-600'
                      }`}
                    >
                      <div className="font-semibold">2 節 (40分鐘)</div>
                      <div className="text-[10px] mt-0.5 font-mono">400,000 Gil</div>
                    </button>
                  </div>
                </div>
              )}

              {showServiceModal === 'sketch' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">簽繪數量 (張數)：</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center border border-[#DFD6C7] rounded-xl bg-[#FAF8F5] overflow-hidden p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setServiceQuantity(Math.max(1, serviceQuantity - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#F3ECE1] text-slate-700 font-bold transition-colors cursor-pointer border border-[#EAE3D6]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={serviceQuantity}
                        onChange={e => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 text-center font-mono font-bold text-slate-800 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setServiceQuantity(serviceQuantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#F3ECE1] text-slate-700 font-bold transition-colors cursor-pointer border border-[#EAE3D6]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5].map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setServiceQuantity(q)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            serviceQuantity === q
                              ? 'bg-[#E8F1F8] border-[#BFD7EE] text-[#245280] shadow-xs'
                              : 'bg-white border-[#DFD6C7] text-slate-600 hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {q} 張
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-[#245280] font-mono font-medium mt-1.5">
                    金額小計：200,000 Gil × {serviceQuantity} 張 = {formatGil(200000 * serviceQuantity)}
                  </div>
                </div>
              )}

              {showServiceModal === 'photo' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">拍照留影數量 (次數／張數)：</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center border border-[#DFD6C7] rounded-xl bg-[#FAF8F5] overflow-hidden p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setServiceQuantity(Math.max(1, serviceQuantity - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#F3ECE1] text-slate-700 font-bold transition-colors cursor-pointer border border-[#EAE3D6]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={serviceQuantity}
                        onChange={e => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 text-center font-mono font-bold text-slate-800 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setServiceQuantity(serviceQuantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-[#F3ECE1] text-slate-700 font-bold transition-colors cursor-pointer border border-[#EAE3D6]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5].map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setServiceQuantity(q)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            serviceQuantity === q
                              ? 'bg-[#E8F1F8] border-[#BFD7EE] text-[#245280] shadow-xs'
                              : 'bg-white border-[#DFD6C7] text-slate-600 hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {q} 次
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-[#245280] font-mono font-medium mt-1.5">
                    金額小計：100,000 Gil × {serviceQuantity} 次 = {formatGil(100000 * serviceQuantity)}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 mb-1 font-medium">需求備註 (Optional)：</label>
                <input
                  type="text"
                  value={serviceNote}
                  onChange={e => setServiceNote(e.target.value)}
                  placeholder={
                    showServiceModal === 'sketch'
                      ? '例如：希望畫莫古力手持洋館茶杯'
                      : showServiceModal === 'photo'
                      ? '例如：薔薇花窗合照一張'
                      : '例如：聊冒險日常與近東航海'
                  }
                  className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowServiceModal(null)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddService}
                className="px-4 py-2 text-xs bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-lg font-medium transition-colors cursor-pointer shadow-xs"
              >
                確認登記服務
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 border-b border-[#EAE3D6] pb-3">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <h3 className="font-manor text-base font-semibold text-slate-800">確認完成招待並結帳</h3>
                <p className="text-xs text-slate-500">核對貴賓消費總額與單據</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>貴賓稱呼：</span>
                <span className="text-slate-800 font-semibold">{order.guestName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>入席桌號：</span>
                <span className="text-slate-800">{order.tableNo}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>擔當侍從：</span>
                <span className="text-slate-800">{order.assignedStaffName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>餐點與服務品項：</span>
                <span className="text-slate-800">{order.items.length} 樣餐點 / {order.services.length} 項服務</span>
              </div>
              {order.tip && order.tip.amount > 0 && (
                <div className="flex justify-between text-rose-700 font-medium">
                  <span>小費金額：</span>
                  <span className="font-mono">{formatGil(order.tip.amount)} ({order.tip.type === 'designated' ? '指定' : '共同'})</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#245280] pt-2 border-t border-[#EAE3D6]">
                <span>應收結帳總計：</span>
                <span className="font-mono">{formatGil(order.totalAmount)}</span>
              </div>
            </div>

            {isBelowMinSpend && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                ⚠️ 注意：此單目前總計未達最低消費 30,000 Gil (差額 {formatGil(minSpendDifference)})。若已確認客人離館可直接結帳。
              </div>
            )}

            {/* FF14 Checkout Macro Preview & Quick Copy */}
            <div className="p-3 bg-[#EAF2F8] border border-[#BFD7EE] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#245280] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5B88B4]" />
                  FF14 送餐結帳巨集
                </span>
                <button
                  type="button"
                  onClick={handleCopyMacro}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-[#F3ECE1] text-[#245280] border border-[#BFD7EE] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                >
                  {macroCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5B88B4]" />}
                  <span>{macroCopied ? '已複製巨集！' : '複製巨集'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-[#D5E5F2] whitespace-pre-wrap select-all leading-relaxed">
                {generateCheckoutMacro(order)}
              </pre>
            </div>


            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                回單據調整
              </button>
              <button
                onClick={async () => {
                  await onCheckout(order.id);
                  setShowCheckoutConfirm(false);
                }}
                className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                確認結帳鎖定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
