import {
  Staff,
  AttendanceRecord,
  ReceptionOrder,
  TalentBonus,
  DaySettlementData,
  StaffPayout,
  BusinessHoursConfig
} from '../types';

/**
 * 取得指定日期的營業時段起訖 Date 物件 (支援跨夜)
 */
export function getBusinessHoursRange(
  dateStr: string,
  config?: BusinessHoursConfig
): { start: Date; end: Date } {
  const startTime = config?.startTime || '20:00';
  const endTime = config?.endTime || '00:00';

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, startH || 0, startM || 0, 0, 0);

  // 判斷是否跨越午夜
  const isCross = config?.crossMidnight || endH < startH || (endH === startH && endM <= startM) || (endH === 0 && endM === 0);
  const endDay = isCross ? d + 1 : d;
  const effectiveEndH = (endH === 24) ? 0 : endH;
  const end = new Date(y, m - 1, endDay, effectiveEndH || 0, endM || 0, 0, 0);

  return { start, end };
}

/**
 * 計算打卡出勤紀錄在「營業時間內」的有效工作分鐘數
 * 若於營業時間外登入/打卡，在非營業時間期間不累計工時，僅在營業期限內才計算
 */
export function calculateEffectiveWorkMinutes(
  record: { clockInTime: string; clockOutTime: string | null; date: string; minutesWorked?: number },
  config?: BusinessHoursConfig,
  referenceNow: Date = new Date()
): { effectiveMinutes: number; isOutsideBusinessHours: boolean } {
  if (!config || !config.enabled) {
    // 未啟用營業時間限制時，計算原始全時段工時
    const startMs = new Date(record.clockInTime).getTime();
    const endMs = record.clockOutTime ? new Date(record.clockOutTime).getTime() : referenceNow.getTime();
    return {
      effectiveMinutes: Math.max(0, Math.floor((endMs - startMs) / (1000 * 60))),
      isOutsideBusinessHours: false
    };
  }

  // 強制休息/非營業覆寫
  if (config.statusOverride === 'force_closed') {
    return { effectiveMinutes: 0, isOutsideBusinessHours: true };
  }

  // 強制營業覆寫
  if (config.statusOverride === 'force_open') {
    const startMs = new Date(record.clockInTime).getTime();
    const endMs = record.clockOutTime ? new Date(record.clockOutTime).getTime() : referenceNow.getTime();
    return {
      effectiveMinutes: Math.max(0, Math.floor((endMs - startMs) / (1000 * 60))),
      isOutsideBusinessHours: false
    };
  }

  const { start: bizStart, end: bizEnd } = getBusinessHoursRange(record.date, config);
  const clockInMs = new Date(record.clockInTime).getTime();
  const clockOutMs = record.clockOutTime 
    ? new Date(record.clockOutTime).getTime() 
    : referenceNow.getTime();

  // 若打卡時間完全落在營業結束之後，或下班時間在營業開始之前，有效工時為 0
  if (clockInMs >= bizEnd.getTime() || clockOutMs <= bizStart.getTime()) {
    return { effectiveMinutes: 0, isOutsideBusinessHours: true };
  }

  // 取交集 (只計算營業時段內的工時)
  const overlapStart = Math.max(clockInMs, bizStart.getTime());
  const overlapEnd = Math.min(clockOutMs, bizEnd.getTime());

  const effectiveMs = Math.max(0, overlapEnd - overlapStart);
  const effectiveMinutes = Math.floor(effectiveMs / (1000 * 60));

  return {
    effectiveMinutes,
    isOutsideBusinessHours: effectiveMinutes === 0
  };
}

/**
 * 判斷當下是否正處於夜蒔館營業時段中
 */
export function isCurrentlyBusinessHours(
  config?: BusinessHoursConfig,
  currentDateStr?: string,
  now: Date = new Date()
): boolean {
  if (!config || !config.enabled) return true;
  if (config.statusOverride === 'force_open') return true;
  if (config.statusOverride === 'force_closed') return false;

  const todayStr = currentDateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // 檢查當日營業時段
  const todayRange = getBusinessHoursRange(todayStr, config);
  if (now.getTime() >= todayRange.start.getTime() && now.getTime() < todayRange.end.getTime()) {
    return true;
  }

  // 檢查前一日是否跨夜至今日清晨
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const yesterdayRange = getBusinessHoursRange(yesterdayStr, config);
  if (now.getTime() >= yesterdayRange.start.getTime() && now.getTime() < yesterdayRange.end.getTime()) {
    return true;
  }

  return false;
}

