import { useMemo, useState } from 'react';
import { 
  ReceptionOrder, 
  DaySettlementData, 
  Staff, 
  MenuItem 
} from '../types';
import { formatGil } from '../lib/format';
import { 
  BarChart3, 
  Coins, 
  Award, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  UtensilsCrossed 
} from 'lucide-react';

interface ReportsViewProps {
  settlement: DaySettlementData;
  orders: ReceptionOrder[];
  staffList: Staff[];
  menu: MenuItem[];
}

export function ReportsView({
  settlement,
  orders,
  staffList,
  menu,
}: ReportsViewProps) {
  const [copied, setCopied] = useState(false);

  // Popular Food/Drink Ranking
  const foodRanking = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};
    for (const order of orders) {
      for (const it of order.items) {
        if (!map[it.name]) {
          map[it.name] = { name: it.name, quantity: 0, revenue: 0, profit: 0 };
        }
        map[it.name].quantity += it.quantity;
        map[it.name].revenue += it.unitPrice * it.quantity;
        const cost = (it.cost || 0) * it.quantity;
        map[it.name].profit += (it.unitPrice * it.quantity - cost);
      }
    }
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  // Staff Receptions Count
  const staffReceptionStats = useMemo(() => {
    const map: Record<string, { staffName: string; count: number; revenue: number }> = {};
    for (const order of orders) {
      const name = order.assignedStaffName;
      if (!map[name]) {
        map[name] = { staffName: name, count: 0, revenue: 0 };
      }
      map[name].count += 1;
      map[name].revenue += order.totalAmount;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [orders]);

  // Copy plain text summary
  const handleCopyReportText = () => {
    const lines = [
      `✦ 夜蒔館 YASHI MANOR · 當日營業紀錄報表 ✦`,
      `營業日期：${settlement.date}`,
      `結算狀態：${settlement.isSettled ? `已結算 (結算者: ${settlement.settledBy})` : '營業進行中 (預估)'}`,
      `────────────────────────────`,
      `【營業額與財務核算】`,
      `· 總營業額：${settlement.totalRevenue.toLocaleString('en-US')} Gil`,
      `· 餐飲總額：${settlement.foodRevenue.toLocaleString('en-US')} Gil`,
      `· 食物總成本：${settlement.foodCost.toLocaleString('en-US')} Gil`,
      `· 食物純利潤：${settlement.foodProfit.toLocaleString('en-US')} Gil`,
      `────────────────────────────`,
      `【特色餐與侍奉服務抽成】`,
      `· 特色餐點：${settlement.specialtyCount} 份 (計入薪資池 ${settlement.specialtyPool.toLocaleString('en-US')} Gil)`,
      `· 指名聊天：${settlement.chatSessions} 節 (計入薪資池 ${settlement.chatPool.toLocaleString('en-US')} Gil)`,
      `· 客製簽繪：${settlement.sketchCount} 張 (計入薪資池 ${settlement.sketchPool.toLocaleString('en-US')} Gil)`,
      `· 純拍照留影：${settlement.photoCount} 次 (計入薪資池 ${settlement.photoPool.toLocaleString('en-US')} Gil)`,
      `────────────────────────────`,
      `【當日薪資池與權重】`,
      `· 薪資池總額：${settlement.totalPool.toLocaleString('en-US')} Gil`,
      `· 全店總權重：${settlement.totalShopWeight} (工時 ${settlement.totalStaffMinutes} 分 + 加成 ${settlement.totalBonusWeight})`,
      `· 每權重價值：${Math.round(settlement.valuePerWeight).toLocaleString('en-US')} Gil / 分鐘`,
      `────────────────────────────`,
      `【侍從薪酬核發列表】`,
      ...settlement.payouts.map(p => 
        `· ${p.staffName}：${p.totalWeight} 權重 -> 薪資 ${p.estimatedSalary.toLocaleString('en-US')} Gil + 指定小費 ${p.designatedTips.toLocaleString('en-US')} Gil = 實領 ${p.totalIncome.toLocaleString('en-US')} Gil`
      )
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += '項目,數值,單位／備註\n';
    csvContent += `營業日期,${settlement.date},-\n`;
    csvContent += `總營業額,${settlement.totalRevenue},Gil\n`;
    csvContent += `餐飲營業額,${settlement.foodRevenue},Gil\n`;
    csvContent += `食物總成本,${settlement.foodCost},Gil\n`;
    csvContent += `食物純利潤,${settlement.foodProfit},Gil\n`;
    csvContent += `特色餐數量,${settlement.specialtyCount},份\n`;
    csvContent += `特色餐抽成,${settlement.specialtyPool},Gil\n`;
    csvContent += `指名聊天節數,${settlement.chatSessions},節\n`;
    csvContent += `指名聊天抽成,${settlement.chatPool},Gil\n`;
    csvContent += `客製簽繪張數,${settlement.sketchCount},張\n`;
    csvContent += `客製簽繪抽成,${settlement.sketchPool},Gil\n`;
    csvContent += `純拍留影次數,${settlement.photoCount},次\n`;
    csvContent += `純拍留影抽成,${settlement.photoPool},Gil\n`;
    csvContent += `全店小費總額,${settlement.tipsTotal},Gil\n`;
    csvContent += `薪資池總額,${settlement.totalPool},Gil\n`;
    csvContent += `全店總權重,${settlement.totalShopWeight},權重\n`;
    csvContent += `每權重價值,${Math.round(settlement.valuePerWeight)},Gil/分\n\n`;

    csvContent += '侍從名稱,角色,工作分鐘,才藝加成,總權重,薪資,指定小費,實領所得\n';
    for (const p of settlement.payouts) {
      csvContent += `${p.staffName},${p.role},${p.workMinutes},${p.bonusWeight},${p.totalWeight},${p.estimatedSalary},${p.designatedTips},${p.totalIncome}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YashiManor_Report_${settlement.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F1F8] border border-[#BFD7EE] flex items-center justify-center shrink-0 text-[#245280]">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-[#5B88B4] font-semibold">
                BUSINESS ANALYTICS & REPORTS
              </span>
              <h1 className="font-manor text-xl font-bold text-slate-800 mt-0.5">
                夜蒔館 營業報表與排行統計
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                彙整總營業額、餐飲成本淨利、特別服務抽成、小費、人氣餐點排行與侍從招待表現。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyReportText}
              className="px-3.5 py-2 bg-[#F4EFE6] hover:bg-[#EBE3D5] text-slate-700 rounded-xl text-xs font-medium border border-[#DFD6C7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#5B88B4]" />}
              <span>{copied ? '已複製簡報！' : '複製文字報表'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>匯出 CSV 試算表</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">總營業額 (Total Revenue)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-slate-800 mt-1 block">
            {formatGil(settlement.totalRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            餐飲 + 特殊服務 + 心意小費
          </span>
        </div>

        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">食物材料總成本 (Food Cost)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-rose-700 mt-1 block">
            {formatGil(settlement.foodCost)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            FF14 市場食材成本扣除
          </span>
        </div>

        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">一般食物淨利潤 (Food Profit)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-emerald-700 mt-1 block">
            {formatGil(settlement.foodProfit)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            全數納入當日薪資池
          </span>
        </div>

        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">心意小費總計 (Tips)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-amber-700 mt-1 block">
            {formatGil(settlement.tipsTotal)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            指定 {formatGil(settlement.tipsDesignated)} / 共同 {formatGil(settlement.tipsShared)}
          </span>
        </div>
      </div>

      {/* Special Services Breakdown Cards */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAE3D6]">
          <Sparkles className="w-4 h-4 text-[#5B88B4]" />
          <h2 className="font-manor text-base font-semibold text-slate-800">
            特色餐與特別侍奉服務抽成統計 (Service Commission Matrix)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Specialty Dish */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-800 block">夜蒔特調特色餐</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-slate-800">{settlement.specialtyCount}</span>
              <span className="text-xs text-slate-500">份</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#EAE3D6] text-xs flex justify-between">
              <span className="text-slate-500">薪資池抽成</span>
              <span className="font-mono font-semibold text-[#245280]">{formatGil(settlement.specialtyPool)}</span>
            </div>
          </div>

          {/* Nominated Chat */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-800 block">指名深度聊天</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-slate-800">{settlement.chatSessions}</span>
              <span className="text-xs text-slate-500">節 (共 {settlement.chatSessions * 20} 分)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#EAE3D6] text-xs flex justify-between">
              <span className="text-slate-500">薪資池抽成</span>
              <span className="font-mono font-semibold text-[#245280]">{formatGil(settlement.chatPool)}</span>
            </div>
          </div>

          {/* Sketch */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-800 block">客製紀念簽繪</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-slate-800">{settlement.sketchCount}</span>
              <span className="text-xs text-slate-500">張</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#EAE3D6] text-xs flex justify-between">
              <span className="text-slate-500">薪資池抽成</span>
              <span className="font-mono font-semibold text-[#245280]">{formatGil(settlement.sketchPool)}</span>
            </div>
          </div>

          {/* Photo */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-800 block">純拍照留影</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold font-mono text-slate-800">{settlement.photoCount}</span>
              <span className="text-xs text-slate-500">次</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#EAE3D6] text-xs flex justify-between">
              <span className="text-slate-500">薪資池抽成</span>
              <span className="font-mono font-semibold text-[#245280]">{formatGil(settlement.photoPool)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings: Popular Dishes & Staff Receptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Popular Food & Beverage Ranking */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAE3D6]">
            <UtensilsCrossed className="w-4 h-4 text-[#5B88B4]" />
            <h2 className="font-manor text-base font-semibold text-slate-800">
              館內人氣餐飲熱門排行 (Popular Dishes)
            </h2>
          </div>

          {foodRanking.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">今日尚無餐點銷售紀錄</div>
          ) : (
            <div className="space-y-2.5">
              {foodRanking.slice(0, 7).map((item, idx) => (
                <div
                  key={item.name}
                  className="p-3 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl flex items-center justify-between text-xs shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-mono font-bold ${
                      idx === 0 ? 'bg-amber-400 text-slate-900' :
                      idx === 1 ? 'bg-slate-300 text-slate-900' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-[#EAE3D6] text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-500">{item.quantity} 份</span>
                    <span className="font-mono font-semibold text-[#245280] w-24 text-right">
                      {formatGil(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Receptions Leaderboard */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAE3D6]">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="font-manor text-base font-semibold text-slate-800">
              侍從接待人次與營業排行 (Staff Performance)
            </h2>
          </div>

          {staffReceptionStats.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">今日尚無接待紀錄</div>
          ) : (
            <div className="space-y-2.5">
              {staffReceptionStats.map((st, idx) => (
                <div
                  key={st.staffName}
                  className="p-3 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl flex items-center justify-between text-xs shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-mono font-bold ${
                      idx === 0 ? 'bg-amber-400 text-slate-900' :
                      idx === 1 ? 'bg-slate-300 text-slate-900' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-[#EAE3D6] text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{st.staffName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-500">{st.count} 席接待</span>
                    <span className="font-mono font-semibold text-amber-800 w-24 text-right">
                      {formatGil(st.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
