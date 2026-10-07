import React, { useState, useMemo } from 'react';
import {
  Quote,
  QuoteStatus,
  QuoteLineItem,
  DiscountType,
  Part,
  UserAccount,
  BusinessSettings,
  computeQuoteTotals
} from '../types';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Printer,
  Trash2,
  CheckCircle,
  FileText,
  X,
  Save,
  ArrowRightCircle,
  Car,
  User,
  Phone,
  Tag
} from 'lucide-react';

interface QuoteViewProps {
  quotes: Quote[];
  parts: Part[];
  currentUser: UserAccount;
  businessSettings: BusinessSettings;
  onSaveQuote: (quote: Quote) => Promise<void> | void;
  onDeleteQuote: (id: string) => Promise<void> | void;
  onConvertToIntake: (quote: Quote) => Promise<void> | void;
}

export const QuoteView: React.FC<QuoteViewProps> = ({
  quotes,
  parts,
  currentUser,
  businessSettings,
  onSaveQuote,
  onDeleteQuote,
  onConvertToIntake
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit / Create quote modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Print Preview Modal
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchSearch =
        !searchTerm ||
        (q.quoteCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.phone || '').includes(searchTerm) ||
        (q.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const openNewQuoteModal = () => {
    const year = new Date().getFullYear();
    const count = quotes.length + 1;
    const newQuote: Quote = {
      id: Math.random().toString(36).substr(2, 9),
      quoteCode: `BG${year}${String(count).padStart(5, '0')}`,
      createdAt: new Date().toISOString(),
      status: 'DRAFT',
      advisorId: currentUser.id,
      advisorName: currentUser.name,

      customerName: '',
      phone: '',
      email: '',
      address: '',
      plateNumber: '',
      brand: '',
      carName: '',
      modelYear: '',
      vin: '',
      odometer: '',

      serviceItems: [
        {
          id: Math.random().toString(36).substr(2, 9),
          name: 'Công kiểm tra & bảo dưỡng định kỳ',
          quantity: 1,
          unitPrice: 200000
        }
      ],
      productItems: [],
      otherItems: [],

      discountType: 'AMOUNT',
      discountValue: 0,
      tax: 0,
      note: 'Báo giá có hiệu lực trong vòng 07 ngày kể từ ngày lập.'
    };

    setEditingQuote(newQuote);
    setIsModalOpen(true);
  };

  const openEditQuoteModal = (quote: Quote) => {
    setEditingQuote({ ...quote });
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    if (!editingQuote.customerName.trim() || !editingQuote.plateNumber.trim()) {
      alert('Vui lòng nhập Tên khách hàng và Biển số xe!');
      return;
    }

    await onSaveQuote(editingQuote);
    setIsModalOpen(false);
    setEditingQuote(null);
  };

  // Add line item in editing quote
  const addLineItem = (group: 'service' | 'product' | 'other') => {
    if (!editingQuote) return;
    const newItem: QuoteLineItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      quantity: 1,
      unitPrice: 0
    };

    if (group === 'service') {
      setEditingQuote({
        ...editingQuote,
        serviceItems: [...editingQuote.serviceItems, newItem]
      });
    } else if (group === 'product') {
      setEditingQuote({
        ...editingQuote,
        productItems: [...editingQuote.productItems, newItem]
      });
    } else {
      setEditingQuote({
        ...editingQuote,
        otherItems: [...editingQuote.otherItems, newItem]
      });
    }
  };

  const removeLineItem = (group: 'service' | 'product' | 'other', id: string) => {
    if (!editingQuote) return;
    if (group === 'service') {
      setEditingQuote({
        ...editingQuote,
        serviceItems: editingQuote.serviceItems.filter(i => i.id !== id)
      });
    } else if (group === 'product') {
      setEditingQuote({
        ...editingQuote,
        productItems: editingQuote.productItems.filter(i => i.id !== id)
      });
    } else {
      setEditingQuote({
        ...editingQuote,
        otherItems: editingQuote.otherItems.filter(i => i.id !== id)
      });
    }
  };

  const updateLineItem = (
    group: 'service' | 'product' | 'other',
    id: string,
    field: keyof QuoteLineItem,
    value: any
  ) => {
    if (!editingQuote) return;
    const updater = (list: QuoteLineItem[]) =>
      list.map(item => {
        if (item.id === id) {
          const next = { ...item, [field]: value };
          if (field === 'partId') {
            const foundPart = parts.find(p => p.id === value);
            if (foundPart) {
              next.name = foundPart.name;
              next.unitPrice = foundPart.sellPrice;
            }
          }
          return next;
        }
        return item;
      });

    if (group === 'service') {
      setEditingQuote({ ...editingQuote, serviceItems: updater(editingQuote.serviceItems) });
    } else if (group === 'product') {
      setEditingQuote({ ...editingQuote, productItems: updater(editingQuote.productItems) });
    } else {
      setEditingQuote({ ...editingQuote, otherItems: updater(editingQuote.otherItems) });
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'SENT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CONVERTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'Bản nháp';
      case 'SENT':
        return 'Đã gửi khách';
      case 'APPROVED':
        return 'Khách đồng ý';
      case 'REJECTED':
        return 'Từ chối';
      case 'CONVERTED':
        return 'Đã chuyển phiếu tiếp nhận';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Báo Giá Sửa Chữa Ô Tô</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Lập bảng dự toán chi phí minh bạch, in hoá đơn A4 và chuyển đổi thành Phiếu Tiếp Nhận 1 chạm
          </p>
        </div>

        <button
          onClick={openNewQuoteModal}
          className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Lập Báo Giá Mới</span>
        </button>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã BG, Tên khách hàng, SĐT, Biển số..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({quotes.length})
            </button>
            {(['DRAFT', 'SENT', 'APPROVED', 'CONVERTED', 'REJECTED'] as QuoteStatus[]).map(st => {
              const count = quotes.filter(q => q.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getStatusLabel(st)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <th className="py-3.5 px-6">Mã Báo Giá</th>
                <th className="py-3.5 px-4">Biển số & Phương tiện</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Tổng dự toán</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map(quote => {
                  const totals = computeQuoteTotals(quote);
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        <span className="text-blue-600">{quote.quoteCode}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-black text-xs px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded">
                          {quote.plateNumber || 'CHƯA CÓ'}
                        </span>
                        <div className="text-[11px] font-bold text-slate-700 mt-1 uppercase">
                          {quote.brand} {quote.carName}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{quote.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{quote.phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(quote.status)}`}>
                          {getStatusLabel(quote.status)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-600 text-xs">
                        {totals.total.toLocaleString('vi-VN')}đ
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {quote.createdAt.split('T')[0]}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPrintQuote(quote)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="In Báo Giá A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditQuoteModal(quote)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {quote.status !== 'CONVERTED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Chuyển báo giá ${quote.quoteCode} thành Phiếu tiếp nhận xe chính thức?`)) {
                                  onConvertToIntake(quote);
                                }
                              }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Chuyển thành Phiếu sửa chữa"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              <span>Vào xưởng</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Xoá báo giá ${quote.quoteCode}?`)) {
                                onDeleteQuote(quote.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs">
                    Chưa có báo giá nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT / CREATE QUOTE */}
      {isModalOpen && editingQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{editingQuote.quoteCode}</span>
                <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">
                  Bảng Dự Toán Chi Phí & Báo Giá Sửa Chữa
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-6">
              {/* Customer & Vehicle Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Khách Hàng</h4>
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên khách hàng *"
                    value={editingQuote.customerName}
                    onChange={e => setEditingQuote({ ...editingQuote, customerName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại..."
                    value={editingQuote.phone}
                    onChange={e => setEditingQuote({ ...editingQuote, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Địa chỉ..."
                    value={editingQuote.address || ''}
                    onChange={e => setEditingQuote({ ...editingQuote, address: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phương Tiện</h4>
                  <input
                    type="text"
                    required
                    placeholder="Biển số xe * (VD: 30A-12345)"
                    value={editingQuote.plateNumber}
                    onChange={e => setEditingQuote({ ...editingQuote, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black uppercase"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Hãng xe (Toyota...)"
                      value={editingQuote.brand || ''}
                      onChange={e => setEditingQuote({ ...editingQuote, brand: e.target.value })}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Tên xe (Vios...)"
                      value={editingQuote.carName || ''}
                      onChange={e => setEditingQuote({ ...editingQuote, carName: e.target.value })}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={editingQuote.status}
                      onChange={e => setEditingQuote({ ...editingQuote, status: e.target.value as QuoteStatus })}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-700"
                    >
                      <option value="DRAFT">Bản nháp</option>
                      <option value="SENT">Đã gửi khách</option>
                      <option value="APPROVED">Khách đồng ý</option>
                      <option value="REJECTED">Từ chối</option>
                      <option value="CONVERTED">Đã vào xưởng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Service Items (Công thợ / Dịch vụ) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">
                    1. Tiền Công Sửa Chữa / Dịch Vụ
                  </h4>
                  <button
                    type="button"
                    onClick={() => addLineItem('service')}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm công thợ
                  </button>
                </div>
                {editingQuote.serviceItems.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Tên công việc..."
                      value={item.name}
                      onChange={e => updateLineItem('service', item.id, 'name', e.target.value)}
                      className="col-span-6 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateLineItem('service', item.id, 'quantity', Number(e.target.value) || 1)}
                      className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center font-bold"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateLineItem('service', item.id, 'unitPrice', Number(e.target.value) || 0)}
                      className="col-span-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('service', item.id)}
                      className="col-span-1 p-2 text-slate-400 hover:text-rose-600 text-center"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>

              {/* SECTION 2: Product Items (Phụ tùng / Vật tư từ kho) */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">
                    2. Phụ Tùng & Vật Tư Thay Thế (Chọn từ Kho hoặc nhập tay)
                  </h4>
                  <button
                    type="button"
                    onClick={() => addLineItem('product')}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm phụ tùng
                  </button>
                </div>
                {editingQuote.productItems.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6 flex gap-1">
                      <select
                        value={item.partId || ''}
                        onChange={e => updateLineItem('product', item.id, 'partId', e.target.value)}
                        className="p-2 bg-blue-50/60 border border-blue-200 rounded-xl text-[11px] font-bold max-w-[140px]"
                      >
                        <option value="">-- Kho --</option>
                        {parts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} ({p.quantityOnHand})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Tên phụ tùng..."
                        value={item.name}
                        onChange={e => updateLineItem('product', item.id, 'name', e.target.value)}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateLineItem('product', item.id, 'quantity', Number(e.target.value) || 1)}
                      className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center font-bold"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateLineItem('product', item.id, 'unitPrice', Number(e.target.value) || 0)}
                      className="col-span-3 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('product', item.id)}
                      className="col-span-1 p-2 text-slate-400 hover:text-rose-600 text-center"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount, Tax & Summary */}
              {(() => {
                const totals = computeQuoteTotals(editingQuote);
                return (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Loại giảm giá</label>
                        <select
                          value={editingQuote.discountType}
                          onChange={e => setEditingQuote({ ...editingQuote, discountType: e.target.value as DiscountType })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        >
                          <option value="AMOUNT">Số tiền trực tiếp (VNĐ)</option>
                          <option value="PERCENT">Phần trăm (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Giá trị giảm</label>
                        <input
                          type="number"
                          value={editingQuote.discountValue || ''}
                          onChange={e => setEditingQuote({ ...editingQuote, discountValue: Number(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Thuế VAT (%)</label>
                        <input
                          type="number"
                          value={editingQuote.tax || ''}
                          onChange={e => setEditingQuote({ ...editingQuote, tax: Number(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>Cộng tiền: <strong className="font-mono">{totals.subtotal.toLocaleString('vi-VN')}đ</strong></p>
                        <p>Giảm trừ: <strong className="font-mono text-rose-600">-{totals.discountAmount.toLocaleString('vi-VN')}đ</strong></p>
                        <p>Thuế VAT: <strong className="font-mono">+{totals.taxAmount.toLocaleString('vi-VN')}đ</strong></p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                          Tổng dự toán khách duyệt:
                        </span>
                        <span className="text-2xl font-black text-emerald-600 font-mono">
                          {totals.total.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-100 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-md cursor-pointer"
                >
                  Lưu Báo Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT PREVIEW A4 QUOTATION */}
      {printQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 my-8 text-slate-900 text-xs max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 print:hidden">
              <span className="font-bold text-slate-500 uppercase text-xs">Xem trước trang in Báo giá</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In (Ctrl + P)</span>
                </button>
                <button
                  onClick={() => setPrintQuote(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Content Sheet */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black uppercase text-blue-900">
                  {businessSettings.garageName || 'BÊN TRONG GARA'}
                </h2>
                <p className="text-[11px] text-slate-600 mt-1">{businessSettings.address}</p>
                <p className="text-[11px] text-slate-600">Hotline: {businessSettings.phone} • Web: {businessSettings.website}</p>
                {businessSettings.bankInfo && (
                  <p className="text-[10px] text-slate-500 mt-0.5">Tài khoản: {businessSettings.bankInfo}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-black font-mono">{printQuote.quoteCode}</div>
                <div className="text-[10px] text-slate-500 uppercase">Ngày lập: {printQuote.createdAt.split('T')[0]}</div>
              </div>
            </div>

            <h3 className="text-center text-lg font-black uppercase tracking-wider mb-6">
              BẢNG BÁO GIÁ SỬA CHỮA & BẢO DƯỠNG XE Ô TÔ
            </h3>

            <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50/50">
              <div>
                <p><strong>Khách hàng:</strong> {printQuote.customerName}</p>
                <p className="mt-1"><strong>Điện thoại:</strong> {printQuote.phone}</p>
                <p className="mt-1"><strong>Địa chỉ:</strong> {printQuote.address || '—'}</p>
              </div>
              <div>
                <p><strong>Biển số:</strong> <span className="font-mono font-bold text-blue-700">{printQuote.plateNumber}</span></p>
                <p className="mt-1"><strong>Dòng xe:</strong> {printQuote.brand} {printQuote.carName}</p>
                <p className="mt-1"><strong>Cố vấn dịch vụ:</strong> {printQuote.advisorName}</p>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-left text-xs border border-slate-200 mb-6">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-[10px]">
                  <th className="p-2 border-r border-slate-200 w-12 text-center">STT</th>
                  <th className="p-2 border-r border-slate-200">Diễn giải dịch vụ & Phụ tùng</th>
                  <th className="p-2 border-r border-slate-200 text-center w-16">SL</th>
                  <th className="p-2 border-r border-slate-200 text-right w-28">Đơn giá</th>
                  <th className="p-2 text-right w-32">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-slate-200">
                {[...printQuote.serviceItems, ...printQuote.productItems, ...printQuote.otherItems].map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{item.name}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{item.quantity}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{item.unitPrice.toLocaleString('vi-VN')}đ</td>
                    <td className="p-2 text-right font-mono font-bold">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {(() => {
                  const totals = computeQuoteTotals(printQuote);
                  return (
                    <>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={4} className="p-2 text-right border-r border-slate-200 uppercase text-[10px]">Cộng tiền hàng:</td>
                        <td className="p-2 text-right font-mono">{totals.subtotal.toLocaleString('vi-VN')}đ</td>
                      </tr>
                      {totals.discountAmount > 0 && (
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan={4} className="p-2 text-right border-r border-slate-200 uppercase text-[10px]">Giảm trừ:</td>
                          <td className="p-2 text-right font-mono text-rose-600">-{totals.discountAmount.toLocaleString('vi-VN')}đ</td>
                        </tr>
                      )}
                      {totals.taxAmount > 0 && (
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan={4} className="p-2 text-right border-r border-slate-200 uppercase text-[10px]">Thuế VAT ({printQuote.tax}%):</td>
                          <td className="p-2 text-right font-mono">+{totals.taxAmount.toLocaleString('vi-VN')}đ</td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 font-black text-sm">
                        <td colSpan={4} className="p-2.5 text-right border-r border-slate-200 uppercase">Tổng cộng báo giá:</td>
                        <td className="p-2.5 text-right font-mono text-blue-900">{totals.total.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>

            {printQuote.note && (
              <p className="text-[11px] text-slate-500 italic mb-8">
                <strong>Ghi chú & Điều khoản:</strong> {printQuote.note}
              </p>
            )}

            <div className="grid grid-cols-2 gap-8 text-center pt-4">
              <div>
                <p className="font-bold uppercase text-[11px]">KHÁCH HÀNG ĐỒNG Ý</p>
                <p className="text-[10px] text-slate-400 italic">(Ký xác nhận)</p>
                <div className="h-16"></div>
                <p className="font-bold">{printQuote.customerName}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-[11px]">ĐẠI DIỆN GARA</p>
                <p className="text-[10px] text-slate-400 italic">(Cố vấn dịch vụ)</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-lg text-blue-800 font-bold">{printQuote.advisorName}</span>
                </div>
                <p className="font-bold">{printQuote.advisorName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteView;
