import { useState } from 'react';
import { AppState, MenuItem, Staff, BusinessHoursConfig } from '../types';
import { AdminMenuView } from './AdminMenuView';
import { AdminStaffView } from './AdminStaffView';
import { AdminBackupView } from './AdminBackupView';
import { AdminBusinessHoursView } from './AdminBusinessHoursView';
import { Utensils, Users, Database, Clock } from 'lucide-react';

interface AdminViewProps {
  appState: AppState;
  onUpdateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  onAddMenuItem: (item: Partial<MenuItem>) => Promise<void>;
  onAddStaff: (staff: Partial<Staff> & { password?: string }) => Promise<void>;
  onUpdateStaff: (id: string, updates: Partial<Staff> & { password?: string }) => Promise<void>;
  onImportBackup: (imported: AppState) => Promise<void>;
  onResetBackup: () => Promise<void>;
  onUpdateBusinessHours: (updates: Partial<BusinessHoursConfig>) => Promise<void>;
  onResetStaffPassword?: (staffId: string) => Promise<void>;
}

export function AdminView({
  appState,
  onUpdateMenuItem,
  onAddMenuItem,
  onAddStaff,
  onUpdateStaff,
  onImportBackup,
  onResetBackup,
  onUpdateBusinessHours,
  onResetStaffPassword,
}: AdminViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'business_hours' | 'menu' | 'staff' | 'backup'>('business_hours');

  const subTabs = [
    { id: 'business_hours', label: '營業時間與工時規則', icon: Clock },
    { id: 'menu', label: '商品與成本管理', icon: Utensils },
    { id: 'staff', label: '侍從帳號與身分', icon: Users },
    { id: 'backup', label: '資料備份與重置', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F1ECE1] border border-[#DFD6C7] rounded-xl overflow-x-auto shadow-xs">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as 'menu' | 'staff' | 'backup')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-[#245280] border border-[#BFD7EE] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub Views */}
      {activeSubTab === 'business_hours' && (
        <AdminBusinessHoursView
          businessHours={appState.businessHours}
          onUpdateBusinessHours={onUpdateBusinessHours}
        />
      )}

      {activeSubTab === 'menu' && (
        <AdminMenuView
          menu={appState.menu}
          staffList={appState.staffList}
          onUpdateItem={onUpdateMenuItem}
          onAddItem={onAddMenuItem}
        />
      )}

      {activeSubTab === 'staff' && (
        <AdminStaffView
          staffList={appState.staffList}
          onAddStaff={onAddStaff}
          onUpdateStaff={onUpdateStaff}
          onResetStaffPassword={onResetStaffPassword}
        />
      )}

      {activeSubTab === 'backup' && (
        <AdminBackupView
          appState={appState}
          onImportBackup={onImportBackup}
          onResetBackup={onResetBackup}
        />
      )}
    </div>
  );
}
