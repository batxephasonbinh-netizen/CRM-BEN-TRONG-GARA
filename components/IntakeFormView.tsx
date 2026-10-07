import React, { useState, useRef } from 'react';
import {
  IntakeForm,
  UserAccount,
  VehicleStatus,
  ServiceItem,
  VehicleImages
} from '../types';
import {
  SERVICE_CHECKLIST,
  SOURCE_OPTIONS,
  INTERIOR_SURVEY_ITEMS,
  CONDITION_ITEMS
} from '../constants';
import {
  Car,
  User,
  ClipboardList,
  Wrench,
  Camera,
  PenTool,
  Printer,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';

interface IntakeFormViewProps {
  onSave: (form: IntakeForm) => Promise<void> | void;
  onCancel: () => void;
  currentUser: UserAccount;
  initialData?: IntakeForm;
  existingForms: IntakeForm[];
}

export const IntakeFormView: React.FC<IntakeFormViewProps> = ({
  onSave,
  onCancel,
  currentUser,
  initialData,
  existingForms
}) => {
  const isEditing = Boolean(initialData && initialData.id && initialData.orderCode);

  const generateOrderCode = () => {
    const year = new Date().getFullYear();
    const count = existingForms.length + 1;
    return `GR${year}${String(count).padStart(5, '0')}`;
  };

  const [formData, setFormData] = useState<IntakeForm>(() => {
    if (initialData) {
      return {
        ...initialData,
        detailedServices: initialData.detailedServices || [],
        services: initialData.services || [],
        interiorSurvey: initialData.interiorSurvey || {},
        condition: initialData.condition || {},
        vehicleImages: initialData.vehicleImages || {}
      };
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      orderCode: generateOrderCode(),
      createdAt: new Date().toISOString(),
      advisorId: currentUser.id,
      advisorName: currentUser.name,
      status: VehicleStatus.INTAKE,

      plateNumber: '',
      brand: '',
      color: '',
      modelYear: '',
      carName: '',
      vin: '',
      odometer: '',
      inspectionExpiry: '',
      dateIn: new Date().toISOString().split('T')[0],
      dateOut: '',

      customerName: '',
      customerNamePrinted: '',
      gender: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      district: '',
      city: '',
      birthday: '',
      source: SOURCE_OPTIONS[0],
      salesPerson: currentUser.name,

      services: [],
      detailedServices: [],
      otherRequests: '',

      interiorSurvey: {},
      condition: {},
      fuelLevel: 50,
      techNotes: '',

      discount: 0,
      tax: 0,
      totalAmount: 0,

      vehicleImages: {},
      intakeSignature: null,
      handoverSignature: null
    };
  });

  const [activeTab, setActiveTab] = useState<'INFO' | 'SURVEY' | 'SERVICES' | 'MEDIA_SIGN' | 'PRINT'>('INFO');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);
  const [newServiceQty, setNewServiceQty] = useState<number>(1);

  // Signature canvas refs
  const intakeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isIntakeDrawing, setIsIntakeDrawing] = useState(false);
  const [isHandoverDrawing, setIsHandoverDrawing] = useState(false);

  // Recalculate totals
  const recalculateTotal = (
    services: ServiceItem[],
    discount: number,
    taxPercent: number
  ) => {
    const subtotal = services.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
    return afterDiscount + taxAmount;
  };

  const updateField = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'discount' || key === 'tax') {
        next.totalAmount = recalculateTotal(
          next.detailedServices,
          Number(next.discount) || 0,
          Number(next.tax) || 0
        );
      }
      return next;
    });
  };

  const handleToggleChecklistService = (serviceName: string) => {
    setFormData(prev => {
      const exists = prev.services.includes(serviceName);
      let nextServices: string[];
      let nextDetailed = [...prev.detailedServices];

      if (exists) {
        nextServices = prev.services.filter(s => s !== serviceName);
      } else {
        nextServices = [...prev.services, serviceName];
        // Also add to detailed services if not present
        if (!nextDetailed.some(d => d.name === serviceName)) {
          nextDetailed.push({
            id: Math.random().toString(36).substr(2, 9),
            name: serviceName,
            price: 0,
            quantity: 1,
            status: 'PENDING',
            isDone: false
          });
        }
      }

      const total = recalculateTotal(nextDetailed, prev.discount, prev.tax);
      return {
        ...prev,
        services: nextServices,
        detailedServices: nextDetailed,
        totalAmount: total
      };
    });
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newItem: ServiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 0,
      quantity: Number(newServiceQty) || 1,
      status: 'PENDING',
      isDone: false
    };

    const nextDetailed = [...formData.detailedServices, newItem];
    const total = recalculateTotal(nextDetailed, formData.discount, formData.tax);

    setFormData(prev => ({
      ...prev,
      detailedServices: nextDetailed,
      totalAmount: total
    }));

    setNewServiceName('');
    setNewServicePrice(0);
    setNewServiceQty(1);
  };

  const handleRemoveService = (id: string) => {
    const nextDetailed = formData.detailedServices.filter(s => s.id !== id);
    const total = recalculateTotal(nextDetailed, formData.discount, formData.tax);
    setFormData(prev => ({
      ...prev,
      detailedServices: nextDetailed,
      totalAmount: total
    }));
  };

  const handleUpdateServiceItem = (id: string, updates: Partial<ServiceItem>) => {
    const nextDetailed = formData.detailedServices.map(s => {
      if (s.id === id) {
        return { ...s, ...updates };
      }
      return s;
    });
    const total = recalculateTotal(nextDetailed, formData.discount, formData.tax);
    setFormData(prev => ({
      ...prev,
      detailedServices: nextDetailed,
      totalAmount: total
    }));
  };

  // Image Upload Handler
  const handleImageUpload = (slot: keyof VehicleImages, file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        vehicleImages: {
          ...prev.vehicleImages,
          [slot]: result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing functions for signature
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    type: 'intake' | 'handover'
  ) => {
    const canvas = type === 'intake' ? intakeCanvasRef.current : handoverCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);

    if (type === 'intake') setIsIntakeDrawing(true);
    else setIsHandoverDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    type: 'intake' | 'handover'
  ) => {
    const isDrawing = type === 'intake' ? isIntakeDrawing : isHandoverDrawing;
    if (!isDrawing) return;

    const canvas = type === 'intake' ? intakeCanvasRef.current : handoverCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (type: 'intake' | 'handover') => {
    const canvas = type === 'intake' ? intakeCanvasRef.current : handoverCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      if (type === 'intake') {
        setIsIntakeDrawing(false);
        setFormData(prev => ({ ...prev, intakeSignature: dataUrl }));
      } else {
        setIsHandoverDrawing(false);
        setFormData(prev => ({ ...prev, handoverSignature: dataUrl }));
      }
    }
  };

  const clearCanvas = (type: 'intake' | 'handover') => {
    const canvas = type === 'intake' ? intakeCanvasRef.current : handoverCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (type === 'intake') {
        setFormData(prev => ({ ...prev, intakeSignature: null }));
      } else {
        setFormData(prev => ({ ...prev, handoverSignature: null }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plateNumber.trim()) {
      alert('Vui lòng nhập Biển số xe!');
      setActiveTab('INFO');
      return;
    }
    if (!formData.customerName.trim()) {
      alert('Vui lòng nhập Tên khách hàng!');
      setActiveTab('INFO');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                {formData.orderCode}
              </span>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {isEditing ? 'Cập Nhật Hồ Sơ Tiếp Nhận Xe' : 'Tạo Hồ Sơ Tiếp Nhận Xe Mới'}
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Cố vấn lập: <strong className="text-slate-700">{formData.advisorName || currentUser.name}</strong> • Ngày lập: {formData.dateIn}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveTab('PRINT')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Xem & In Phiếu A4</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Hồ Sơ Xe</span>
          </button>
        </div>
      </div>

      {/* Stepper / Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'INFO'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>1. Xe & Khách Hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SURVEY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'SURVEY'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>2. Khảo Sát Tình Trạng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SERVICES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'SERVICES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>3. Hạng Mục Dịch Vụ & Chi Phí</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MEDIA_SIGN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'MEDIA_SIGN'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>4. Ảnh Xe & Ký Nhận</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRINT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'PRINT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>5. In Ấn & Hoá Đơn</span>
        </button>
      </div>

      {/* TAB 1: VEHICLE & CUSTOMER INFO */}
      {activeTab === 'INFO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Info Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Thông Tin Phương Tiện Tiếp Nhận</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Biển số xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 30A-999.99"
                  value={formData.plateNumber}
                  onChange={e => updateField('plateNumber', e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 uppercase focus:bg-white focus:border-blue-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Hãng xe & Model
                </label>
                <input
                  type="text"
                  placeholder="VD: Toyota Vios"
                  value={formData.brand}
                  onChange={e => updateField('brand', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Tên xe / Phiên bản
                </label>
                <input
                  type="text"
                  placeholder="VD: Vios 1.5G CVT"
                  value={formData.carName}
                  onChange={e => updateField('carName', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Màu sắc & Năm sản xuất
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Màu xe"
                    value={formData.color}
                    onChange={e => updateField('color', e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Năm SX"
                    value={formData.modelYear}
                    onChange={e => updateField('modelYear', e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Số ODO hiện tại (Km)
                </label>
                <input
                  type="number"
                  placeholder="VD: 45000"
                  value={formData.odometer}
                  onChange={e => updateField('odometer', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Số khung (VIN)
                </label>
                <input
                  type="text"
                  placeholder="17 ký tự VIN..."
                  value={formData.vin}
                  onChange={e => updateField('vin', e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Ngày tiếp nhận vào xưởng
                </label>
                <input
                  type="date"
                  value={formData.dateIn}
                  onChange={e => updateField('dateIn', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Dự kiến ngày bàn giao
                </label>
                <input
                  type="date"
                  value={formData.dateOut}
                  onChange={e => updateField('dateOut', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Trạng thái quy trình hiện tại */}
            <div className="pt-2">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Giai đoạn tiến độ xưởng
              </label>
              <select
                value={formData.status}
                onChange={e => updateField('status', e.target.value as VehicleStatus)}
                className="w-full p-3 bg-blue-50/60 border border-blue-200 rounded-xl font-bold text-blue-900 text-xs outline-none"
              >
                {Object.values(VehicleStatus).map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Thông Tin Chủ Phương Tiện</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Họ và tên khách hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn Anh"
                  value={formData.customerName}
                  onChange={e => {
                    updateField('customerName', e.target.value);
                    if (!formData.customerNamePrinted) {
                      updateField('customerNamePrinted', e.target.value);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="VD: 0988123456"
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Tên in hóa đơn / Xuất chứng từ
                </label>
                <input
                  type="text"
                  placeholder="Tên pháp nhân hoặc cá nhân"
                  value={formData.customerNamePrinted}
                  onChange={e => updateField('customerNamePrinted', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Công ty / Tổ chức
                </label>
                <input
                  type="text"
                  placeholder="Tên công ty (nếu có)"
                  value={formData.company}
                  onChange={e => updateField('company', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Địa chỉ thường trú / Trụ sở
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường xã..."
                  value={formData.address}
                  onChange={e => updateField('address', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Nguồn khách hàng
                </label>
                <select
                  value={formData.source}
                  onChange={e => updateField('source', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {SOURCE_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SURVEY & CONDITION */}
      {activeTab === 'SURVEY' && (
        <div className="space-y-6">
          {/* Fuel Level Slider */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                Mức nhiên liệu lúc nhận xe:
              </span>
              <span className="font-mono font-black text-sm px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
                {formData.fuelLevel}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.fuelLevel}
              onChange={e => updateField('fuelLevel', Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-1">
              <span>E (Trống)</span>
              <span>1/4</span>
              <span>1/2 (Nửa bình)</span>
              <span>3/4</span>
              <span>F (Đầy bình)</span>
            </div>
          </div>

          {/* Interior Equipment Checklist */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight border-b border-slate-100 pb-3">
              1. Khảo Sát Phụ Kiện & Thiết Bị Theo Xe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {INTERIOR_SURVEY_ITEMS.map(item => {
                const currentVal = formData.interiorSurvey?.[item.key] || item.options[0];
                return (
                  <div key={item.key} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">{item.label}</span>
                    <div className="flex gap-1">
                      {item.options.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              interiorSurvey: {
                                ...prev.interiorSurvey,
                                [item.key]: opt
                              }
                            }));
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            currentVal === opt
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exterior & Body Condition */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight border-b border-slate-100 pb-3">
              2. Tình Trạng Thân Vỏ & Kính Xe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {CONDITION_ITEMS.map(item => {
                const currentVal = formData.condition?.[item.key] || item.options[1] || item.options[0];
                return (
                  <div key={item.key} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 truncate mr-2">{item.label}</span>
                    <div className="flex gap-1 shrink-0">
                      {item.options.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              condition: {
                                ...prev.condition,
                                [item.key]: opt
                              }
                            }));
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            currentVal === opt
                              ? opt === 'Bình thường' || opt === 'Có'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tech Notes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <label className="text-xs font-black uppercase text-slate-900 tracking-tight">
              Ghi chú hiện trạng & Yêu cầu của khách:
            </label>
            <textarea
              rows={3}
              placeholder="VD: Khách yêu cầu kiểm tra tiếng kêu lục cục gầm trước, vệ sinh buồng đốt..."
              value={formData.techNotes}
              onChange={e => updateField('techNotes', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICING */}
      {activeTab === 'SERVICES' && (
        <div className="space-y-6">
          {/* Quick Select Checklist */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">
              Chọn nhanh gói dịch vụ phổ biến:
            </h3>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CHECKLIST.map(service => {
                const checked = formData.services.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleToggleChecklistService(service)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      checked
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {checked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{service}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom service row */}
          <form onSubmit={handleAddCustomService} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight mb-3">
              Thêm hạng mục dịch vụ / phụ tùng chi tiết:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="Tên phụ tùng / công sửa chữa..."
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="Đơn giá (VNĐ)"
                  value={newServicePrice || ''}
                  onChange={e => setNewServicePrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-1">
                <input
                  type="number"
                  min="1"
                  placeholder="SL"
                  value={newServiceQty}
                  onChange={e => setNewServiceQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  + Thêm dòng
                </button>
              </div>
            </div>
          </form>

          {/* Detailed Services Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                Danh sách hạng mục nghiệm thu ({formData.detailedServices.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-3 px-6">Tên hạng mục dịch vụ / phụ tùng</th>
                    <th className="py-3 px-4 text-center">Tiến độ thi công</th>
                    <th className="py-3 px-4 text-center">Số lượng</th>
                    <th className="py-3 px-4 text-right">Đơn giá</th>
                    <th className="py-3 px-4 text-right">Thành tiền</th>
                    <th className="py-3 px-6 text-center">Xoá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.detailedServices.length > 0 ? (
                    formData.detailedServices.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-6 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={item.status || 'PENDING'}
                            onChange={e =>
                              handleUpdateServiceItem(item.id, {
                                status: e.target.value as any,
                                isDone: e.target.value === 'DONE'
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              item.status === 'DONE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'EXECUTING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="PENDING">Chưa làm</option>
                            <option value="EXECUTING">Đang sửa</option>
                            <option value="DONE">Hoàn thành</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e =>
                              handleUpdateServiceItem(item.id, {
                                quantity: Number(e.target.value) || 1
                              })
                            }
                            className="w-14 text-center p-1 border border-slate-200 rounded font-mono font-bold"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                          <input
                            type="number"
                            value={item.price}
                            onChange={e =>
                              handleUpdateServiceItem(item.id, {
                                price: Number(e.target.value) || 0
                              })
                            }
                            className="w-28 text-right p-1 border border-slate-200 rounded font-mono font-bold"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveService(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold text-xs">
                        Chưa có hạng mục dịch vụ nào. Hãy chọn hoặc nhập ở trên.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Box */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Chiết khấu (VNĐ):</span>
                  <input
                    type="number"
                    value={formData.discount || ''}
                    onChange={e => updateField('discount', Number(e.target.value) || 0)}
                    placeholder="0"
                    className="p-2 bg-white border border-slate-200 rounded-lg w-32 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Thuế VAT (%):</span>
                  <input
                    type="number"
                    value={formData.tax || ''}
                    onChange={e => updateField('tax', Number(e.target.value) || 0)}
                    placeholder="0"
                    className="p-2 bg-white border border-slate-200 rounded-lg w-20 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Tổng cộng thanh toán
                </span>
                <span className="text-2xl font-black text-emerald-600 font-mono inline-block">
                  {(formData.totalAmount || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VEHICLE PHOTOS & DIGITAL SIGNATURE */}
      {activeTab === 'MEDIA_SIGN' && (
        <div className="space-y-6">
          {/* 6 Angle Vehicle Photos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Chụp / Tải Lên Ảnh Hiện Trạng Xe (6 Góc Nhìn)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(
                [
                  { slot: 'front', label: 'Đầu xe' },
                  { slot: 'rear', label: 'Đuôi xe' },
                  { slot: 'left', label: 'Sườn trái' },
                  { slot: 'right', label: 'Sườn phải' },
                  { slot: 'interior', label: 'Khoang lái' },
                  { slot: 'engine', label: 'Khoang máy' }
                ] as const
              ).map(({ slot, label }) => {
                const img = formData.vehicleImages?.[slot];
                return (
                  <div key={slot} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</span>
                    <label className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 flex flex-col items-center justify-center p-2 cursor-pointer transition-all relative overflow-hidden group">
                      {img ? (
                        <>
                          <img src={img} alt={label} className="w-full h-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            Đổi ảnh
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-6 h-6 mx-auto text-slate-400 group-hover:text-blue-600 transition-colors" />
                          <span className="text-[9px] font-bold text-slate-400 block mt-1">+ Thêm ảnh</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(slot, file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Intake Signature */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                  Chữ ký Khách hàng (Lúc nhận xe)
                </span>
                <button
                  type="button"
                  onClick={() => clearCanvas('intake')}
                  className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xoá ký lại</span>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2">
                <canvas
                  ref={intakeCanvasRef}
                  width={340}
                  height={150}
                  className="signature-canvas w-full h-[150px] cursor-crosshair"
                  onMouseDown={e => startDrawing(e, 'intake')}
                  onMouseMove={e => draw(e, 'intake')}
                  onMouseUp={() => stopDrawing('intake')}
                  onMouseLeave={() => stopDrawing('intake')}
                  onTouchStart={e => startDrawing(e, 'intake')}
                  onTouchMove={e => draw(e, 'intake')}
                  onTouchEnd={() => stopDrawing('intake')}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Khách hàng ký trực tiếp bằng ngón tay trên màn hình hoặc chuột
              </p>
            </div>

            {/* Handover Signature */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                  Chữ ký Khách hàng (Lúc bàn giao xe)
                </span>
                <button
                  type="button"
                  onClick={() => clearCanvas('handover')}
                  className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xoá ký lại</span>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2">
                <canvas
                  ref={handoverCanvasRef}
                  width={340}
                  height={150}
                  className="signature-canvas w-full h-[150px] cursor-crosshair"
                  onMouseDown={e => startDrawing(e, 'handover')}
                  onMouseMove={e => draw(e, 'handover')}
                  onMouseUp={() => stopDrawing('handover')}
                  onMouseLeave={() => stopDrawing('handover')}
                  onTouchStart={e => startDrawing(e, 'handover')}
                  onTouchMove={e => draw(e, 'handover')}
                  onTouchEnd={() => stopDrawing('handover')}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Xác nhận đã kiểm tra đủ hiện trạng xe khi nhận lại xe
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRINT PREVIEW & EXPORT A4 */}
      {activeTab === 'PRINT' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay (Ctrl + P)</span>
            </button>
          </div>

          {/* A4 Form Printable Box */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-lg max-w-4xl mx-auto text-slate-900 text-xs font-sans print:p-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-blue-900">
                  BÊN TRONG GARA - TRUNG TÂM CHĂM SÓC & SỬA CHỮA Ô TÔ
                </h2>
                <p className="text-[11px] text-slate-600 mt-1">Đường 454, An Đô, Thái Bình • Hotline: 0988.123.456</p>
                <p className="text-[11px] text-slate-600">Website: bentronggara.vn</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-black font-mono text-slate-900">{formData.orderCode}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Ngày vào: {formData.dateIn}</div>
              </div>
            </div>

            <h3 className="text-center text-lg font-black uppercase tracking-wider mb-6 text-slate-900">
              PHIẾU TIẾP NHẬN & BÁO GIÁ DỊCH VỤ SỬA CHỮA Ô TÔ
            </h3>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50/50">
              <div>
                <p><strong>Khách hàng:</strong> {formData.customerName || 'N/A'}</p>
                <p className="mt-1"><strong>Số điện thoại:</strong> {formData.phone || 'N/A'}</p>
                <p className="mt-1"><strong>Địa chỉ:</strong> {formData.address || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Biển số xe:</strong> <span className="font-mono font-bold text-blue-700">{formData.plateNumber || 'N/A'}</span></p>
                <p className="mt-1"><strong>Loại xe:</strong> {formData.brand} {formData.carName}</p>
                <p className="mt-1"><strong>Số ODO:</strong> {Number(formData.odometer || 0).toLocaleString()} Km • <strong>Nhiên liệu:</strong> {formData.fuelLevel}%</p>
              </div>
            </div>

            {/* Services Table */}
            <table className="w-full text-left text-xs border border-slate-200 mb-6">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-[10px]">
                  <th className="p-2 border-r border-slate-200 w-12 text-center">STT</th>
                  <th className="p-2 border-r border-slate-200">Hạng mục công việc / Phụ tùng</th>
                  <th className="p-2 border-r border-slate-200 text-center w-16">SL</th>
                  <th className="p-2 border-r border-slate-200 text-right w-28">Đơn giá</th>
                  <th className="p-2 text-right w-32">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {formData.detailedServices.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{item.name}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{item.quantity}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{item.price.toLocaleString('vi-VN')}đ</td>
                    <td className="p-2 text-right font-mono font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-bold bg-slate-50">
                  <td colSpan={4} className="p-2 text-right border-r border-slate-200 uppercase text-[10px]">
                    Giảm giá:
                  </td>
                  <td className="p-2 text-right font-mono">{(formData.discount || 0).toLocaleString('vi-VN')}đ</td>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <td colSpan={4} className="p-2 text-right border-r border-slate-200 uppercase text-[10px]">
                    Thuế VAT ({formData.tax || 0}%):
                  </td>
                  <td className="p-2 text-right font-mono">
                    {Math.round(((formData.totalAmount - (formData.totalAmount / (1 + (formData.tax || 0) / 100))) || 0)).toLocaleString('vi-VN')}đ
                  </td>
                </tr>
                <tr className="font-black text-sm bg-slate-100">
                  <td colSpan={4} className="p-2.5 text-right border-r border-slate-200 uppercase">
                    Tổng cộng thanh toán:
                  </td>
                  <td className="p-2.5 text-right font-mono text-blue-900">
                    {(formData.totalAmount || 0).toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures Row */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center">
              <div>
                <p className="font-bold uppercase text-[11px]">KHÁCH HÀNG KÝ XÁC NHẬN</p>
                <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                <div className="h-24 flex items-center justify-center my-2">
                  {formData.intakeSignature ? (
                    <img src={formData.intakeSignature} alt="Chữ ký khách" className="max-h-20 max-w-[200px] object-contain" />
                  ) : (
                    <span className="text-slate-300 italic text-xs">Chưa có chữ ký</span>
                  )}
                </div>
                <p className="font-bold">{formData.customerName}</p>
              </div>

              <div>
                <p className="font-bold uppercase text-[11px]">ĐẠI DIỆN GARA / CỐ VẤN DỊCH VỤ</p>
                <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                <div className="h-24 flex items-center justify-center my-2">
                  <span className="text-blue-800 font-bold italic font-serif text-lg">{formData.advisorName}</span>
                </div>
                <p className="font-bold">{formData.advisorName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakeFormView;
