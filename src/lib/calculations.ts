import {
  Staff,
  AttendanceRecord,
  ReceptionOrder,
  TalentBonus,
  DaySettlementData,
  StaffPayout,
  BusinessHoursConfig
} from '../types';

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  enabled: true,
  startTime: '20:00',
  endTime: '02:00'
};

export function isCurrentlyInBusinessHours(
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS,
  now: Date = new Date()
): boolean {
  if (!config || !config.enabled) return true;
  const [startH, startM] = (config.startTime || '20:00').split(':').map(Number);
  const [endH, endM] = (config.endTime || '02:00').split(':').map(Number);
  const curMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if (endMin > startMin) {
    return curMinutes >= startMin && curMinutes < endMin;
  } else if (endMin < startMin) {
    // Crosses midnight, e.g. 20:00 to 02:00
    return curMinutes >= startMin || curMinutes < endMin;
  } else {
    return true;
  }
}

/**
 * Calculates effective work minutes strictly bounded to business hours.
 * If employee logs in outside business hours, time outside business hours is 0.
 * Only time strictly within the business hours window is counted as work minutes.
 */
export function calculateAttendanceMinutes(
  clockInIso: string,
  clockOutIso: string | null,
  _recordDate?: string,
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS,
  nowMs: number = Date.now()
): number {
  if (!clockInIso) return 0;
  const startMs = new Date(clockInIso).getTime();
  const endMs = clockOutIso ? new Date(clockOutIso).getTime() : nowMs;

  if (endMs <= startMs) return 0;

  if (!config || !config.enabled) {
    return Math.max(0, Math.floor((endMs - startMs) / 60000));
  }

  const [startH, startM] = (config.startTime || '20:00').split(':').map(Number);
  const [endH, endM] = (config.endTime || '02:00').split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  let count = 0;
  // Step through minutes in the work window
  for (let t = startMs; t < endMs; t += 60000) {
    const d = new Date(t);
    const m = d.getHours() * 60 + d.getMinutes();
    const inWindow = endMin > startMin 
      ? (m >= startMin && m < endMin) 
      : endMin < startMin
      ? (m >= startMin || m < endMin)
      : true;
    if (inWindow) count++;
  }

  return count;
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
  businessHours: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
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
      workMinutes = calculateAttendanceMinutes(
        att.clockInTime,
        att.clockOutTime,
        att.date,
        businessHours
      );
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
