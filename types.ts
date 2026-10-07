export enum UserRole {
  ADMIN = 'ADMIN',
  ADVISOR = 'ADVISOR',
  TECHNICIAN = 'TECHNICIAN'
}

export enum VehicleStatus {
  INTAKE = 'Tiếp nhận & Kiểm tra',
  EXECUTING = 'Kỹ thuật thi công',
  TECH_CHECK = 'Kiểm tra kỹ thuật cuối',
  HANDOVER = 'Bàn giao & Quyết toán',
  COMPLETED = 'Đã hoàn thành'
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: 'PENDING' | 'EXECUTING' | 'DONE'; // Upgraded checklist capability
  timestamp?: string; // Checklist timestamp tracking
  isDone?: boolean; // Keep for backward compatibility
}

export interface UserAccount {
  id: string;
  username: string; // Used for email/username login
  password?: string;
  name: string;
  role: UserRole;
  allowedStages: VehicleStatus[];
}

export interface VehicleImages {
  front?: string;
  rear?: string;
  left?: string;
  right?: string;
  interior?: string;
  engine?: string;
}

export interface IntakeForm {
  id: string;
  orderCode: string; // e.g., GR202600001 (generated sequentially)
  createdAt: string;
  advisorId: string;
  status: VehicleStatus;
  
  // Vehicle Info
  plateNumber: string;
  brand: string;
  color: string;
  modelYear: string;
  carName: string;
  vin: string;
  odometer: string; // current_km
  inspectionExpiry: string;
  dateIn: string;
  dateOut: string;
  
  // Customer Info
  customerName: string;
  customerNamePrinted: string;
  gender: 'Nam' | 'Nữ' | '';
  company: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  birthday: string;
  source: string;
  salesPerson: string;
  
  // Services
  services: string[]; // List of checkbox services initial
  detailedServices: ServiceItem[]; // Concrete itemized proposal
  otherRequests: string;
  
  // Inspections & Surveys
  interiorSurvey: Record<string, string>;
  condition: Record<string, string>;
  fuelLevel: number;
  techNotes: string; // Tech journal notes
  
  // Finances
  discount: number;
  tax: number;
  totalAmount: number;
  
  // Vehicle Images
  vehicleImages?: VehicleImages;
  
  // Customer Signatures
  intakeSignature: string | null;
  handoverSignature: string | null;
  advisorSignature?: string | null; // Signature of service advisor
  advisorName: string;
}

// ==========================================================================
// PHỤ TÙNG / KHO / TỒN KHO
// ==========================================================================
export interface Part {
  id: string;
  sku: string; // Mã phụ tùng, VD: PT00001
  name: string;
  category: string; // Nhóm: Dầu nhớt, Lọc gió, Phanh, Điện, Lốp...
  unit: string; // Đơn vị: cái, lít, bộ, hộp...
  costPrice: number; // Giá nhập
  sellPrice: number; // Giá bán ra khách
  quantityOnHand: number; // Tồn kho hiện tại
  minQuantityThreshold: number; // Ngưỡng cảnh báo sắp hết
  supplier?: string;
  location?: string; // Vị trí kệ/kho
  createdAt: string;
  updatedAt: string;
}

export type StockTransactionType = 'IMPORT' | 'EXPORT' | 'ADJUST';

export interface StockTransaction {
  id: string;
  partId: string;
  partName: string;
  type: StockTransactionType;
  quantity: number;
  relatedOrderCode?: string; // Mã phiếu sửa xe / báo giá liên quan
  note?: string;
  createdBy: string;
  createdAt: string;
}

export const getPartStockLevel = (part: Part): 'OK' | 'LOW' | 'OUT' => {
  if (part.quantityOnHand <= 0) return 'OUT';
  if (part.quantityOnHand <= part.minQuantityThreshold) return 'LOW';
  return 'OK';
};

// ==========================================================================
// BÁO GIÁ
// ==========================================================================
export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
export type QuoteItemGroup = 'SERVICE' | 'PRODUCT' | 'OTHER';
export type DiscountType = 'PERCENT' | 'AMOUNT';

export interface QuoteLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  partId?: string; // Nếu chọn từ Kho phụ tùng
}

export interface Quote {
  id: string;
  quoteCode: string; // VD: BG202600001
  createdAt: string;
  validUntil?: string;
  status: QuoteStatus;
  advisorId: string;
  advisorName: string;

  // Customer & vehicle info (giống khối trên cùng phiếu tiếp nhận)
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  plateNumber: string;
  brand?: string;
  carName?: string;
  modelYear?: string;
  vin?: string;
  odometer?: string;

  // 3 nhóm mục tách riêng
  serviceItems: QuoteLineItem[];
  productItems: QuoteLineItem[];
  otherItems: QuoteLineItem[];

  discountType: DiscountType;
  discountValue: number;
  tax: number; // % thuế VAT nếu có
  note?: string;

  convertedOrderId?: string; // id của IntakeForm được tạo ra từ báo giá này
}

export const computeQuoteTotals = (quote: Quote) => {
  const allItems = [...quote.serviceItems, ...quote.productItems, ...quote.otherItems];
  const subtotal = allItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = quote.discountType === 'PERCENT'
    ? Math.round(subtotal * (quote.discountValue || 0) / 100)
    : (quote.discountValue || 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * (quote.tax || 0) / 100);
  const total = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
};

// ==========================================================================
// THÔNG TIN DOANH NGHIỆP
// ==========================================================================
export interface BusinessSettings {
  id: string;
  garageName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxCode: string;
  bankInfo: string;
  workingHours: string;
  note: string;
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  id: 'business-settings-singleton',
  garageName: 'BÊN TRONG GARA',
  logoUrl: 'https://asiacar.vn/upload/filemanager/files/logo-qt.png',
  address: 'Đường 454, An Đô, Thái Bình',
  phone: '0988.123.456',
  email: '',
  website: 'bentronggara.vn',
  taxCode: '',
  bankInfo: '',
  workingHours: '',
  note: ''
};

// Relational Structures for Supabase mappings
export interface DBCustomer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export interface DBVehicle {
  id: string;
  customer_id: string;
  license_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year?: string;
  vin?: string;
  current_km: number;
  created_at?: string;
}

export interface DBServiceOrder {
  id: string;
  order_code: string;
  customer_id: string;
  vehicle_id: string;
  advisor_id: string;
  status: string;
  received_date: string;
  expected_delivery?: string;
  completed_date?: string;
  total_amount: number;
  created_at?: string;
}
