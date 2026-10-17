import { useState } from 'react';
import { MenuItem, MenuCategory, Staff } from '../types';
import { formatGil } from '../lib/format';
import { 
  Plus, 
  Edit3, 
  Utensils 
} from 'lucide-react';

interface AdminMenuViewProps {
  menu: MenuItem[];
  staffList: Staff[];
  onUpdateItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  onAddItem: (item: Partial<MenuItem>) => Promise<void>;
}

export function AdminMenuView({
  menu,
  staffList,
  onUpdateItem,
  onAddItem,
}: AdminMenuViewProps) {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MenuCategory>('main');
  const [newPrice, setNewPrice] = useState(20000);
  const [newCost, setNewCost] = useState(500);
  const [newPoolShare, setNewPoolShare] = useState(0);
  const [newRecommendedStaffName, setNewRecommendedStaffName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRuleNote, setNewRuleNote] = useState('');

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await onUpdateItem(editingItem.id, {
      name: editingItem.name,
      category: editingItem.category,
      price: Number(editingItem.price),
      cost: Number(editingItem.cost),
      poolShare: Number(editingItem.poolShare),
      recommendedStaffName: editingItem.recommendedStaffName,
      isAvailable: editingItem.isAvailable,
      description: editingItem.description,
      ruleNote: editingItem.ruleNote
    });
    setEditingItem(null);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await onAddItem({
      name: newName.trim(),
      category: newCategory,
      price: Number(newPrice),
      cost: Number(newCost),
      poolShare: Number(newPoolShare),
      recommendedStaffName: newCategory === 'specialty' ? newRecommendedStaffName.trim() : undefined,
      description: newDescription.trim(),
      ruleNote: newRuleNote.trim()
    });
    setShowAddModal(false);
    setNewName('');
    setNewRecommendedStaffName('');
    setNewDescription('');
  };

  const categories: { id: MenuCategory; label: string }[] = [
    { id: 'drink', label: '飲品' },
    { id: 'main', label: '主餐' },
    { id: 'dessert_salad', label: '甜點／沙拉' },
    { id: 'set', label: '套餐' },
    { id: 'specialty', label: '特色餐點' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D6]">
        <div>
          <h2 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#5B88B4]" />
            菜單商品與成本管理 (Menu & Cost Engineering)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            配合 FF14 市場價格浮動隨時調整食材成本與售價，食物淨利全數計入薪資池。
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#5B88B4] hover:bg-[#4C78A3] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>新增商品品項</span>
        </button>
      </div>

      {/* Menu Table */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE3D6] text-slate-500">
                <th className="py-3 px-4 font-medium">品項名稱</th>
                <th className="py-3 px-4 font-medium">分類</th>
                <th className="py-3 px-4 font-medium text-right">售價 (Gil)</th>
                <th className="py-3 px-4 font-medium text-right">食材成本 (Gil)</th>
                <th className="py-3 px-4 font-medium text-right">食物利潤 / 抽成</th>
                <th className="py-3 px-4 font-medium text-center">販售狀態</th>
                <th className="py-3 px-4 font-medium text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D6]">
              {menu.map(item => {
                const profit = item.price - item.cost;
                const isSpecialty = item.category === 'specialty';

                return (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{item.name}</span>
                        {item.recommendedStaffName && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F1F8] text-[#245280] border border-[#BFD7EE]">
                            {item.recommendedStaffName}推薦
                          </span>
                        )}
                        {item.category === 'set' && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#1E293B] text-amber-200 border border-slate-700">
                            ✦ 莊園尊榮套餐
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#FAF8F5] text-slate-700 border border-[#E8E2D7]">
                        {item.category === 'drink' ? '飲品' :
                         item.category === 'main' ? '主餐' :
                         item.category === 'dessert_salad' ? '甜點／沙拉' :
                         item.category === 'set' ? '套餐' : '特色餐點'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-right text-slate-800">
                      {formatGil(item.price)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-rose-700">
                      {formatGil(item.cost)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-right text-emerald-700">
                      {isSpecialty ? `抽成 ${formatGil(item.poolShare)}` : formatGil(profit)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onUpdateItem(item.id, { isAvailable: !item.isAvailable })}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isAvailable ? '販售中' : '已下架'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingItem({ ...item })}
                        className="px-2.5 py-1 text-slate-600 hover:text-[#245280] hover:bg-[#F3ECE1] rounded-lg transition-colors cursor-pointer text-[11px]"
                      >
                        編輯成本售價
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#5B88B4]" />
                編輯商品：{editingItem.name}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">商品名稱：</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">售價 (Gil)：</label>
                  <input
                    type="number"
                    step={1000}
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">食材成本 (Gil)：</label>
                  <input
                    type="number"
                    step={50}
                    value={editingItem.cost}
                    onChange={e => setEditingItem({ ...editingItem, cost: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              {editingItem.category === 'specialty' && (
                <>
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">推薦店員／侍從名稱：</label>
                    <input
                      type="text"
                      value={editingItem.recommendedStaffName || ''}
                      onChange={e => setEditingItem({ ...editingItem, recommendedStaffName: e.target.value })}
                      placeholder="例如：萊可、璐可、胖冬瓜"
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-medium">特色餐計入薪資池抽成 (Gil)：</label>
                    <input
                      type="number"
                      value={editingItem.poolShare}
                      onChange={e => setEditingItem({ ...editingItem, poolShare: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] flex justify-between font-mono">
                <span className="text-slate-500">當前預估單份淨利：</span>
                <span className="font-bold text-emerald-700">
                  {formatGil(editingItem.price - editingItem.cost)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#5B88B4]" />
                新增商品項目
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">商品名稱：</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：特選香草烤羊排"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">商品分類：</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as MenuCategory)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {newCategory === 'specialty' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">推薦店員／侍從名稱：</label>
                  <input
                    type="text"
                    value={newRecommendedStaffName}
                    onChange={e => setNewRecommendedStaffName(e.target.value)}
                    placeholder="例如：萊可、璐可、胖冬瓜"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">售價 (Gil)：</label>
                  <input
                    type="number"
                    step={1000}
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">預估食材成本 (Gil)：</label>
                  <input
                    type="number"
                    step={50}
                    value={newCost}
                    onChange={e => setNewCost(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">商品描述 (選填)：</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="美味料理特色介紹..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 resize-none"
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
                  建立品項
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
