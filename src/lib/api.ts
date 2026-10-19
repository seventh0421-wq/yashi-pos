import { AppState, Staff, MenuItem, ReceptionOrder, BusinessHoursConfig } from '../types';

export const api = {
  async getState(): Promise<AppState> {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('無法取得系統資料');
    return res.json();
  },

  async login(
    username?: string, 
    password?: string, 
    staffId?: string,
    newPassword?: string
  ): Promise<{ success: boolean; staff: Staff; isFirstLogin?: boolean }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, staffId, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登入失敗');
    return data;
  },

  async clockIn(staffId: string) {
    const res = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '打卡上班失敗');
    return data;
  },

  async clockOut(staffId: string) {
    const res = await fetch('/api/attendance/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '打卡下班失敗');
    return data;
  },

  async updateAttendance(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新打卡紀錄失敗');
    return data;
  },

  async createOrder(data: { guestName: string; assignedStaffId: string; tableNo?: string; notes?: string }) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || '建立接待單失敗');
    return result.order;
  },

  async updateOrder(id: string, updates: Partial<ReceptionOrder> & { bypassLock?: boolean; isServiceUpdate?: boolean }) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新接待單失敗');
    return data.order;
  },

  async checkoutOrder(id: string) {
    const res = await fetch(`/api/orders/${id}/checkout`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '結帳失敗');
    return data.order;
  },


  async reopenOrder(id: string) {
    const res = await fetch(`/api/orders/${id}/reopen`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '重新解鎖失敗');
    return data.order;
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const res = await fetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新商品失敗');
    return data.item;
  },

  async addMenuItem(item: Partial<MenuItem>) {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '新增商品失敗');
    return data.item;
  },

  async addBonus(staffId: string, title: string, weightMinutes: number, recordedBy: string) {
    const res = await fetch('/api/bonuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, title, weightMinutes, recordedBy })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '新增加成失敗');
    return data.bonus;
  },

  async deleteBonus(id: string) {
    const res = await fetch(`/api/bonuses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '刪除加成失敗');
    return data;
  },

  async closeSettlement(settledBy: string) {
    const res = await fetch('/api/settlement/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settledBy })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '閉店結算失敗');
    return data.settlement;
  },

  async reopenSettlement() {
    const res = await fetch('/api/settlement/reopen', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '解除閉店結算失敗');
    return data.settlement;
  },

  async addStaff(staff: Partial<Staff> & { password?: string }) {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '新增員工失敗');
    return data.staff;
  },

  async updateStaff(id: string, updates: Partial<Staff> & { password?: string }) {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新員工失敗');
    return data.staff;
  },

  async resetStaffPassword(staffId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/staff/${staffId}/reset-password`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '重設密碼失敗');
    return data;
  },

  async importBackup(importedState: AppState) {
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importedState)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '匯入失敗');
    return data.state;
  },

  async resetBackup() {
    const res = await fetch('/api/backup/reset', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '重置失敗');
    return data.state;
  },

  async updateBusinessHours(updates: Partial<BusinessHoursConfig>) {
    const res = await fetch('/api/business-hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新營業時段設定失敗');
    return data.businessHours;
  }
};