export function calculateDaySettlement(
  date: string,
  staffList: Staff[],
  attendanceList: AttendanceRecord[],
  orders: ReceptionOrder[],
  bonuses: TalentBonus[],
  isSettled: boolean = false,
  settledAt?: string,
  settledBy?: string,
  businessHours?: BusinessHoursConfig
): DaySettlementData {
  // Only calculate orders for the given date (default entryTime starts with date, or all active if single day system)
  const dayOrders = orders.filter(o => o.entryTime.startsWith(date));
  
  // Calculate revenues
  let foodRevenue = 0;
  let foodCost = 0;
  let foodProfit = 0;

  let specialtyCount = 0;
  let specialtyPool = 0;
  let specialtyRevenue = 0;

  let chatSessions = 0;
  let chatPool = 0;
  let chatRevenue = 0;

  let sketchCount = 0;
  let sketchPool = 0;
  let sketchRevenue = 0;

  let photoCount = 0;
  let photoPool = 0;
  let photoRevenue = 0;

  let tipsTotal = 0;
  let tipsShared = 0;
  let tipsDesignated = 0;
  const staffTipsMap: Record<string, number> = {};

  for (const order of dayOrders) {
    // Process items
    for (const item of order.items) {
      const lineTotal = item.unitPrice * item.quantity;
      if (item.category === 'specialty') {
        specialtyRevenue += lineTotal;
        specialtyCount += item.quantity;
        specialtyPool += (item.poolShare || 10000) * item.quantity;
      } else {
        foodRevenue += lineTotal;
        const lineCost = (item.cost || 0) * item.quantity;
        foodCost += lineCost;
        foodProfit += (lineTotal - lineCost);
      }
    }

    // Process services
    for (const service of order.services) {
      if (service.serviceType === 'chat') {
        const count = service.sessions || 1;
        chatSessions += count;
        chatRevenue += service.price;
        chatPool += (service.poolShare || 60000);
      } else if (service.serviceType === 'sketch') {
        const count = service.quantity || 1;
        sketchCount += count;
        sketchRevenue += service.price;
        sketchPool += (service.poolShare || (20000 * count));
      } else if (service.serviceType === 'photo') {
        const count = service.quantity || 1;
        photoCount += count;
        photoRevenue += service.price;
        photoPool += (service.poolShare || (10000 * count));
      }
    }

    // Process tips
    if (order.tip && order.tip.amount > 0) {
      tipsTotal += order.tip.amount;
      if (order.tip.type === 'designated' && order.tip.designatedStaffId) {
        tipsDesignated += order.tip.amount;
        staffTipsMap[order.tip.designatedStaffId] = 
          (staffTipsMap[order.tip.designatedStaffId] || 0) + order.tip.amount;
      } else {
        tipsShared += order.tip.amount;
      }
    }
  }

  const totalRevenue = foodRevenue + specialtyRevenue + chatRevenue + sketchRevenue + photoRevenue + tipsTotal;
  const totalPool = foodProfit + specialtyPool + chatPool + sketchPool + photoPool;

  // Calculate staff working minutes & bonus weights
  const dayAttendance = attendanceList.filter(a => a.date === date);
  const dayBonuses = bonuses.filter(b => b.date === date);

  let totalStaffMinutes = 0;
  let totalBonusWeight = 0;

  // Build payout structures
  const payouts: StaffPayout[] = [];

  for (const staff of staffList) {
    if (!staff.isActive) continue;

    // Find attendance record
    const att = dayAttendance.find(a => a.staffId === staff.id);
    let workMinutes = 0;
    if (att) {
      if (att.clockOutTime) {
        const calc = calculateEffectiveWorkMinutes(att, businessHours);
        workMinutes = calc.effectiveMinutes;
      } else if (att.clockInTime) {
        // Still working: compute effective minutes from clock-in to now within business hours
        const calc = calculateEffectiveWorkMinutes(att, businessHours, new Date());
        workMinutes = calc.effectiveMinutes;
      }
    }

    // Staff bonuses
    const staffBonusItems = dayBonuses.filter(b => b.staffId === staff.id);
    const bonusWeight = staffBonusItems.reduce((sum, b) => sum + b.weightMinutes, 0);

    const totalWeight = workMinutes + bonusWeight;
    totalStaffMinutes += workMinutes;
    totalBonusWeight += bonusWeight;

    payouts.push({
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      workMinutes,
      bonusWeight,
      totalWeight,
      estimatedSalary: 0, // will compute after totalShopWeight
      designatedTips: staffTipsMap[staff.id] || 0,
      totalIncome: 0,
    });
  }

  const totalShopWeight = totalStaffMinutes + totalBonusWeight;
  const valuePerWeight = totalShopWeight > 0 ? totalPool / totalShopWeight : 0;

  for (const p of payouts) {
    p.estimatedSalary = Math.round(p.totalWeight * valuePerWeight);
    p.totalIncome = p.estimatedSalary + p.designatedTips;
  }

  return {
    date,
    isSettled,
    settledAt,
    settledBy,
    totalRevenue,
    foodRevenue: foodRevenue + specialtyRevenue,
    foodCost,
    foodProfit,
    specialtyCount,
    specialtyPool,
    chatSessions,
    chatPool,
    sketchCount,
    sketchPool,
    photoCount,
    photoPool,
    totalPool,
    totalStaffMinutes,
    totalBonusWeight,
    totalShopWeight,
    valuePerWeight,
    tipsTotal,
    tipsShared,
    tipsDesignated,
    payouts,
  };
}
