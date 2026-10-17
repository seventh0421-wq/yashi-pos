import { useState } from 'react';
import { Staff } from '../types';
import { X, UserPlus, Clock, Coffee } from 'lucide-react';

interface ReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  currentStaff: Staff | null;
  onCreate: (data: { guestName: string; assignedStaffId: string; tableNo?: string; notes?: string }) => Promise<void>;
}

export function ReceptionModal({
  isOpen,
  onClose,
  staffList,
  currentStaff,
  onCreate,
}: ReceptionModalProps) {
  const [guestName, setGuestName] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState(currentStaff?.id || staffList[0]?.id || '');
  const [tableNo, setTableNo] = useState('薔薇席 01');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('請輸入主人／大小姐稱呼');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onCreate({
        guestName: guestName.trim(),
        assignedStaffId: assignedStaffId || currentStaff?.id || staffList[0]?.id,
        tableNo: tableNo.trim(),
        notes: notes.trim()
      });
      setGuestName('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '建立接待單失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetTitles = ['主人', '大小姐', '少爺', '貴賓'];
  const presetTables = ['薔薇席 01', '薔薇席 02', '水晶廊 01', '水晶廊 02', '月光包廂', '洋館沙發區'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white border border-[#E8E2D7] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE3D6] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#5B88B4]" />
            <div>
              <h2 className="font-manor text-base font-semibold text-slate-800">新增客人接待 (New Reception)</h2>
              <p className="text-xs text-slate-500">登記主人／大小姐入館資訊與擔當侍從</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-[#F3ECE1] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Guest Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              主人／大小姐名稱 <span className="text-rose-600 font-bold">*必填</span>
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="例如：愛蜜莉雅 大小姐 / 阿爾芬 主人"
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
            />
            {/* Quick Title append pills */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500">快速後綴：</span>
              {presetTitles.map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => {
                    if (!guestName.includes(t)) {
                      setGuestName(prev => (prev ? `${prev} ${t}` : t));
                    }
                  }}
                  className="px-2 py-0.5 text-[11px] bg-[#FAF8F5] hover:bg-[#F3ECE1] text-slate-700 rounded border border-[#DFD6C7] transition-colors cursor-pointer"
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Staff */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              擔當侍從 (Assigned Staff)
            </label>
            <select
              value={assignedStaffId}
              onChange={e => setAssignedStaffId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 focus:outline-none focus:border-[#5B88B4]"
            >
              {staffList.filter(s => s.isActive).map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.roleTitle})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">預設為當前登入侍從，可指派其他當席同仁</p>
          </div>

          {/* Table / Seating */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              入席桌號／位置 (Table / Salon)
            </label>
            <input
              type="text"
              value={tableNo}
              onChange={e => setTableNo(e.target.value)}
              placeholder="例如：薔薇席 01"
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetTables.map(tbl => (
                <button
                  type="button"
                  key={tbl}
                  onClick={() => setTableNo(tbl)}
                  className={`px-2 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${
                    tableNo === tbl
                      ? 'bg-[#E8F1F8] border-[#BFD7EE] text-[#245280] font-medium'
                      : 'bg-[#FAF8F5] border-[#DFD6C7] text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              接待備註 (Optional Notes)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如：慶祝光之戰士回歸、喜好微甜花果茶、忌香菜..."
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4] resize-none"
            />
          </div>

          {/* Minimum spend prompt */}
          <div className="p-3 bg-[#EAF2F8] border border-[#BFD7EE] rounded-lg flex items-start gap-2 text-xs text-[#245280]">
            <Coffee className="w-4 h-4 shrink-0 mt-0.5 text-[#5B88B4]" />
            <div>
              <span className="font-semibold">入席最低消費：30,000 Gil</span>
              <p className="text-[11px] text-slate-600 mt-0.5">本館每位貴賓基本低消門檻，單據結帳時將自動核對提醒。</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !guestName.trim()}
              className="px-5 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '開立接待中...' : '開立接待單並入座'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
