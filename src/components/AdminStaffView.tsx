import { useState } from 'react';
import { Staff, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Edit3 
} from 'lucide-react';

interface AdminStaffViewProps {
  staffList: Staff[];
  onAddStaff: (staff: Partial<Staff> & { password?: string }) => Promise<void>;
  onUpdateStaff: (id: string, updates: Partial<Staff> & { password?: string }) => Promise<void>;
}

export function AdminStaffView({
  staffList,
  onAddStaff,
  onUpdateStaff,
}: AdminStaffViewProps) {
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New staff form
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('maid');
  const [newPassword, setNewPassword] = useState('yashi123');

  const handleSaveEdit = async () => {
    if (!editingStaff) return;
    await onUpdateStaff(editingStaff.id, {
      name: editingStaff.name,
      role: editingStaff.role,
      roleTitle: editingStaff.role === 'manager' ? '總管店長' : editingStaff.role === 'butler' ? '執事侍從' : '女僕侍從',
      isActive: editingStaff.isActive,
      password: editPassword ? editPassword : undefined
    });
    setEditingStaff(null);
    setEditPassword('');
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;
    await onAddStaff({
      name: newName.trim(),
      username: newUsername.trim(),
      role: newRole,
      roleTitle: newRole === 'manager' ? '總管店長' : newRole === 'butler' ? '執事侍從' : '女僕侍從',
      password: newPassword || 'yashi123'
    });
    setShowAddModal(false);
    setNewName('');
    setNewUsername('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D6]">
        <div>
          <h2 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5B88B4]" />
            員工帳號與權限管理 (Staff Accounts & Roles)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            管理全體執事、女僕與店長帳號、角色身分、登入密碼及在職狀態。
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>新增侍從帳號</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map(staff => {
          const isManager = staff.role === 'manager';
          return (
            <div
              key={staff.id}
              className="p-5 bg-white border border-[#E8E2D7] rounded-2xl flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#DFD6C7] bg-[#FAF8F5] shrink-0">
                    <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 text-sm">{staff.name}</h3>
                    <span className="text-xs text-[#245280] font-mono mt-0.5 block">@{staff.username}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-medium border ${
                  isManager 
                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                    : staff.role === 'butler'
                    ? 'bg-[#E8F1F8] border-[#BFD7EE] text-[#245280]'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {staff.roleTitle}
                </span>
              </div>

              <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-slate-500">{staff.isActive ? '在職中' : '已停用'}</span>
                </div>
                <button
                  onClick={() => {
                    setEditingStaff({ ...staff });
                    setEditPassword('');
                  }}
                  className="px-2.5 py-1 text-slate-600 hover:text-[#245280] hover:bg-[#F3ECE1] rounded-lg transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>管理帳號</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#5B88B4]" />
                編輯侍從帳號：{editingStaff.name}
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">店員姓名 (稱呼)：</label>
                <input
                  type="text"
                  value={editingStaff.name}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">身分角色：</label>
                <select
                  value={editingStaff.role}
                  onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as UserRole })}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                >
                  <option value="maid">女僕侍從 (Maid)</option>
                  <option value="butler">執事侍從 (Butler)</option>
                  <option value="manager">店長／管理員 (Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">重設密碼 (若留空則維持原密碼)：</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="輸入新密碼..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingStaff.isActive}
                  onChange={e => setEditingStaff({ ...editingStaff, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-[#FAF8F5] border-[#DFD6C7] text-[#5B88B4] focus:ring-0"
                />
                <label htmlFor="isActiveToggle" className="text-slate-700 cursor-pointer font-medium">
                  帳號啟用 (若關閉則無法登入或被指派)
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs bg-[#5B88B4] hover:bg-[#4C78A3] text-white font-medium rounded-lg shadow-xs cursor-pointer"
              >
                儲存變更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#5B88B4]" />
                新增侍從帳號
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">店員姓名 (稱呼)：</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：愛麗絲 (Alice)"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">登入帳號 (Username)：</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="例如：alice"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">身分角色：</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                >
                  <option value="maid">女僕侍從 (Maid)</option>
                  <option value="butler">執事侍從 (Butler)</option>
                  <option value="manager">店長／管理員 (Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">初始密碼：</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="預設為 yashi123"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#5B88B4] hover:bg-[#4C78A3] text-white font-medium rounded-lg shadow-xs cursor-pointer"
                >
                  確認建立帳號
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
