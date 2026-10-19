import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Staff, ReceptionOrder, MenuItem, BusinessHoursConfig } from './types';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { OrderDetailView } from './components/OrderDetailView';
import { AttendanceView } from './components/AttendanceView';
import { SalaryView } from './components/SalaryView';
import { ReportsView } from './components/ReportsView';
import { SettlementView } from './components/SettlementView';
import { AdminView } from './components/AdminView';
import { ReceptionModal } from './components/ReceptionModal';
import { LoginModal } from './components/LoginModal';
import { StaffLoginScreen } from './components/StaffLoginScreen';
import { YashiEmblem } from './components/YashiEmblem';
import { Check, AlertCircle } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  // Enforce login first when entering the site: only persist in active sessionStorage
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(() => {
    return sessionStorage.getItem('yashi_current_staff_id') || null;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);

  // UI state
  const [isClocking, setIsClocking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Derive currentStaff reliably from appState and currentStaffId (must be strictly authenticated)
  const currentStaff = useMemo(() => {
    if (!appState || !appState.staffList || appState.staffList.length === 0 || !currentStaffId) return null;
    return appState.staffList.find(s => s.id === currentStaffId && s.isActive) || null;
  }, [appState, currentStaffId]);

  // Keep sessionStorage in sync with currentStaffId
  useEffect(() => {
    if (currentStaffId) {
      sessionStorage.setItem('yashi_current_staff_id', currentStaffId);
      localStorage.setItem('yashi_current_staff_id', currentStaffId);
    } else {
      sessionStorage.removeItem('yashi_current_staff_id');
      localStorage.removeItem('yashi_current_staff_id');
    }
  }, [currentStaffId]);

  // Fetch full state from backend
  const fetchState = useCallback(async (isInitial = false) => {
    try {
      const data = await api.getState();
      setAppState(data);
      setError(null);
    } catch (err) {
      console.error('Fetch state error:', err);
      if (isInitial) setError('無法連接後端資料庫，請重新整理頁面');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState(true);

    // Live multi-device polling sync every 4 seconds
    const interval = setInterval(() => {
      fetchState(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchState]);

  // Auth: Login / Switch Staff
  const handleSelectStaff = async (
    username?: string, 
    password?: string, 
    staffId?: string, 
    newPassword?: string
  ) => {
    try {
      const res = await api.login(username, password, staffId, newPassword);
      setCurrentStaffId(res.staff.id);
      sessionStorage.setItem('yashi_current_staff_id', res.staff.id);
      localStorage.setItem('yashi_current_staff_id', res.staff.id);
      
      // If switching to non-manager while on admin tab, switch to dashboard
      if (res.staff.role !== 'manager' && activeTab === 'admin') {
        setActiveTab('dashboard');
      }
      
      if (newPassword || res.isFirstLogin) {
        showToast(`🎉 歡迎！密碼已設定成功，已登入：${res.staff.name} (${res.staff.roleTitle})`);
      } else {
        showToast(`已成功登入：${res.staff.name} (${res.staff.roleTitle})`);
      }
      setShowLoginModal(false);
      await fetchState(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登入失敗';
      showToast(msg);
      throw err;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('yashi_current_staff_id');
    localStorage.removeItem('yashi_current_staff_id');
    setCurrentStaffId(null);
    setShowLoginModal(false);
    showToast('已登出侍從帳號');
  };

  const handleResetStaffPassword = async (staffId: string) => {
    try {
      const res = await api.resetStaffPassword(staffId);
      showToast(res.message || '已將員工重設為首次登入狀態');
      await fetchState(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '重設密碼失敗');
    }
  };

  // Attendance: Clock In & Clock Out
  const handleClockIn = async (staffId?: string) => {
    const targetId = staffId || currentStaff?.id;
    if (!targetId) return;
    setIsClocking(true);
    try {
      await api.clockIn(targetId);
      const staff = appState?.staffList.find(s => s.id === targetId);
      showToast(`${staff?.name || '侍從'} 開始上班打卡成功！`);
      await fetchState(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '打卡上班失敗');
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async (staffId?: string) => {
    const targetId = staffId || currentStaff?.id;
    if (!targetId) return;
    setIsClocking(true);
    try {
      await api.clockOut(targetId);
      const staff = appState?.staffList.find(s => s.id === targetId);
      showToast(`${staff?.name || '侍從'} 結束上班打卡成功，工時已計入薪資權重。`);
      await fetchState(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : '打卡下班失敗');
    } finally {
      setIsClocking(false);
    }
  };

  const handleUpdateAttendance = async (id: string, updates: Record<string, unknown>) => {
    await api.updateAttendance(id, updates);
    showToast('已更新打卡出勤紀錄');
    await fetchState(false);
  };

  // Orders: Create, Update, Checkout, Reopen
  const handleCreateOrder = async (data: { guestName: string; assignedStaffId: string; tableNo?: string; notes?: string }) => {
    const newOrder = await api.createOrder(data);
    showToast(`已為 ${newOrder.guestName} 開立接待單（桌號：${newOrder.tableNo}）`);
    await fetchState(false);
    setSelectedOrderId(newOrder.id);
  };

  const handleUpdateOrder = async (order: ReceptionOrder, isServiceUpdate?: boolean) => {
    await api.updateOrder(order.id, { ...order, isServiceUpdate });
    await fetchState(false);
  };

  const handleCheckoutOrder = async (orderId: string) => {
    const checked = await api.checkoutOrder(orderId);
    showToast(`貴賓 ${checked.guestName} 已完成結帳！`);
    await fetchState(false);
  };

  const handleReopenOrder = async (orderId: string) => {
    await api.reopenOrder(orderId);
    showToast('店長已解鎖單據，可進行修改');
    await fetchState(false);
  };

  // Menu: Add & Update
  const handleUpdateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    await api.updateMenuItem(id, updates);
    showToast('商品資料已更新');
    await fetchState(false);
  };

  const handleAddMenuItem = async (item: Partial<MenuItem>) => {
    await api.addMenuItem(item);
    showToast('已新增餐點項目');
    await fetchState(false);
  };

  // Staff: Add & Update
  const handleAddStaff = async (staff: Partial<Staff> & { password?: string }) => {
    await api.addStaff(staff);
    showToast('已新增侍從帳號');
    await fetchState(false);
  };

  const handleUpdateStaff = async (id: string, updates: Partial<Staff> & { password?: string }) => {
    await api.updateStaff(id, updates);
    showToast('侍從帳號資料已更新');
    await fetchState(false);
  };

  // Bonuses: Add & Delete
  const handleAddBonus = async (staffId: string, title: string, weightMinutes: number, recordedBy: string) => {
    await api.addBonus(staffId, title, weightMinutes, recordedBy);
    showToast('已登記才藝／演出加成權重');
    await fetchState(false);
  };

  const handleDeleteBonus = async (id: string) => {
    await api.deleteBonus(id);
    showToast('已刪除加成項目');
    await fetchState(false);
  };

  // Day Settlement: Close & Reopen
  const handleCloseDay = async (settledBy: string) => {
    await api.closeSettlement(settledBy);
    showToast('當日閉店結算已完成，全日營業單據已鎖定！');
    await fetchState(false);
  };

  const handleReopenDay = async () => {
    await api.reopenSettlement();
    showToast('店長已解除閉店鎖定，可重新核對');
    await fetchState(false);
  };

  // Backup & Reset
  const handleImportBackup = async (imported: AppState) => {
    await api.importBackup(imported);
    showToast('已成功還原備份資料！');
    await fetchState(false);
  };

  const handleResetBackup = async () => {
    await api.resetBackup();
    showToast('已重置為官方預設示範資料！');
    await fetchState(false);
  };

  const handleUpdateBusinessHours = async (updates: Partial<BusinessHoursConfig>) => {
    await api.updateBusinessHours(updates);
    showToast('已更新夜蒔館營業時段與工時規則');
    await fetchState(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center text-slate-600 space-y-4">
        <YashiEmblem className="w-16 h-16 animate-pulse" />
        <div className="font-manor text-base font-semibold tracking-widest text-[#245280]">
          夜 蒔 館 · YASHI MANOR
        </div>
        <p className="text-xs text-slate-400">正在連接店鋪即時資料庫...</p>
      </div>
    );
  }

  if (error || !appState) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-6 text-slate-700">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-base font-semibold text-slate-800">{error || '系統載入異常'}</h2>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs"
        >
          重新整理
        </button>
      </div>
    );
  }

  // First entrance barrier: if staff is not logged in, enforce staff login first
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex flex-col justify-center items-center p-4">
        <StaffLoginScreen
          staffList={appState.staffList}
          onLogin={handleSelectStaff}
          isModal={false}
        />
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 border border-[#BFD7EE] text-slate-800 rounded-xl shadow-lg backdrop-blur-md text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Find attendance record for current staff
  const currentAttendance = appState.attendance.find(a => a.staffId === currentStaff.id);

  const selectedOrder = selectedOrderId 
    ? appState.orders.find(o => o.id === selectedOrderId) 
    : null;

  const unsettledOrdersCount = appState.orders.filter(o => o.status !== 'settled').length;

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-slate-800 flex flex-col selection:bg-sky-200 selection:text-sky-900">
      
      {/* Navbar */}
      <Navbar
        currentStaff={currentStaff}
        currentAttendance={currentAttendance}
        activeTab={selectedOrderId ? 'order_detail' : activeTab}
        setActiveTab={tab => {
          setSelectedOrderId(null);
          setActiveTab(tab);
        }}
        onClockIn={() => handleClockIn()}
        onClockOut={() => handleClockOut()}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
        isClocking={isClocking}
        unsettledOrdersCount={unsettledOrdersCount}
        businessHours={appState.businessHours}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* If Order is selected, show OrderDetailView regardless of tab */}
        {selectedOrder ? (
          <OrderDetailView
            order={selectedOrder}
            menu={appState.menu}
            staffList={appState.staffList}
            currentStaff={currentStaff}
            onBack={() => setSelectedOrderId(null)}
            onUpdateOrder={handleUpdateOrder}
            onCheckout={handleCheckoutOrder}
            onReopen={handleReopenOrder}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                currentStaff={currentStaff}
                currentAttendance={currentAttendance}
                orders={appState.orders}
                staffList={appState.staffList}
                onOpenNewReception={() => setShowReceptionModal(true)}
                onSelectOrder={o => setSelectedOrderId(o.id)}
                onOpenLogin={() => setShowLoginModal(true)}
                businessHours={appState.businessHours}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceView
                currentStaff={currentStaff}
                attendanceList={appState.attendance}
                staffList={appState.staffList}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onUpdateAttendance={handleUpdateAttendance}
                isClocking={isClocking}
                businessHours={appState.businessHours}
              />
            )}

            {activeTab === 'salary' && (
              <SalaryView
                currentStaff={currentStaff}
                settlement={appState.settlement}
                bonuses={appState.bonuses}
                staffList={appState.staffList}
                onAddBonus={handleAddBonus}
                onDeleteBonus={handleDeleteBonus}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                settlement={appState.settlement}
                orders={appState.orders}
                staffList={appState.staffList}
                menu={appState.menu}
              />
            )}

            {activeTab === 'settlement' && (
              <SettlementView
                settlement={appState.settlement}
                orders={appState.orders}
                attendanceList={appState.attendance}
                staffList={appState.staffList}
                bonuses={appState.bonuses}
                currentStaff={currentStaff}
                onCloseDay={handleCloseDay}
                onReopenDay={handleReopenDay}
                onNavigateToOrder={o => setSelectedOrderId(o.id)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminView
                appState={appState}
                onUpdateMenuItem={handleUpdateMenuItem}
                onAddMenuItem={handleAddMenuItem}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onImportBackup={handleImportBackup}
                onResetBackup={handleResetBackup}
                onUpdateBusinessHours={handleUpdateBusinessHours}
                onResetStaffPassword={handleResetStaffPassword}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 border border-[#BFD7EE] text-slate-800 rounded-xl shadow-lg backdrop-blur-md text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Reception Creation Modal */}
      <ReceptionModal
        isOpen={showReceptionModal}
        onClose={() => setShowReceptionModal(false)}
        staffList={appState.staffList}
        currentStaff={currentStaff}
        onCreate={handleCreateOrder}
      />

      {/* Staff Login / Switch Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        staffList={appState.staffList}
        onSelectStaff={handleSelectStaff}
        currentStaffId={currentStaff?.id}
      />

      {/* Footer */}
      <footer className="border-t border-[#EAE3D6] py-4 px-6 text-center text-[11px] text-slate-400 bg-[#F5F2EB]/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-manor text-slate-600">夜蒔館 YASHI MANOR · STAFF POS V1.0</span>
          <span>FF14 RP 女僕／執事咖啡廳接待與薪酬結算系統 · 全裝置即時同步</span>
        </div>
      </footer>
    </div>
  );
}
