import { useState } from 'react';
import { 
  DaySettlementData, 
  ReceptionOrder, 
  AttendanceRecord, 
  Staff, 
  TalentBonus 
} from '../types';
import { formatGil } from '../lib/format';
import { 
  Store, 
  CheckCircle2, 
  AlertTriangle, 
  Unlock, 
  Users, 
  Sparkles, 
  Clock, 
  Award, 
  ShieldAlert, 
  FileText 
} from 'lucide-react';

interface SettlementViewProps {
  settlement: DaySettlementData;
  orders: ReceptionOrder[];
  attendanceList: AttendanceRecord[];
  staffList: Staff[];
  bonuses: TalentBonus[];
  currentStaff: Staff | null;
  onCloseDay: (settledBy: string) => Promise<void>;
  onReopenDay: () => Promise<void>;
  onNavigateToOrder?: (order: ReceptionOrder) => void;
}

export function SettlementView({
  settlement,
  orders,
  attendanceList,
  staffList,
  bonuses,
  currentStaff,
  onCloseDay,
  onReopenDay,
  onNavigateToOrder,
}: SettlementViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isManager = currentStaff?.role === 'manager';
  const isSettled = settlement.isSettled;

  // 1. Unsettled guests
  const unsettledOrders = orders.filter(o => o.status !== 'settled');

  // 2. Unfinished services
  const unfinishedServices: { order: ReceptionOrder; serviceName: string; staffName: string }[] = [];
  for (const o of orders) {
    if (o.status !== 'settled') {
      for (const s of o.services) {
        if (s.status !== 'completed') {
          unfinishedServices.push({
            order: o,
            serviceName: s.name,
            staffName: s.staffName
          });
        }
      }
    }
  }

  // 3. Staff still clocked in
  const staffStillWorking = attendanceList.filter(a => !a.clockOutTime);

  // 4. Bonus registered count
  const bonusCount = bonuses.length;

  const canSafelyClose = unsettledOrders.length === 0 && unfinishedServices.length === 0;

  const handleExecuteSettlement = async () => {
    setIsProcessing(true);
    try {
      await onCloseDay(currentStaff?.name || '店長 賽菲兒');
      setShowConfirmModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isSettled ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' : 'bg-[#E8F1F8] border border-[#BFD7EE] text-[#245280]'
            }`}>
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#5B88B4] font-semibold">
                  DAY CLOSING & SETTLEMENT AUDIT
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-medium ${
                  isSettled 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}>
                  {isSettled ? '當日營業資料已封存鎖定' : '營業進行中 · 待結算'}
                </span>
              </div>
              <h1 className="font-manor text-xl font-bold text-slate-800 mt-1">
                夜蒔館 閉店檢查與營業結算
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                閉店結算前請逐項查核未結帳客人、侍奉服務完成狀態、全員下班打卡與才藝加成。確認結算後將鎖定當日所有單據並產生最終營業薪資報表。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isSettled ? (
              isManager && (
                <button
                  onClick={onReopenDay}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>店長解除閉店鎖定 (重新核算)</span>
                </button>
              )
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>執行當日閉店結算 (Close Day)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Closing 4-Point Checklist */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
          <h2 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#5B88B4]" />
            閉店前關鍵核對清單 (Pre-Closing Checklist)
          </h2>
          <span className="text-xs text-slate-500">
            結算規範：避免遺漏帳目或未完成服務
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Check item 1: Unsettled guests */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            unsettledOrders.length === 0
              ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
              : 'bg-rose-50 border-rose-200 text-slate-800'
          }`}>
            <div className={`p-2 rounded-lg ${
              unsettledOrders.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">1. 未結帳客人核對</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                  unsettledOrders.length === 0 ? 'text-emerald-800 bg-emerald-100' : 'text-rose-800 bg-rose-100'
                }`}>
                  {unsettledOrders.length === 0 ? '全部已結帳' : `尚有 ${unsettledOrders.length} 席未結帳`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {unsettledOrders.length === 0 
                  ? '館內所有開立單據皆已順利結帳並核對款項。'
                  : '尚有未結帳貴賓，請先前往單據頁面確認結帳，以確保營業額與薪資池正確。'}
              </p>
              {unsettledOrders.length > 0 && onNavigateToOrder && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {unsettledOrders.map(o => (
                    <button
                      key={o.id}
                      onClick={() => onNavigateToOrder(o)}
                      className="px-2.5 py-0.5 text-[10px] bg-white hover:bg-[#F3ECE1] text-[#245280] rounded-lg border border-[#BFD7EE] cursor-pointer"
                    >
                      前往 {o.guestName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Check item 2: Unfinished Special Services */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            unfinishedServices.length === 0
              ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
              : 'bg-amber-50 border-amber-200 text-slate-800'
          }`}>
            <div className={`p-2 rounded-lg ${
              unfinishedServices.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">2. 特別侍奉服務進度</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                  unfinishedServices.length === 0 ? 'text-emerald-800 bg-emerald-100' : 'text-amber-800 bg-amber-100'
                }`}>
                  {unfinishedServices.length === 0 ? '全數已完成' : `尚有 ${unfinishedServices.length} 項未完成`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {unfinishedServices.length === 0
                  ? '指名聊天、客製簽繪與純拍留影服務皆已完成交付。'
                  : '請確認指名聊天是否已完畢、簽繪是否已畫妥交付。'}
              </p>
            </div>
          </div>

          {/* Check item 3: Staff Still Clocked In */}
          <div className="p-4 rounded-xl border bg-[#FAF8F5] border-[#E8E2D7] text-slate-800 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-[#E8F1F8] text-[#245280]">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">3. 侍從下班打卡確認</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold text-[#245280] bg-[#E8F1F8]">
                  {staffStillWorking.length === 0 ? '全員已下班' : `${staffStillWorking.length} 位在勤中`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                閉店時執行結算將以打卡下班分鐘為薪資權重基準；如仍有侍從尚未結束上班，系統將以截至當前之分鐘數核算。
              </p>
            </div>
          </div>

          {/* Check item 4: Talent Bonuses */}
          <div className="p-4 rounded-xl border bg-[#FAF8F5] border-[#E8E2D7] text-slate-800 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">4. 當日才藝／演出加成登記</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold text-amber-900 bg-amber-100">
                  已登記 {bonusCount} 筆加成
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                請確認今日是否有現場豎琴演奏、魔術秀或特別表演尚未由店長登記加成權重。
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Settlement Final Audit Summary */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700" />
            <h2 className="font-manor text-base font-semibold text-slate-800">
              當日最終核算結果 (Final Settlement Statement)
            </h2>
          </div>
          {settlement.settledAt && (
            <span className="text-xs text-slate-500 font-mono">
              結算時間：{new Date(settlement.settledAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7]">
            <span className="text-slate-500 block text-[11px]">總營業額</span>
            <span className="font-mono text-base font-bold text-slate-900 mt-0.5 block">
              {formatGil(settlement.totalRevenue)}
            </span>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7]">
            <span className="text-slate-500 block text-[11px]">食物材料成本</span>
            <span className="font-mono text-base font-bold text-rose-700 mt-0.5 block">
              {formatGil(settlement.foodCost)}
            </span>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7]">
            <span className="text-slate-500 block text-[11px]">當日總薪資池</span>
            <span className="font-mono text-base font-bold text-amber-800 mt-0.5 block">
              {formatGil(settlement.totalPool)}
            </span>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7]">
            <span className="text-slate-500 block text-[11px]">每分鐘權重價值</span>
            <span className="font-mono text-base font-bold text-emerald-700 mt-0.5 block">
              {Math.round(settlement.valuePerWeight)} Gil
            </span>
          </div>
        </div>

        {/* Final Payouts list */}
        <div className="pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3D6] text-slate-500">
                <th className="pb-2 font-medium">侍從姓名</th>
                <th className="pb-2 font-medium text-right">出勤工時</th>
                <th className="pb-2 font-medium text-right">加成權重</th>
                <th className="pb-2 font-medium text-right">總權重</th>
                <th className="pb-2 font-medium text-right">最終實領薪資 (Gil)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D6]">
              {settlement.payouts.map(p => (
                <tr key={p.staffId}>
                  <td className="py-2.5 font-medium text-slate-800">{p.staffName}</td>
                  <td className="py-2.5 font-mono text-right text-slate-500">{p.workMinutes} 分</td>
                  <td className="py-2.5 font-mono text-right text-amber-700 font-medium">+{p.bonusWeight}</td>
                  <td className="py-2.5 font-mono text-right text-[#245280] font-semibold">{p.totalWeight}</td>
                  <td className="py-2.5 font-mono font-bold text-right text-emerald-700 text-sm">
                    {formatGil(p.totalIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-700 border-b border-[#EAE3D6] pb-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-manor text-base font-semibold text-slate-800">確認執行閉店結算？</h3>
                <p className="text-xs text-slate-500">此動作將鎖定當日所有接待單與薪資報表</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D7]">
              <p>・今日累計總營業額：<strong className="text-slate-900">{formatGil(settlement.totalRevenue)}</strong></p>
              <p>・當日薪資池結算總額：<strong className="text-amber-800">{formatGil(settlement.totalPool)}</strong></p>
              <p>・全店出勤總權重：<strong className="text-[#245280]">{settlement.totalShopWeight} 權重</strong></p>
              <p>・每分鐘權重核定值：<strong className="text-emerald-700">{Math.round(settlement.valuePerWeight)} Gil / 分</strong></p>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-[#EAE3D6]">
                ＊結算後原則上鎖定避免誤改，僅店長可登入解除鎖定進行修正。
              </p>
            </div>

            {!canSafelyClose && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                ⚠️ 注意：仍有未結帳接待單或未完成服務，建議先確認單據再執行結算。
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                返回檢查
              </button>
              <button
                onClick={handleExecuteSettlement}
                disabled={isProcessing}
                className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isProcessing ? '結算中...' : '確認完成閉店結算'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
