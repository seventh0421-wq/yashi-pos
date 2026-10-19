import { useState } from 'react';
import { BusinessHoursConfig } from '../types';
import { isCurrentlyBusinessHours } from '../lib/calculations';
import { Clock, ShieldCheck, Check, Sparkles, Moon, Sun, AlertTriangle } from 'lucide-react';

interface AdminBusinessHoursViewProps {
  businessHours: BusinessHoursConfig;
  onUpdateBusinessHours: (updates: Partial<BusinessHoursConfig>) => Promise<void>;
}

export function AdminBusinessHoursView({
  businessHours,
  onUpdateBusinessHours
}: AdminBusinessHoursViewProps) {
  const [startTime, setStartTime] = useState(businessHours?.startTime || '20:00');
  const [endTime, setEndTime] = useState(businessHours?.endTime || '00:00');
  const [enabled, setEnabled] = useState(businessHours?.enabled ?? true);
  const [autoClockIn, setAutoClockIn] = useState(businessHours?.autoClockInOnLogin ?? true);
  const [statusOverride, setStatusOverride] = useState<'auto' | 'force_open' | 'force_closed'>(
    businessHours?.statusOverride || 'auto'
  );
  const [crossMidnight, setCrossMidnight] = useState(businessHours?.crossMidnight ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isOpenNow = isCurrentlyBusinessHours({
    enabled,
    startTime,
    endTime,
    crossMidnight,
    statusOverride,
    autoClockInOnLogin: autoClockIn
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateBusinessHours({
        enabled,
        startTime,
        endTime,
        crossMidnight,
        statusOverride,
        autoClockInOnLogin: autoClockIn
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F1F8] border border-[#BFD7EE] flex items-center justify-center shrink-0 text-[#245280]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-[#5B88B4] font-semibold">
                BUSINESS HOURS & WORK TIME RULES
              </span>
              <h2 className="font-manor text-lg font-bold text-slate-800 mt-0.5">
                夜蒔館 營業時間與工時限制設定
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                設定館內正式對外接待營業時段。啟用後，<strong>店員在營業時間外登入或打卡將不會計算工時</strong>，僅在營業期限內的時間方會累計工時與薪資權重。
              </p>
            </div>
          </div>

          {/* Current Live Status Pill */}
          <div className="shrink-0 flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isOpenNow 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              {isOpenNow ? <Sun className="w-4 h-4 text-emerald-600 animate-spin" /> : <Moon className="w-4 h-4 text-amber-600" />}
              <span>{isOpenNow ? '館內營業中 (工時累計中)' : '非營業時間 (不計算工時)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-[#EAE3D6] pb-4 flex items-center justify-between">
          <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5B88B4]" />
            營業時段與工時規則配置
          </h3>
          <span className="text-xs text-slate-400">總管店長管理權限</span>
        </div>

        {/* 1. Main Toggle: 啟用營業時間限制 */}
        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">啟用「僅在營業時段內計算工時」限制</span>
              <span className="text-[10px] bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE] px-2 py-0.5 rounded-full font-medium">
                推薦啟用
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              開啟後，店員若在非營業時間登入（例如白天查閱菜單、離峰時間查看報表），系統不會累積工作時間。只有在設定的營業期間內才會累積有效工時。
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B88B4]"></div>
          </label>
        </div>

        {/* 2. Business Hours Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              營業開始時間 (Start Time)：
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-xl text-slate-800 text-sm font-mono focus:outline-none focus:border-[#5B88B4]"
            />
            <p className="text-[11px] text-slate-400">
              例如：20:00 (晚上 8 點開館接待)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              營業結束時間 (End Time)：
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-xl text-slate-800 text-sm font-mono focus:outline-none focus:border-[#5B88B4]"
            />
            <p className="text-[11px] text-slate-400">
              例如：00:00 (跨夜至午夜) 或 01:00 (凌晨 1 點)
            </p>
          </div>
        </div>

        {/* 3. Cross Midnight & Auto Clock In */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-800 block">跨夜營業 (Cross Midnight)</span>
              <span className="text-[11px] text-slate-500">結束時間跨至隔日清晨 (如 20:00 至 01:00)</span>
            </div>
            <input
              type="checkbox"
              checked={crossMidnight || endTime < startTime}
              onChange={e => setCrossMidnight(e.target.checked)}
              className="w-4 h-4 accent-[#5B88B4] rounded cursor-pointer"
            />
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-800 block">營業時段登入自動打卡</span>
              <span className="text-[11px] text-slate-500">侍從於營業時間登入時自動建立上班打卡</span>
            </div>
            <input
              type="checkbox"
              checked={autoClockIn}
              onChange={e => setAutoClockIn(e.target.checked)}
              className="w-4 h-4 accent-[#5B88B4] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 4. Manual Status Override */}
        <div className="space-y-2 pt-2 border-t border-[#EAE3D6]">
          <label className="block text-xs font-medium text-slate-700">
            營業狀態強制覆寫 (Status Override)：
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setStatusOverride('auto')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                statusOverride === 'auto'
                  ? 'bg-[#E8F1F8] border-[#BFD7EE] text-[#245280] font-semibold'
                  : 'bg-[#FAF8F5] border-[#DFD6C7] text-slate-600 hover:bg-white'
              }`}
            >
              <span className="block font-medium">⚡ 自動模式 (Auto)</span>
              <span className="text-[11px] text-slate-500 font-normal">依設定時間自動判定營業狀態</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusOverride('force_open')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                statusOverride === 'force_open'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                  : 'bg-[#FAF8F5] border-[#DFD6C7] text-slate-600 hover:bg-white'
              }`}
            >
              <span className="block font-medium">✨ 強制營業中 (Force Open)</span>
              <span className="text-[11px] text-slate-500 font-normal">臨時加開活動或提早開席時使用</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusOverride('force_closed')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                statusOverride === 'force_closed'
                  ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                  : 'bg-[#FAF8F5] border-[#DFD6C7] text-slate-600 hover:bg-white'
              }`}
            >
              <span className="block font-medium">🌙 強制非營業 (Force Closed)</span>
              <span className="text-[11px] text-slate-500 font-normal">公休日或休館清潔時全日不計工時</span>
            </button>
          </div>
        </div>

        {/* 5. Rule Explanation Card */}
        <div className="p-4 bg-[#E8F1F8] border border-[#BFD7EE] rounded-xl space-y-2 text-xs text-slate-700">
          <span className="font-semibold text-[#245280] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#5B88B4]" />
            夜蒔館工時計算機制範例說明
          </span>
          <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
            <li><strong>營業外登入：</strong>若營業時間為 20:00～00:00，侍從在下午 14:00 或 18:30 登入，非營業期間累計工時為 <strong>0 分鐘</strong>。</li>
            <li><strong>提前打卡就緒：</strong>若侍從於 19:30 提前打卡準備，工時將自動於 <strong>20:00 正式營業起</strong> 開始計算。</li>
            <li><strong>延遲下班保護：</strong>若侍從於打烊後（如凌晨 02:00）才補打卡下班，系統會自動在營業結束時間（00:00）截止計算，不產生虛增時數。</li>
          </ul>
        </div>

        {/* Save button row */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" />
              營業時段與工時限制已儲存成功！
            </span>
          ) : <div />}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#5B88B4] hover:bg-[#4C78A3] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            {isSaving ? '儲存中...' : '儲存營業時間設定'}
          </button>
        </div>
      </form>
    </div>
  );
}
