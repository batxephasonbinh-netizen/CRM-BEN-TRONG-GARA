import React, { useState, useMemo } from 'react';
import { IntakeForm, UserAccount, UserRole, VehicleStatus, Part } from '../types';
import {
  Car,
  Wrench,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  Phone,
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  forms: IntakeForm[];
  currentUser: UserAccount;
  onNewForm: () => void;
  onViewForm: (form: IntakeForm) => void;
  onDeleteForm: (id: string) => Promise<void> | void;
  totalStats: {
    todayReceipts: number;
    executingCount: number;
    handoverCount: number;
    dailyRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
  };
  lowStockParts: Part[];
  onGoToParts: () => void;
  onResetSampleData?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  forms,
  currentUser,
  onNewForm,
  onViewForm,
  onDeleteForm,
  totalStats,
  lowStockParts,
  onGoToParts,
  onResetSampleData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      const matchSearch =
        !searchTerm ||
        (f.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.carName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.phone || '').includes(searchTerm) ||
        (f.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [forms, searchTerm, statusFilter]);

  const getStatusBadgeStyle = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.INTAKE:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case VehicleStatus.EXECUTING:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case VehicleStatus.TECH_CHECK:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case VehicleStatus.HANDOVER:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case VehicleStatus.COMPLETED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Main CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Bảng Điều Khiển Xưởng Dịch Vụ
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Chào mừng <strong className="text-slate-800">{currentUser.name}</strong> • Theo dõi tiến độ xe, phụ tùng và luồng doanh thu
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onResetSampleData && (
            <button
              onClick={onResetSampleData}
              className="flex items-center gap-1.5 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Khôi phục / Nạp lại bộ 10 xe mẫu, 10 khách hàng và 10 phụ tùng"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Nạp lại 10 mẫu</span>
            </button>
          )}
          <button
            onClick={onNewForm}
            className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tiếp Nhận Xe Mới</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {lowStockParts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Cảnh báo tồn kho: Có {lowStockParts.length} mặt hàng phụ tùng dưới ngưỡng an toàn!
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Các mặt hàng: {lowStockParts.slice(0, 3).map(p => `${p.name} (${p.quantityOnHand} ${p.unit})`).join(', ')}
                {lowStockParts.length > 3 && ` và ${lowStockParts.length - 3} món khác...`}
              </p>
            </div>
          </div>
          <button
            onClick={onGoToParts}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            <span>Xem Kho & Nhập Thêm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tiếp nhận hôm nay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tiếp nhận hôm nay</span>
            <div className="text-3xl font-black text-slate-900 font-mono mt-1">
              {totalStats.todayReceipts}
            </div>
            <span className="text-[10px] font-bold text-blue-600 mt-1 block">Lượt vào xưởng</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Đang thi công */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đang sửa chữa</span>
            <div className="text-3xl font-black text-slate-900 font-mono mt-1">
              {totalStats.executingCount}
            </div>
            <span className="text-[10px] font-bold text-amber-600 mt-1 block">Xe trên cầu nâng</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Chờ bàn giao */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sẵn sàng bàn giao</span>
            <div className="text-3xl font-black text-slate-900 font-mono mt-1">
              {totalStats.handoverCount}
            </div>
            <span className="text-[10px] font-bold text-indigo-600 mt-1 block">Đã hoàn tất kỹ thuật</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Doanh thu hoàn thành hôm nay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Doanh thu hôm nay</span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {totalStats.dailyRevenue.toLocaleString('vi-VN')}đ
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              Tuần: {totalStats.weeklyRevenue.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Vehicle Orders List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Biển số, Tên xe, Khách hàng, SĐT, Mã đơn..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({forms.length})
            </button>
            {Object.values(VehicleStatus).map(status => {
              const count = forms.filter(f => f.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-6">Mã & Biển số xe</th>
                <th className="py-3.5 px-4">Phương tiện</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Trạng thái xử lý</th>
                <th className="py-3.5 px-4 text-right">Chi phí tạm tính</th>
                <th className="py-3.5 px-4">Ngày vào</th>
                <th className="py-3.5 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredForms.length > 0 ? (
                filteredForms.map(form => (
                  <tr key={form.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Order Code & License Plate */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-mono font-black text-xs px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
                          {form.plateNumber || 'CHƯA CÓ'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {form.orderCode || form.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 uppercase">
                        {form.brand} {form.carName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        ODO: <span className="font-mono font-bold">{Number(form.odometer || 0).toLocaleString()} km</span> • {form.modelYear || ''}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{form.customerName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{form.phone || 'Chưa có SĐT'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeStyle(form.status)}`}>
                        {form.status}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 text-right font-mono font-black text-slate-900 text-xs">
                      {(form.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                      {form.dateIn || form.createdAt?.split('T')[0] || ''}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewForm(form)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                          title="Xem chi tiết & xử lý hồ sơ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        {currentUser.role === UserRole.ADMIN && (
                          <button
                            onClick={() => onDeleteForm(form.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Xoá phiếu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Car className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-bold text-xs uppercase tracking-wider">Không tìm thấy phiếu sửa chữa nào</p>
                    <p className="text-[11px] text-slate-400 mt-1">Bấm nút "Tiếp nhận xe mới" ở trên để tạo phiếu đầu tiên</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
