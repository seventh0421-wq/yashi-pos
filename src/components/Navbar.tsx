import { useState, useEffect, useMemo } from 'react';
import { Staff, AttendanceRecord, BusinessHoursConfig } from '../types';
import { isCurrentlyBusinessHours } from '../lib/calculations';
import { YashiEmblem } from './YashiEmblem';
import { 
  ClipboardList, 
  Clock, 
  Coins, 
  BarChart3, 
  Store, 
  Sliders, 
  LogOut, 
  UserCheck, 
  Play, 
  Square
} from 'lucide-react';

interface NavbarProps {
  currentStaff: Staff | null;
  currentAttendance: AttendanceRecord | undefined;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClockIn: () => void;
  onClockOut: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  isClocking: boolean;
  unsettledOrdersCount: number;
  businessHours?: BusinessHoursConfig;
}

export function Navbar({
  currentStaff,
  currentAttendance,
  activeTab,
  setActiveTab,
  onClockIn,
  onClockOut,
  onLogout,
  onOpenLogin,
  isClocking,
  unsettledOrdersCount,
  businessHours,
}: NavbarProps) {
  const isWorking = currentAttendance && !currentAttendance.clockOutTime;
  const isManager = currentStaff?.role === 'manager';
  const isOpen = isCurrentlyBusinessHours(businessHours);

  // Live real-world time (LT) clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const realTimeStr = useMemo(() => {
    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    const ss = String(currentTime.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [currentTime]);

  const navItems = [
    { id: 'dashboard', label: '接待櫃台', icon: ClipboardList, badge: unsettledOrdersCount > 0 ? unsettledOrdersCount : undefined },
    { id: 'attendance', label: '出勤打卡', icon: Clock },
    { id: 'salary', label: '薪資試算', icon: Coins },
    { id: 'reports', label: '營業報表', icon: BarChart3 },
    { id: 'settlement', label: '閉店結算', icon: Store },
    ...(isManager ? [{ id: 'admin', label: '店長後台', icon: Sliders }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-[#EAE3D6] shadow-xs px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <YashiEmblem className="w-9 h-9 transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-manor text-base md:text-lg font-bold tracking-wider text-slate-800 group-hover:text-[#5B88B4] transition-colors flex items-center gap-2">
              夜蒔館
              <span className="text-xs font-normal tracking-widest text-[#5B88B4] font-sans uppercase">YASHI MANOR</span>
            </span>
            <span className="text-[10px] text-slate-500 tracking-wider">STAFF POS · 執事女僕咖啡廳</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-[#245280] bg-[#E8F1F8] border border-[#BFD7EE] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#F3ECE1]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono bg-[#D7E8F7] text-[#245280] border border-[#BFD7EE] rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Staff Profile & Quick Attendance Control */}
        <div className="flex items-center gap-3 shrink-0">
          {currentStaff ? (
            <div className="flex items-center gap-2">
              {/* Working Status Badge, Clock toggle & Real-world Time underneath */}
              <div className="hidden sm:flex flex-col items-center justify-center gap-0.5 pr-2.5 border-r border-[#EAE3D6]">
                {isWorking ? (
                  <button
                    onClick={onClockOut}
                    disabled={isClocking}
                    title="點擊打卡下班"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-colors group cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:hidden" />
                    <Square className="w-3 h-3 hidden group-hover:block text-rose-500" />
                    <span className="group-hover:hidden font-medium">上班中</span>
                    <span className="hidden group-hover:inline font-medium">打卡下班</span>
                  </button>
                ) : (
                  <button
                    onClick={onClockIn}
                    disabled={isClocking}
                    title="點擊打卡上班"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F4EFE6] border border-[#DFD6C7] text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-slate-500" />
                    <span>開始上班</span>
                  </button>
                )}
                {/* 現實時間 (LT) 顯示在上班中正下方 */}
                <div 
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-500 leading-none mt-0.5 select-none"
                  title="現實時間 (Local Time)"
                >
                  <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span>LT {realTimeStr}</span>
                </div>
              </div>

              {/* Staff Avatar & Info */}
              <button 
                onClick={onOpenLogin}
                title="點擊切換侍從帳號"
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#DFD6C7] hover:border-[#688EB5] hover:bg-white transition-all text-left cursor-pointer shadow-xs"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#D5CABB] bg-slate-100 shrink-0">
                  <img src={currentStaff.avatar} alt={currentStaff.name} className="w-full h-full object-cover" />
                </div>
                <div className="hidden lg:flex flex-col leading-none">
                  <span className="text-xs font-medium text-slate-800">{currentStaff.name}</span>
                  <span className="text-[10px] text-[#5B88B4] font-medium mt-0.5">{currentStaff.roleTitle}</span>
                </div>
                <UserCheck className="w-3.5 h-3.5 text-slate-400 hover:text-[#5B88B4] ml-0.5" />
              </button>

              <button
                onClick={onLogout}
                title="登出帳號"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 text-xs font-medium rounded-xl bg-[#5B88B4] hover:bg-[#4C78A3] text-white shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              店員登入
            </button>
          )}
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden flex items-center justify-around pt-2 mt-2 border-t border-[#EAE3D6] overflow-x-auto text-xs">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors shrink-0 ${
                isActive ? 'text-[#245280] font-semibold bg-[#E8F1F8]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
