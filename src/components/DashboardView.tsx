import { useState, useMemo } from 'react';
import { 
  ReceptionOrder, 
  Staff, 
  AttendanceRecord, 
  ReceptionStatus, 
  SpecialServiceEntry,
  BusinessHoursConfig
} from '../types';
import { formatGil, formatTime } from '../lib/format';
import { calculateEffectiveWorkMinutes } from '../lib/calculations';
import { 
  Users, 
  CheckCircle2, 
  Coins, 
  Sparkles, 
  UserPlus, 
  Clock, 
  Lock, 
  ChevronRight, 
  AlertCircle,
  Coffee
} from 'lucide-react';

interface DashboardViewProps {
  currentStaff: Staff | null;
  currentAttendance: AttendanceRecord | undefined;
  orders: ReceptionOrder[];
  staffList: Staff[];
  onOpenNewReception: () => void;
  onSelectOrder: (order: ReceptionOrder) => void;
  onOpenLogin?: () => void;
  businessHours?: BusinessHoursConfig;
}

export function DashboardView({
  currentStaff,
  currentAttendance,
  orders,
  staffList,
  onOpenNewReception,
  onSelectOrder,
  onOpenLogin,
  businessHours,
}: DashboardViewProps) {
  const [statusFilter, setStatusFilter] = useState<ReceptionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate live work minutes within business hours
  const isWorking = currentAttendance && !currentAttendance.clockOutTime;
  const liveEffective = useMemo(() => {
    if (!currentAttendance) return { effectiveMinutes: 0, isOutsideBusinessHours: false };
    if (currentAttendance.clockOutTime) {
      return { effectiveMinutes: currentAttendance.minutesWorked, isOutsideBusinessHours: false };
    }
    return calculateEffectiveWorkMinutes(currentAttendance, businessHours, new Date());
  }, [currentAttendance, businessHours]);

  const workMinutes = liveEffective.effectiveMinutes;

  // Overall Statistics for today
  const activeOrders = orders.filter(o => o.status !== 'settled');
  const settledOrders = orders.filter(o => o.status === 'settled');
  const todayRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Active Pending Special Services across all active orders
  const pendingServices: { order: ReceptionOrder; service: SpecialServiceEntry }[] = [];
  for (const o of activeOrders) {
    for (const s of o.services) {
      if (s.status !== 'completed') {
        pendingServices.push({ order: o, service: s });
      }
    }
  }

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchQuery = !searchQuery.trim() || 
        o.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.tableNo ? o.tableNo.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
        o.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [orders, statusFilter, searchQuery]);

  const statusTabs: { id: ReceptionStatus | 'all'; label: string; count: number }[] = [
    { id: 'all', label: '全部接待單', count: orders.length },
    { id: 'active', label: '接待中', count: orders.filter(o => o.status === 'active').length },
    { id: 'pending_service', label: '等待服務', count: orders.filter(o => o.status === 'pending_service').length },
    { id: 'in_service', label: '特殊服務中', count: orders.filter(o => o.status === 'in_service').length },
    { id: 'pending_bill', label: '待結帳', count: orders.filter(o => o.status === 'pending_bill').length },
    { id: 'settled', label: '已結帳', count: settledOrders.length },
  ];

  return (
    <div className="space-y-6">
      {/* Staff Greeting & Live Status Banner (Cream & Powder Blue) */}
      <div className="bg-gradient-to-r from-[#FAF8F5] via-[#F4EFE6] to-[#EAF2F8] border border-[#E5DDD0] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#688EB5] bg-white shrink-0 shadow-xs">
              <img 
                src={currentStaff?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Yashi'} 
                alt={currentStaff?.name || 'Staff'} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-manor text-lg font-bold text-slate-800">
                  {currentStaff ? `貴安，${currentStaff.name}` : '夜蒔館 POS 總台'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-lg font-medium bg-[#E8F1F8] border border-[#BFD7EE] text-[#245280]">
                  {currentStaff?.roleTitle || '侍從總管'}
                </span>
                {onOpenLogin && (
                  <button
                    onClick={onOpenLogin}
                    className="text-[11px] text-[#4D7CA7] hover:text-[#38658E] underline underline-offset-2 ml-1 cursor-pointer font-medium"
                  >
                    [切換侍從]
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isWorking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  出勤狀態：<strong className={isWorking ? 'text-emerald-700' : 'text-slate-600'}>{isWorking ? '上班在勤中' : '尚未開始上班'}</strong>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5B88B4]" />
                  今日已工作：<strong className="font-mono text-slate-800">{workMinutes} 分鐘</strong>
                  {isWorking && liveEffective.isOutsideBusinessHours && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                      營業外暫停計時
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenNewReception}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#5B88B4]/30 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>新增客人接待 (New Reception)</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>目前在館接待中</span>
            <Users className="w-4 h-4 text-[#5B88B4]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-800">{activeOrders.length}</span>
            <span className="text-xs text-slate-500">桌席</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            入席低消 30,000 Gil 檢核中
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>今日完成接待</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-800">{settledOrders.length}</span>
            <span className="text-xs text-slate-500">單已結帳</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            歷史接待單據已鎖定防改
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>今日累計營業額</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#245280]">
              {formatGil(todayRevenue)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            含餐飲、服務與當日小費
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>待完成特殊服務</span>
            <Sparkles className="w-4 h-4 text-[#6A78BD]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#6A78BD]">{pendingServices.length}</span>
            <span className="text-xs text-slate-500">項服務進行中</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            包含指名聊天、簽繪與純拍
          </div>
        </div>
      </div>

      {/* Active Special Services Quick Alert Section */}
      {pendingServices.length > 0 && (
        <div className="bg-[#EAF2F8]/70 border border-[#BFD7EE] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#245280] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#5B88B4]" />
              當前進行中侍奉服務提示 ({pendingServices.length})
            </span>
            <span className="text-[11px] text-slate-500">侍從請留意招待進度與倒數</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {pendingServices.map(({ order, service }) => (
              <div
                key={service.id}
                onClick={() => onSelectOrder(order)}
                className="p-3 bg-white border border-[#D5E5F2] hover:border-[#5B88B4] rounded-xl cursor-pointer transition-all flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">{service.name}</span>
                    <span className="text-[10px] text-[#245280] font-medium">[{service.staffName}]</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    貴賓：{order.guestName}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    service.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {service.status === 'in_progress' ? '服務中' : '等待處理'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reception Orders List Section */}
      <div className="bg-[#FCFBF8] border border-[#E8E2D7] rounded-2xl p-5 space-y-4 shadow-xs">
        {/* Filter bar & search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#F1ECE1] rounded-xl border border-[#DFD6C7]">
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white border border-[#BFD7EE] text-[#245280] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋貴賓名稱、桌號或侍從..."
            className="px-3.5 py-1.5 text-xs bg-white border border-[#DFD6C7] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4] w-full sm:w-64 shadow-xs"
          />
        </div>

        {/* Orders Cards Grid */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Coffee className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">尚無符合此篩選條件的接待單</p>
            <button
              onClick={onOpenNewReception}
              className="px-4 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              新增第一筆接待單
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredOrders.map(order => {
              const isSettled = order.status === 'settled';
              const isBelowMin = order.totalAmount < 30000;
              const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

              const statusColor = 
                order.status === 'settled' ? 'text-slate-500 bg-slate-100 border-slate-200' :
                order.status === 'in_service' ? 'text-[#485392] bg-[#EFF2FD] border-[#D1D9F9]' :
                order.status === 'pending_service' ? 'text-[#205282] bg-[#E8F1F8] border-[#BFD7EE]' :
                order.status === 'pending_bill' ? 'text-amber-800 bg-amber-50 border-amber-200' :
                'text-emerald-800 bg-emerald-50 border-emerald-200';

              const statusLabel = 
                order.status === 'settled' ? '已結帳' :
                order.status === 'in_service' ? '特殊服務中' :
                order.status === 'pending_service' ? '等待服務' :
                order.status === 'pending_bill' ? '待結帳' : '接待中';

              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSettled 
                      ? 'bg-[#FAF8F5] border-[#E8E2D7] hover:border-[#D5CABB]' 
                      : 'bg-white border-[#E5DDD0] hover:border-[#5B88B4] shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-manor text-sm font-semibold text-slate-800 group-hover:text-[#5B88B4] transition-colors">
                            {order.guestName}
                          </h3>
                          {order.isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                          {order.orderNumber}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Order summary */}
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">擔當侍從</span>
                        <span className="text-slate-800 font-medium">{order.assignedStaffName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">入館時間</span>
                        <span className="font-mono text-slate-700">{formatTime(order.entryTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">餐飲／服務</span>
                        <span className="text-slate-700">
                          {itemCount} 份餐點 {order.services.length > 0 && `· ${order.services.length} 項服務`}
                        </span>
                      </div>
                    </div>

                    {/* Min spend warning badge if below 30,000 Gil & not settled */}
                    {!isSettled && isBelowMin && (
                      <div className="mt-2.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                        <span>未達低消 30k Gil (差 {formatGil(30000 - order.totalAmount)})</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-[#EAE3D6] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">單據應收</span>
                      <span className="font-mono text-xs font-bold text-[#245280]">
                        {formatGil(order.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-[#5B88B4] font-medium group-hover:translate-x-1 transition-transform">
                      <span>查看點餐</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
