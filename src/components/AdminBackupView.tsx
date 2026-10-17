import { useState, useRef } from 'react';
import { AppState } from '../types';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2 
} from 'lucide-react';

interface AdminBackupViewProps {
  appState: AppState;
  onImportBackup: (imported: AppState) => Promise<void>;
  onResetBackup: () => Promise<void>;
}

export function AdminBackupView({
  appState,
  onImportBackup,
  onResetBackup,
}: AdminBackupViewProps) {
  const [statusMessage, setStatusMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `YashiManor_Backup_${appState.systemDate}_v${appState.version || 1}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatusMessage('已成功匯出全站 JSON 備份檔！');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await onImportBackup(parsed);
        setStatusMessage('成功匯入備份資料！');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (err) {
        alert('匯入失敗，請確認檔案格式是否正確: ' + String(err));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = async () => {
    if (!confirm('確定要重置為預設示範資料嗎？此動作將還原預設菜單、打卡與初始接待單。')) return;
    setIsResetting(true);
    try {
      await onResetBackup();
      setStatusMessage('已成功重置為夜蒔館官方預設示範資料！');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#EAE3D6]">
        <h2 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#5B88B4]" />
          資料備份、匯入與系統重置 (Data Backup & Recovery)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          夜蒔館營業紀錄、薪資權重與菜單資料安全維護，支援離線保存與跨環境復原。
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Export JSON Card */}
        <div className="p-5 bg-white border border-[#E8E2D7] rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#E8F1F8] text-[#245280] flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">匯出 JSON 備份檔</h3>
            <p className="text-xs text-slate-500 mt-1">
              將所有員工帳號、菜單設定、打卡出勤、接待單據與結算數據完整匯出成單一 JSON 檔案。
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="w-full py-2.5 px-4 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>下載完整資料備份 (JSON)</span>
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="p-5 bg-white border border-[#E8E2D7] rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#EFF2FD] text-[#485392] flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">匯入還原備份</h3>
            <p className="text-xs text-slate-500 mt-1">
              上傳先前由系統匯出的 JSON 備份檔，將營業狀態與單據還原至該時點。
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-[#F4EFE6] hover:bg-[#EAE2D3] text-slate-700 border border-[#DFD6C7] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>選擇 JSON 檔案上傳還原</span>
            </button>
          </div>
        </div>

        {/* Reset Demo Data Card */}
        <div className="p-5 bg-white border border-[#E8E2D7] rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">重置預設示範資料</h3>
            <p className="text-xs text-slate-500 mt-1">
              將系統初始化還原至官方規格書 V1.0 之原始商品定價、示範出勤人員與接待範例。
            </p>
          </div>
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isResetting ? '重置中...' : '重置為官方預設資料'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
