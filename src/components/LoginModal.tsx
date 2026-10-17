import { useState } from 'react';
import { Staff } from '../types';
import { YashiEmblem } from './YashiEmblem';
import { X, Lock, KeyRound, User, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  onSelectStaff: (username?: string, password?: string, staffId?: string) => Promise<void>;
  currentStaffId?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  staffList,
  onSelectStaff,
  currentStaffId,
}: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      await onSelectStaff(username.trim(), password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (staff: Staff) => {
    setError('');
    setIsLoading(true);
    try {
      await onSelectStaff(staff.username, undefined, staff.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '切換店員失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white border border-[#E8E2D7] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE3D6] bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <YashiEmblem className="w-8 h-8" />
            <div>
              <h2 className="font-manor text-base font-semibold text-slate-800">店員登入與身分切換</h2>
              <p className="text-xs text-slate-500">點選侍從頭像即可立即切換身分</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-[#F3ECE1] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Quick Staff Switch Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#245280] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5B88B4]" />
                一鍵切換侍從／店長
              </span>
              <span className="text-[11px] text-slate-400">點選直接登入</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {staffList.filter(s => s.isActive).map(staff => {
                const isSelected = staff.id === currentStaffId;
                const isManager = staff.role === 'manager';
                return (
                  <button
                    key={staff.id}
                    onClick={() => handleQuickLogin(staff)}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#5B88B4] bg-[#E8F1F8] shadow-xs'
                        : 'border-[#E8E2D7] bg-[#FAF8F5] hover:border-[#5B88B4] hover:bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#DFD6C7] bg-[#F1ECE1] mb-2 relative shadow-xs">
                      <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                      {isManager && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" title="管理員" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-800 truncate w-full">{staff.name}</span>
                    <span className="text-[10px] text-[#4F7A9F] font-medium mt-0.5">{staff.roleTitle}</span>
                    {isSelected && (
                      <span className="text-[9px] text-[#245280] font-semibold mt-1 bg-[#D3E5F5] px-1.5 py-0.2 rounded-full">
                        當前在用
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE3D6]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400">或使用自訂帳號登入</span>
            </div>
          </div>

          {/* Form manual login */}
          <form onSubmit={handleManualLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">店員帳號 (Username)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="lyco / luco / lili / melon..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">登入密碼 (Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="預設為 yashi123"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full py-2.5 px-4 bg-[#5B88B4] hover:bg-[#4C78A3] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? '登入驗證中...' : '確認登入'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
