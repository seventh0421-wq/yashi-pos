export type UserRole = 'manager' | 'maid' | 'butler';

export interface Staff {
  id: string;
  name: string;
  avatar: string;
  username: string;
  role: UserRole;
  roleTitle: string; // e.g. "總管店長", "女僕侍從", "執事侍從"
  isActive: boolean;
  passwordHash?: string;
  hasSetPassword?: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // ISO
  clockOutTime: string | null; // ISO
  minutesWorked: number;
  note?: string;
}

export type MenuCategory = 
  | 'drink'           // 飲品
  | 'main'            // 主餐
  | 'dessert_salad'   // 甜點／沙拉
  | 'set'             // 套餐
  | 'specialty'       // 特色餐點
  | 'service';        // 特別侍奉服務

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number; // Gil
  cost: number;  // Gil (0 for services)
  poolShare: number; // Gil added directly to salary pool (e.g. specialty 10000, chat 60000)
  recommendedStaffId?: string;
  recommendedStaffName?: string;
  isAvailable: boolean;
  description?: string;
  ruleNote?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  category: MenuCategory;
  unitPrice: number;
  cost: number;
  poolShare: number;
  quantity: number;
  note?: string;
  recommendedStaffId?: string;
  recommendedStaffName?: string;
}

export type ServiceStatus = 'pending' | 'in_progress' | 'completed';

export interface SpecialServiceEntry {
  id: string;
  serviceType: 'chat' | 'sketch' | 'photo';
  name: string; // 指名聊天, 簽繪, 純拍照留影
  staffId: string;
  staffName: string;
  price: number;
  poolShare: number;
  status: ServiceStatus;
  sessions?: number; // 1 or 2 sessions (20 min each) for chat
  quantity?: number; // 簽繪張數、拍照留影次數
  startedAt?: string; // ISO timestamp
  endsAt?: string; // ISO timestamp
  note?: string;
}

export interface OrderTip {
  amount: number;
  type: 'shared' | 'designated';
  designatedStaffId?: string;
  designatedStaffName?: string;
}

export type ReceptionStatus = 
  | 'active'          // 接待中
  | 'pending_service' // 等待服務
  | 'in_service'      // 特殊服務中
  | 'pending_bill'    // 待結帳
  | 'settled';        // 已結帳

export interface ReceptionOrder {
  id: string;
  orderNumber: string;
  guestName: string; // 主人／大小姐名稱
  assignedStaffId: string; // 擔當侍從
  assignedStaffName: string;
  tableNo?: string;
  entryTime: string; // ISO
  settledTime?: string; // ISO
  status: ReceptionStatus;
  items: OrderItem[];
  services: SpecialServiceEntry[];
  tip: OrderTip;
  foodSubtotal: number;
  servicesSubtotal: number;
  totalAmount: number;
  foodProfit: number;
  poolContribution: number;
  notes?: string;
  isLocked: boolean;
}

export interface TalentBonus {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  weightMinutes: number; // 等效分鐘數
  date: string;
  recordedBy: string;
  createdAt: string;
}

export interface StaffPayout {
  staffId: string;
  staffName: string;
  role: UserRole;
  workMinutes: number;
  bonusWeight: number;
  totalWeight: number;
  estimatedSalary: number;
  designatedTips: number;
  totalIncome: number;
}

export interface DaySettlementData {
  date: string;
  isSettled: boolean;
  settledAt?: string;
  settledBy?: string;
  totalRevenue: number;
  foodRevenue: number;
  foodCost: number;
  foodProfit: number;
  specialtyCount: number;
  specialtyPool: number;
  chatSessions: number;
  chatPool: number;
  sketchCount: number;
  sketchPool: number;
  photoCount: number;
  photoPool: number;
  totalPool: number;
  totalStaffMinutes: number;
  totalBonusWeight: number;
  totalShopWeight: number;
  valuePerWeight: number;
  tipsTotal: number;
  tipsShared: number;
  tipsDesignated: number;
  payouts: StaffPayout[];
}

export interface BusinessHoursConfig {
  enabled: boolean;                      // 是否啟用營業時段工時限制
  startTime: string;                    // 營業開始時間 (HH:mm)，預設 "20:00"
  endTime: string;                      // 營業結束時間 (HH:mm)，預設 "00:00"
  crossMidnight: boolean;               // 是否跨夜營業
  statusOverride: 'auto' | 'force_open' | 'force_closed'; // 營業狀態強制覆寫
  autoClockInOnLogin: boolean;          // 營業時段內登入時是否自動打卡上班
}

export interface AppState {
  currentStaff: Staff | null;
  staffList: Staff[];
  attendance: AttendanceRecord[];
  menu: MenuItem[];
  orders: ReceptionOrder[];
  bonuses: TalentBonus[];
  settlement: DaySettlementData;
  systemDate: string; // YYYY-MM-DD
  version: number;
  businessHours: BusinessHoursConfig;
}
