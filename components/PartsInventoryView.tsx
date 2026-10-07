import React, { useState, useMemo } from 'react';
import {
  Part,
  StockTransaction,
  UserAccount,
  UserRole,
  getPartStockLevel
} from '../types';
import {
  Warehouse,
  Plus,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle,
  Tag
} from 'lucide-react';

interface PartsInventoryViewProps {
  parts: Part[];
  transactions: StockTransaction[];
  currentUser: UserAccount;
  onSavePart: (part: Part) => Promise<void> | void;
  onDeletePart: (id: string) => Promise<void> | void;
  onStockIn: (part: Part, quantity: number, note: string) => Promise<void> | void;
}

const CATEGORIES = [
  'Tất cả',
  'Dầu nhớt & Phụ gia',
  'Lọc (Gió, Nhớt, Xăng)',
  'Hệ thống Phanh & Gầm',
  'Điện & Bình ắc quy',
  'Lốp & La-zăng',
  'Chăm sóc xe & Hóa chất',
  'Phụ tùng máy & Động cơ',
  'Khác'
];

export const PartsInventoryView: React.FC<PartsInventoryViewProps> = ({
  parts,
  transactions,
  currentUser,
  onSavePart,
  onDeletePart,
  onStockIn
}) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'HISTORY'>('INVENTORY');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Edit / Add modal state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Partial<Part>>({});

  // Stock In modal state
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInPart, setStockInPart] = useState<Part | null>(null);
  const [stockInQty, setStockInQty] = useState<number>(1);
  const [stockInNote, setStockInNote] = useState('');

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchSearch =
        !searchTerm ||
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === 'Tất cả' || p.category === selectedCategory;

      const level = getPartStockLevel(p);
      const matchStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && level === 'LOW') ||
        (stockFilter === 'OUT' && level === 'OUT');

      return matchSearch && matchCategory && matchStock;
    });
  }, [parts, searchTerm, selectedCategory, stockFilter]);

  const openAddModal = () => {
    const sku = `PT${String(parts.length + 1).padStart(5, '0')}`;
    setEditingPart({
      id: Math.random().toString(36).substr(2, 9),
      sku,
      name: '',
      category: 'Dầu nhớt & Phụ gia',
      unit: 'Cái',
      costPrice: 0,
      sellPrice: 0,
      quantityOnHand: 0,
      minQuantityThreshold: 5,
      supplier: '',
      location: 'Kệ A1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsPartModalOpen(true);
  };

  const openEditModal = (part: Part) => {
    setEditingPart({ ...part });
    setIsPartModalOpen(true);
  };

  const handleSavePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart.name?.trim()) {
      alert('Vui lòng nhập tên phụ tùng!');
      return;
    }

    const partToSave: Part = {
      id: editingPart.id || Math.random().toString(36).substr(2, 9),
      sku: editingPart.sku || `PT${String(parts.length + 1).padStart(5, '0')}`,
      name: editingPart.name.trim(),
      category: editingPart.category || 'Khác',
      unit: editingPart.unit || 'Cái',
      costPrice: Number(editingPart.costPrice) || 0,
      sellPrice: Number(editingPart.sellPrice) || 0,
      quantityOnHand: Number(editingPart.quantityOnHand) || 0,
      minQuantityThreshold: Number(editingPart.minQuantityThreshold) || 5,
      supplier: editingPart.supplier || '',
      location: editingPart.location || '',
      createdAt: editingPart.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSavePart(partToSave);
    setIsPartModalOpen(false);
  };

  const openStockInModal = (part: Part) => {
    setStockInPart(part);
    setStockInQty(1);
    setStockInNote('Nhập hàng định kỳ');
    setIsStockInModalOpen(true);
  };

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInPart || stockInQty <= 0) return;
    await onStockIn(stockInPart, stockInQty, stockInNote);
    setIsStockInModalOpen(false);
  };

  const lowStockCount = parts.filter(p => getPartStockLevel(p) === 'LOW').length;
  const outOfStockCount = parts.filter(p => getPartStockLevel(p) === 'OUT').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Kho & Phụ Tùng Garage</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Tổng cộng: <strong className="text-slate-900">{parts.length} mã hàng</strong> • Sắp hết: <strong className="text-amber-600">{lowStockCount}</strong> • Hết hàng: <strong className="text-rose-600">{outOfStockCount}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab(activeTab === 'INVENTORY' ? 'HISTORY' : 'INVENTORY')}
            className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{activeTab === 'HISTORY' ? 'Về danh sách kho' : 'Lịch sử nhập xuất'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Phụ Tùng</span>
          </button>
        </div>
      </div>

      {activeTab === 'INVENTORY' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã SKU, Tên phụ tùng, Nhà cung cấp..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Stock Filter Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStockFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stockFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({parts.length})
                </button>
                <button
                  onClick={() => setStockFilter('LOW')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stockFilter === 'LOW'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Sắp hết ({lowStockCount})
                </button>
                <button
                  onClick={() => setStockFilter('OUT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stockFilter === 'OUT'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Hết hàng ({outOfStockCount})
                </button>
              </div>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <th className="py-3.5 px-6">Mã SKU</th>
                  <th className="py-3.5 px-4">Tên phụ tùng & Nhóm</th>
                  <th className="py-3.5 px-4">ĐVT / Vị trí</th>
                  <th className="py-3.5 px-4 text-right">Giá nhập</th>
                  <th className="py-3.5 px-4 text-right">Giá bán</th>
                  <th className="py-3.5 px-4 text-center">Tồn kho</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.length > 0 ? (
                  filteredParts.map(part => {
                    const level = getPartStockLevel(part);
                    return (
                      <tr key={part.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          <span className="px-2 py-1 bg-slate-100 rounded text-[11px]">{part.sku}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-xs">{part.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{part.category}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-700">{part.unit}</div>
                          <div className="text-[10px] text-slate-400">{part.location || 'Chưa xếp kệ'}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-slate-500 font-semibold">
                          {(part.costPrice || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-slate-900 font-bold">
                          {(part.sellPrice || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-black text-sm">
                          <span
                            className={
                              level === 'OUT'
                                ? 'text-rose-600'
                                : level === 'LOW'
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }
                          >
                            {part.quantityOnHand}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {level === 'OUT' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                              Hết hàng
                            </span>
                          ) : level === 'LOW' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                              Sắp hết (&le; {part.minQuantityThreshold})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              Đủ hàng
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openStockInModal(part)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Nhập thêm hàng vào kho"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Nhập</span>
                            </button>
                            <button
                              onClick={() => openEditModal(part)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {currentUser.role === UserRole.ADMIN && (
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn muốn xoá phụ tùng "${part.name}" khỏi kho?`)) {
                                    onDeletePart(part.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                title="Xoá phụ tùng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold text-xs">
                      Không tìm thấy phụ tùng phù hợp với bộ lọc
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Lịch Sử Nhập Xuất */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Nhật Ký Giao Dịch Nhập / Xuất Kho ({transactions.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-6">Thời gian</th>
                  <th className="py-3 px-4">Loại giao dịch</th>
                  <th className="py-3 px-4">Phụ tùng</th>
                  <th className="py-3 px-4 text-center">Số lượng</th>
                  <th className="py-3 px-4">Mã phiếu liên quan</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-6">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-6 font-mono text-slate-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        {tx.type === 'IMPORT' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase flex items-center gap-1 w-fit">
                            <ArrowDownLeft className="w-3 h-3" />
                            Nhập kho
                          </span>
                        ) : tx.type === 'EXPORT' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase flex items-center gap-1 w-fit">
                            <ArrowUpRight className="w-3 h-3" />
                            Xuất xưởng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                            Điều chỉnh
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.partName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        {tx.type === 'IMPORT' ? (
                          <span className="text-emerald-600">+{tx.quantity}</span>
                        ) : (
                          <span className="text-amber-600">-{tx.quantity}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 text-[11px]">
                        {tx.relatedOrderCode || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{tx.createdBy}</td>
                      <td className="py-3 px-6 text-slate-500 italic">{tx.note || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs">
                      Chưa có giao dịch nhập xuất nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Part */}
      {isPartModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                {editingPart.id ? 'Chỉnh Sửa Thông Tin Phụ Tùng' : 'Thêm Mới Phụ Tùng Vào Kho'}
              </h3>
              <button
                onClick={() => setIsPartModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Mã SKU</label>
                  <input
                    type="text"
                    required
                    value={editingPart.sku || ''}
                    onChange={e => setEditingPart({ ...editingPart, sku: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    placeholder="VD: Cái, Lít, Bộ..."
                    value={editingPart.unit || ''}
                    onChange={e => setEditingPart({ ...editingPart, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Tên phụ tùng / vật tư</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dầu động cơ Castrol Magnatec 5W-30"
                  value={editingPart.name || ''}
                  onChange={e => setEditingPart({ ...editingPart, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Phân nhóm phụ tùng</label>
                <select
                  value={editingPart.category || 'Khác'}
                  onChange={e => setEditingPart({ ...editingPart, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
                >
                  {CATEGORIES.filter(c => c !== 'Tất cả').map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Giá nhập (VNĐ)</label>
                  <input
                    type="number"
                    value={editingPart.costPrice || ''}
                    onChange={e => setEditingPart({ ...editingPart, costPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Giá bán đề xuất (VNĐ)</label>
                  <input
                    type="number"
                    value={editingPart.sellPrice || ''}
                    onChange={e => setEditingPart({ ...editingPart, sellPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Số lượng tồn ban đầu</label>
                  <input
                    type="number"
                    value={editingPart.quantityOnHand ?? ''}
                    onChange={e => setEditingPart({ ...editingPart, quantityOnHand: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Ngưỡng báo sắp hết</label>
                  <input
                    type="number"
                    value={editingPart.minQuantityThreshold ?? 5}
                    onChange={e => setEditingPart({ ...editingPart, minQuantityThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Vị trí lưu kho</label>
                  <input
                    type="text"
                    placeholder="VD: Kệ A-1"
                    value={editingPart.location || ''}
                    onChange={e => setEditingPart({ ...editingPart, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    placeholder="VD: Castrol VN"
                    value={editingPart.supplier || ''}
                    onChange={e => setEditingPart({ ...editingPart, supplier: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-100 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-md cursor-pointer"
                >
                  Lưu Phụ Tùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nhập kho (Stock In) */}
      {isStockInModalOpen && stockInPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                Nhập Thêm Hàng Vào Kho
              </h3>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-xs font-bold text-slate-900">{stockInPart.name}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Mã SKU: <span className="font-mono font-bold">{stockInPart.sku}</span> • Tồn hiện tại: <span className="font-bold text-blue-600 font-mono">{stockInPart.quantityOnHand} {stockInPart.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Số lượng nhập thêm ({stockInPart.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockInQty}
                  onChange={e => setStockInQty(Number(e.target.value) || 1)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-base"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Ghi chú chứng từ / Đơn nhập
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhập từ nhà cung cấp theo hoá đơn số #1234"
                  value={stockInNote}
                  onChange={e => setStockInNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-100 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase shadow-md cursor-pointer"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsInventoryView;
