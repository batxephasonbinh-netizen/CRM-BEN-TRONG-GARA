import React, { useState } from 'react';
import { BusinessSettings } from '../types';
import {
  Settings,
  Building,
  Image,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Clock,
  FileText,
  Save,
  CheckCircle2
} from 'lucide-react';

interface BusinessSettingsViewProps {
  settings: BusinessSettings;
  onSave: (settings: BusinessSettings) => Promise<void> | void;
}

export const BusinessSettingsView: React.FC<BusinessSettingsViewProps> = ({
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu cấu hình doanh nghiệp.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>Thông Tin Thương Hiệu Doanh Nghiệp & Garage</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Thông tin này sẽ được in trên đầu Phiếu Tiếp Nhận, Báo Giá Sửa Chữa và Hóa Đơn Khách Hàng
          </p>
        </div>

        {showSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          {/* Logo & Garage Name Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Xem trước tiêu đề</span>
              <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight truncate">
                {formData.garageName || 'TÊN GARAGE CỦA BẠN'}
              </h2>
              <p className="text-xs text-slate-500 truncate">{formData.address || 'Địa chỉ garage...'}</p>
              <p className="text-xs text-slate-500">Hotline: {formData.phone || '09xx.xxx.xxx'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Tên Garage / Doanh nghiệp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.garageName}
                onChange={e => setFormData({ ...formData, garageName: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:bg-white focus:border-blue-600 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Đường dẫn hình ảnh Logo (URL)
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-600 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Địa chỉ Garage
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Số điện thoại Hotline
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0988.123.456"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@garage.vn"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="bentronggara.vn"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Mã số thuế (nếu có)
              </label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={e => setFormData({ ...formData, taxCode: e.target.value })}
                placeholder="0101234567"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Thông tin tài khoản ngân hàng nhận thanh toán (In trên hóa đơn)
              </label>
              <input
                type="text"
                value={formData.bankInfo}
                onChange={e => setFormData({ ...formData, bankInfo: e.target.value })}
                placeholder="VD: 1903xxx - Techcombank - NGUYEN VAN A"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Giờ làm việc
              </label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="VD: Thứ 2 - Thứ 7: 7h30 - 18h00 | Chủ nhật: 8h00 - 12h00"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Chính sách bảo hành & Ghi chú chân trang in
              </label>
              <textarea
                rows={3}
                value={formData.note}
                onChange={e => setFormData({ ...formData, note: e.target.value })}
                placeholder="VD: Phụ tùng chính hãng được bảo hành 12 tháng hoặc 20.000km..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettingsView;
