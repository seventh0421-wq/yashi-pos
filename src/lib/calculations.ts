import {
  Staff,
  AttendanceRecord,
  ReceptionOrder,
  TalentBonus,
  DaySettlementData,
  StaffPayout
} from '../types';

export function calculateDaySettlement(
  date: string,
  staffList: Staff[],
  attendanceList: AttendanceRecord[],
  orders: ReceptionOrder[],
  bonuses: TalentBonus[],
  isSettled: boolean = false,
  settledAt?: string,
  settledBy?: string
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
        workMinutes = att.minutesWorked;
      } else if (att.clockInTime) {
        // Still working: compute minutes from clock-in to now
        const start = new Date(att.clockInTime).getTime();
        const now = Date.now();
        workMinutes = Math.max(0, Math.floor((now - start) / (1000 * 60)));
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
