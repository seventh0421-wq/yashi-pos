import { useState } from 'react';
import { Staff } from '../types';
import { YashiEmblem } from './YashiEmblem';
import { Lock, KeyRound, User, ShieldCheck, Sparkles, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface StaffLoginScreenProps {
  staffList: Staff[];
  onLogin: (username?: string, password?: string, staffId?: string, newPassword?: string) => Promise<void>;
  isModal?: boolean;
  onClose?: () => void;
  currentStaffId?: string;
}

export function StaffLoginScreen({
  staffList,
  onLogin,
  isModal = false,
  onClose,
  currentStaffId,
}: StaffLoginScreenProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [mode, setMode] = useState<'cards' | 'manual'>('cards');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeStaffList = staffList.filter(s => s.isActive);

  const handleSelectStaffCard = (staff: Staff) => {
    setSelectedStaff(staff);
    setUsername(staff.username);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleBackToSelection = () => {
    setSelectedStaff(null);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetStaff = selectedStaff || activeStaffList.find(
      s => s.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!targetStaff && mode === 'manual') {
      if (!username.trim()) {
        setError('請輸入店員帳號');
        return;
      }
    }

    const isFirstTime = targetStaff ? !targetStaff.hasSetPassword : false;

    // First time password setup validation
    if (isFirstTime) {
      if (!newPassword) {
        setError('請輸入欲設定的專屬新密碼');
        return;
      }
      if (newPassword.length < 2) {
        setError('密碼長度至少需 2 個字元');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('兩次輸入的新密碼不一致，請重新確認');
        return;
      }

      setIsLoading(true);
      try {
        await onLogin(targetStaff?.username || username.trim(), undefined, targetStaff?.id, newPassword);
        if (onClose) onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '首次設定密碼並登入失敗');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Returning staff login with password
    if (!password) {
      setError('請輸入登入密碼');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(targetStaff?.username || username.trim(), password, targetStaff?.id);
      if (onClose) onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '密碼驗證失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className={`w-full ${isModal ? 'max-w-xl' : 'max-w-2xl'} bg-white border border-[#DFD6C7] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in duration-300`}>
      {/* Brand Header */}
      <div className="bg-gradient-to-b from-[#FAF7F2] to-white px-6 sm:px-8 pt-8 pb-6 border-b border-[#EAE3D6] text-center relative">
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-[#F3ECE1] rounded-xl transition-colors cursor-pointer text-xs"
          >
            ✕ 關閉
          </button>
        )}
        <div className="flex justify-center mb-3">
          <YashiEmblem className="w-14 h-14" />
        </div>
        <span className="text-[11px] uppercase tracking-widest text-[#5B88B4] font-semibold block">
          YASHI MANOR · STAFF ENTRANCE
        </span>
        <h1 className="font-manor text-2xl font-bold text-slate-800 mt-1">
          夜蒔館 侍從身分認證登入
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
          {selectedStaff 
            ? (selectedStaff.hasSetPassword ? '請輸入您的專屬密碼以完成驗證' : '首次到館：請為您的帳號自訂專屬密碼')
            : '本系統為夜蒔館內部接待與點餐專用，請選擇您的侍從身分以進入系統。'
          }
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 animate-in fade-in">
            <span className="shrink-0 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Staff Selection View */}
        {!selectedStaff && (
          <div className="space-y-5">
            {/* Mode switch pills */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#245280] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#5B88B4]" />
                點選您的侍從帳號
              </span>
              <div className="flex items-center gap-1 bg-[#F1ECE1] p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setMode('cards')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    mode === 'cards' ? 'bg-white text-[#245280] font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  侍從頭像
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    mode === 'manual' ? 'bg-white text-[#245280] font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  帳號輸入
                </button>
              </div>
            </div>

            {mode === 'cards' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {activeStaffList.map(staff => {
                  const isCurrent = staff.id === currentStaffId;
                  const isManager = staff.role === 'manager';
                  const isFirstTime = !staff.hasSetPassword;

                  return (
                    <button
                      key={staff.id}
                      onClick={() => handleSelectStaffCard(staff)}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center transition-all cursor-pointer group hover:scale-[1.02] ${
                        isCurrent
                          ? 'border-[#5B88B4] bg-[#E8F1F8] shadow-xs ring-2 ring-[#5B88B4]/20'
                          : 'border-[#E8E2D7] bg-[#FAF8F5] hover:border-[#5B88B4] hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#DFD6C7] bg-[#F1ECE1] mb-2 relative shadow-xs group-hover:border-[#5B88B4] transition-colors">
                        <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        {isManager && (
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" title="總管店長" />
                        )}
                      </div>

                      <span className="text-xs font-semibold text-slate-800 truncate w-full group-hover:text-[#245280]">
                        {staff.name}
                      </span>
                      <span className="text-[10px] text-[#5B88B4] font-medium mt-0.5">
                        {staff.roleTitle}
                      </span>

                      {/* Status Tag */}
                      <div className="mt-2">
                        {isFirstTime ? (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100/90 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            首次登入
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            密碼登入
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Manual Username Input */
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    店員專屬帳號 (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="例如：lyco / luco / lili / melon..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const matched = activeStaffList.find(s => s.username.toLowerCase() === username.trim().toLowerCase());
                    if (matched) {
                      handleSelectStaffCard(matched);
                    } else if (username.trim()) {
                      setError('找不到此帳號，請確認後重試');
                    } else {
                      setError('請先輸入帳號');
                    }
                  }}
                  className="w-full py-2.5 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>下一步：驗證身分</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Authentication Form for Selected Staff */}
        {selectedStaff && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-bottom-2 duration-200">
            {/* Selected Profile Banner */}
            <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D7] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#5B88B4] bg-[#F1ECE1] shrink-0">
                  <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">{selectedStaff.name}</span>
                    <span className="text-[10px] bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE] px-2 py-0.5 rounded-full font-medium">
                      {selectedStaff.roleTitle}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    帳號代碼：@{selectedStaff.username}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackToSelection}
                className="text-xs text-[#5B88B4] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>切換侍從</span>
              </button>
            </div>

            {/* If First-Time Login: Set Password Mode */}
            {!selectedStaff.hasSetPassword ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>首次登入認證 · 自訂專屬密碼</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    歡迎來到夜蒔館！此帳號目前為首次啟用，請於下方自訂您的個人登入密碼，未來登入時皆需以此密碼驗證。
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    設定專屬新密碼 (New Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="請輸入欲設定的密碼 (至少 2 碼)"
                      autoFocus
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    再次確認新密碼 (Confirm Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="請再次輸入相同的密碼以供確認"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full py-3 bg-[#5B88B4] hover:bg-[#4C78A3] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#5B88B4]/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? '設定並登入中...' : '完成密碼設定並進入夜蒔館'}</span>
                </button>
              </div>
            ) : (
              /* Returning Staff: Enter Existing Password Mode */
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      侍從專屬密碼 (Password)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      若忘記密碼請聯繫店長重設
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="請輸入您的專屬密碼"
                      autoFocus
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#FAF8F5] border border-[#DFD6C7] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B88B4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full py-3 bg-[#5B88B4] hover:bg-[#4C78A3] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#5B88B4]/20"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? '驗證密碼中...' : '驗證密碼並進入夜蒔館'}</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Footer copyright */}
      <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE3D6] text-center text-[11px] text-slate-400">
        夜蒔館 YASHI MANOR · 侍從 POS 管理系統 · 請妥善保管個人密碼
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  // Full-screen entry landing page
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {content}
    </div>
  );
}
