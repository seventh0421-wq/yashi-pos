import { useState } from 'react';
import { 
  Staff, 
  DaySettlementData, 
  TalentBonus, 
  StaffPayout 
} from '../types';
import { formatGil } from '../lib/format';
import { 
  Coins, 
  HelpCircle, 
  Award, 
  Plus, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';

interface SalaryViewProps {
  currentStaff: Staff | null;
  settlement: DaySettlementData;
  bonuses: TalentBonus[];
  staffList: Staff[];
  onAddBonus: (staffId: string, title: string, weightMinutes: number, recordedBy: string) => Promise<void>;
  onDeleteBonus: (id: string) => Promise<void>;
}

export function SalaryView({
  currentStaff,
  settlement,
  bonuses,
  staffList,
  onAddBonus,
  onDeleteBonus,
}: SalaryViewProps) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showAddBonusModal, setShowAddBonusModal] = useState(false);
  const [bonusStaffId, setBonusStaffId] = useState(currentStaff?.id || staffList[0]?.id || '');
  const [bonusTitle, setBonusTitle] = useState('古典鋼琴演奏加成');
  const [bonusWeight, setBonusWeight] = useState(30);

  const isManager = currentStaff?.role === 'manager';
  const isSettled = settlement.isSettled;

  // Personal payout for current staff
  const personalPayout = settlement.payouts.find(p => p.staffId === currentStaff?.id);
  const personalBonuses = bonuses.filter(b => b.staffId === currentStaff?.id);

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusTitle || !bonusWeight) return;
    await onAddBonus(
      bonusStaffId,
      bonusTitle.trim(),
      Number(bonusWeight),
      currentStaff?.name || '店長'
    );
    setShowAddBonusModal(false);
    setBonusTitle('');
  };

  const presetBonuses = [
    { title: '大廳豎琴演奏', weight: 45 },
    { title: '女僕特調魔術秀', weight: 30 },
    { title: '即興小提琴合奏', weight: 30 },
    { title: '迎賓開場典禮致詞', weight: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#5B88B4] font-semibold">
                  SALARY SETTLEMENT & WEIGHT SYSTEM
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-medium ${
                  isSettled 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                    : 'bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE]'
                }`}>
                  {isSettled ? '閉店結算完成 · 最終薪資' : '營業進行中 · 即時預估薪資'}
                </span>
              </div>
              <h1 className="font-manor text-xl font-bold text-slate-800 mt-1">
                侍從薪資與權重試算
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                當日餐飲淨利與特色餐／特殊服務抽成全額納入「當日薪資池」，依全員工作分鐘與才藝加成權重均勻核發。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="px-3.5 py-2 bg-[#F4EFE6] hover:bg-[#EBE3D5] text-slate-700 rounded-xl text-xs font-medium border border-[#DFD6C7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#5B88B4]" />
              <span>薪資計算規則與範例</span>
            </button>

            {isManager && (
              <button
                onClick={() => setShowAddBonusModal(true)}
                className="px-4 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>登記才藝加成</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pool & System Weight Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pool Total */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">當日總薪資池 (Pool)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-amber-700 mt-1 block">
            {formatGil(settlement.totalPool)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            食物利潤 + 各項服務抽成
          </span>
        </div>

        {/* Total Shop Weight */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">全店總權重 (Total Weight)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-[#245280] mt-1 block">
            {settlement.totalShopWeight} 權重
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            工時 {settlement.totalStaffMinutes} 分 + 加成 {settlement.totalBonusWeight}
          </span>
        </div>

        {/* Value per weight */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">每權重價值 (Value / Min)</span>
          <span className="text-xl lg:text-2xl font-bold font-mono text-emerald-700 mt-1 block">
            {Math.round(settlement.valuePerWeight).toLocaleString('en-US')} Gil / 分
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            總薪資池 ÷ 全店總權重
          </span>
        </div>

        {/* Settlement Status */}
        <div className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">薪資計算狀態</span>
          <span className={`text-base font-bold mt-1 block ${isSettled ? 'text-emerald-700' : 'text-[#245280]'}`}>
            {isSettled ? '已完成結算 (最終)' : '營業中 (預估)'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isSettled ? `結算者: ${settlement.settledBy}` : '待閉店結算確認鎖定'}
          </span>
        </div>
      </div>

      {/* Personal Salary Breakdown Card */}
      {personalPayout && (
        <div className="bg-gradient-to-br from-[#FAF8F5] to-[#EAF2F8] border border-[#BFD7EE] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D6]">
            <div>
              <span className="text-xs text-[#245280] font-semibold uppercase tracking-wider">
                PERSONAL SALARY · 個人當日所得
              </span>
              <h2 className="font-manor text-lg font-bold text-slate-800 mt-0.5">
                {currentStaff?.name} 的當日薪酬明細
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">
                {isSettled ? '最終實領薪酬' : '當前即時預估薪酬'}
              </span>
              <span className="font-mono text-2xl font-bold text-emerald-700">
                {formatGil(personalPayout.totalIncome)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">今日實際工作分鐘</span>
              <span className="font-mono text-base font-semibold text-slate-800 mt-0.5 block">
                {personalPayout.workMinutes} 分鐘
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">才藝／表演加成權重</span>
              <span className="font-mono text-base font-semibold text-amber-700 mt-0.5 block">
                +{personalPayout.bonusWeight} 權重
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">個人總薪資權重</span>
              <span className="font-mono text-base font-semibold text-[#245280] mt-0.5 block">
                {personalPayout.totalWeight} 權重
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">個人指定小費收入</span>
              <span className="font-mono text-base font-semibold text-rose-700 mt-0.5 block">
                {formatGil(personalPayout.designatedTips)}
              </span>
            </div>
          </div>

          {/* Personal Talent Bonuses breakdown */}
          {personalBonuses.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#EAE3D6] text-xs">
              <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                個人登記加成項目：
              </span>
              <div className="flex flex-wrap gap-2">
                {personalBonuses.map(b => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{b.title}</span>
                    <strong className="font-mono text-amber-800">+{b.weightMinutes} 權重</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Staff Salaries Table */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <h2 className="font-manor text-base font-semibold text-slate-800">
              {isManager ? '全員薪資權重分派清單 (All Staff Payouts)' : '當日出勤侍從薪資試算'}
            </h2>
          </div>
          {isManager && (
            <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              店長可核閱全員工時與薪資權重
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3D6] text-slate-500">
                <th className="pb-3 font-medium">侍從名稱</th>
                <th className="pb-3 font-medium">角色</th>
                <th className="pb-3 font-medium text-right">工作分鐘</th>
                <th className="pb-3 font-medium text-right">才藝加成</th>
                <th className="pb-3 font-medium text-right">總權重</th>
                <th className="pb-3 font-medium text-right">{isSettled ? '最終薪資' : '預估薪資'}</th>
                <th className="pb-3 font-medium text-right">指定小費</th>
                <th className="pb-3 font-medium text-right font-bold text-slate-800">實領總計 (Gil)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D6]">
              {settlement.payouts.map(p => (
                <tr key={p.staffId} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 font-medium text-slate-800">{p.staffName}</td>
                  <td className="py-3 text-slate-500 capitalize">{p.role}</td>
                  <td className="py-3 font-mono text-right text-slate-700">{p.workMinutes} 分</td>
                  <td className="py-3 font-mono text-right text-amber-700 font-medium">
                    {p.bonusWeight > 0 ? `+${p.bonusWeight}` : '-'}
                  </td>
                  <td className="py-3 font-mono text-right text-[#245280] font-semibold">{p.totalWeight}</td>
                  <td className="py-3 font-mono text-right text-emerald-700 font-semibold">
                    {formatGil(p.estimatedSalary)}
                  </td>
                  <td className="py-3 font-mono text-right text-rose-700">
                    {p.designatedTips > 0 ? formatGil(p.designatedTips) : '-'}
                  </td>
                  <td className="py-3 font-mono text-right font-bold text-slate-900 text-sm">
                    {formatGil(p.totalIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Talent Bonuses List & Management */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="font-manor text-base font-semibold text-slate-800">
              才藝／特殊表演加成清單 (Performance Bonuses)
            </h2>
          </div>
          {isManager && (
            <button
              onClick={() => setShowAddBonusModal(true)}
              className="text-xs text-[#5B88B4] hover:text-[#38658E] font-medium cursor-pointer"
            >
              + 登記加成
            </button>
          )}
        </div>

        {bonuses.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            今日尚未登記任何才藝加成
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bonuses.map(b => (
              <div
                key={b.id}
                className="p-3 bg-[#FAF8F5] border border-[#E8E2D7] rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">{b.title}</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    獲取者：<span className="text-[#245280] font-medium">{b.staffName}</span> · 登記：{b.recordedBy}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-800 px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                    +{b.weightMinutes} 權重
                  </span>
                  {isManager && (
                    <button
                      onClick={() => onDeleteBonus(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="刪除加成"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Formula Explanation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                夜蒔館 薪資計算規則與規格書範例
              </h3>
              <button onClick={() => setShowFormulaModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] space-y-1.5 font-mono text-[11px]">
                <div className="text-[#245280] font-semibold font-sans">【薪資計算公式 (規格書 13)】</div>
                <div>當日薪資池 = 食物淨利 + 特色餐抽成 + 指名抽成 + 簽繪抽成 + 純拍抽成</div>
                <div>全店總權重 = 全體上班分鐘總和 + 全員才藝特殊加成</div>
                <div>每權重價值 = 當日薪資池 ÷ 全店總權重</div>
                <div className="text-emerald-700 font-semibold">個人當日薪資 = 每權重價值 × (個人工作分鐘 + 個人加成)</div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] space-y-1 font-mono text-[11px]">
                <div className="text-amber-800 font-semibold font-sans">【規格書 14 驗證範例】</div>
                <div>食物利潤：100,000 Gil</div>
                <div>特色餐 8份 × 10,000 = 80,000 Gil</div>
                <div>指名聊天 2節 × 60,000 = 120,000 Gil</div>
                <div>客製簽繪 2張 × 20,000 = 40,000 Gil</div>
                <div>純拍留影 2次 × 10,000 = 20,000 Gil</div>
                <div className="border-t border-[#EAE3D6] pt-1 text-slate-900 font-bold">
                  當日薪資池 = 360,000 Gil
                </div>
                <div className="pt-1 text-slate-600">
                  假設 5 位員工各上班 120 分鐘無加成：總權重 = 600
                </div>
                <div className="text-emerald-700">
                  每權重 = 360,000 ÷ 600 = 600 Gil
                </div>
                <div className="text-emerald-800 font-bold">
                  萊可 (Lyco) 薪資 = 600 × 120 = 72,000 Gil
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                ＊小費獨立統計，若客人指定給特定侍從，將直接全額併入該侍從所得，不混入餐飲食物淨利。
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 text-xs bg-[#F4EFE6] hover:bg-[#EBE3D5] text-slate-700 rounded-lg cursor-pointer"
              >
                了解關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Talent Bonus Modal */}
      {showAddBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                登記才藝／表演加成
              </h3>
              <button onClick={() => setShowAddBonusModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBonus} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">獲取加成侍從：</label>
                <select
                  value={bonusStaffId}
                  onChange={e => setBonusStaffId(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                >
                  {staffList.filter(s => s.isActive).map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.roleTitle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">加成演出名稱：</label>
                <input
                  type="text"
                  required
                  value={bonusTitle}
                  onChange={e => setBonusTitle(e.target.value)}
                  placeholder="例如：古典豎琴演奏、特調演出、迎賓加成..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presetBonuses.map(pb => (
                    <button
                      type="button"
                      key={pb.title}
                      onClick={() => {
                        setBonusTitle(pb.title);
                        setBonusWeight(pb.weight);
                      }}
                      className="px-2 py-0.5 text-[11px] bg-[#FAF8F5] hover:bg-[#F3ECE1] text-slate-700 rounded border border-[#DFD6C7] cursor-pointer"
                    >
                      {pb.title} (+{pb.weight})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">薪資權重加成 (等效分鐘數)：</label>
                <input
                  type="number"
                  required
                  min={5}
                  step={5}
                  value={bonusWeight}
                  onChange={e => setBonusWeight(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBonusModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#5B88B4] hover:bg-[#4C78A3] text-white font-medium rounded-lg shadow-xs cursor-pointer"
                >
                  確認登記加成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
