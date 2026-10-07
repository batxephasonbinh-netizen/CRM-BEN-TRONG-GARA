import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  IntakeForm, VehicleStatus, ServiceItem, UserAccount,
  Part, StockTransaction, StockTransactionType,
  Quote, BusinessSettings, DEFAULT_BUSINESS_SETTINGS
} from './types';
import { SAMPLE_FORMS, SAMPLE_PARTS, SAMPLE_STOCK_TRANSACTIONS } from './sampleData';

// ==========================================================================
// RUNTIME SUPABASE CONFIGURATION
// Trước đây URL/Key chỉ đọc được từ biến môi trường lúc BUILD (import.meta.env),
// nghĩa là muốn đổi kết nối phải build lại toàn bộ ứng dụng. Giờ đây cấu hình có
// thể được nhập trực tiếp trên UI (trang "Kết nối Supabase"), lưu vào
// localStorage, và được ưu tiên đọc trước biến môi trường ngay khi app khởi động.
// ==========================================================================

const RUNTIME_CONFIG_KEY = 'garage_supabase_runtime_config';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export const getRuntimeSupabaseConfig = (): SupabaseRuntimeConfig | null => {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.url && parsed?.anonKey) return parsed;
    return null;
  } catch {
    return null;
  }
};

const resolveSupabaseConfig = (): SupabaseRuntimeConfig => {
  const runtime = getRuntimeSupabaseConfig();
  if (runtime) return runtime;
  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
  };
};

const activeConfig = resolveSupabaseConfig();

export const isSupabaseConfigured = !!(activeConfig.url && activeConfig.anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(activeConfig.url, activeConfig.anonKey)
  : null;

// Nguồn gốc cấu hình đang dùng, để hiển thị cho Admin biết (runtime UI hay .env)
export const supabaseConfigSource: 'RUNTIME' | 'ENV' | 'NONE' = getRuntimeSupabaseConfig()
  ? 'RUNTIME'
  : (isSupabaseConfigured ? 'ENV' : 'NONE');

export const getActiveSupabaseUrl = (): string => activeConfig.url;

/**
 * Lưu cấu hình Supabase (URL + Anon Key) do người dùng nhập trên UI vào localStorage.
 * Vì client Supabase được khởi tạo 1 lần lúc module load, sau khi lưu cấu hình mới
 * cần tải lại trang (reload) để áp dụng — hàm gọi ở UI sẽ tự reload.
 */
export const saveSupabaseRuntimeConfig = (url: string, anonKey: string) => {
  const config: SupabaseRuntimeConfig = { url: url.trim(), anonKey: anonKey.trim() };
  localStorage.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(config));
};

export const clearSupabaseRuntimeConfig = () => {
  localStorage.removeItem(RUNTIME_CONFIG_KEY);
};

/**
 * Kiểm tra kết nối tới 1 cặp URL/Key bất kỳ (không nhất thiết là cấu hình đang hoạt động).
 * Dùng cho nút "Kiểm tra kết nối" trước khi người dùng lưu & reload trang.
 */
export const testSupabaseConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  if (!url || !anonKey) {
    return { success: false, message: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key.' };
  }
  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    const { error } = await testClient.from('customers').select('id', { count: 'exact', head: true });
    if (error) {
      // Bảng chưa tồn tại vẫn coi là kết nối OK (chỉ chưa chạy script DDL)
      if (error.code === '42P01' || /relation .* does not exist/i.test(error.message || '')) {
        return { success: true, message: 'Kết nối thành công! Tuy nhiên chưa thấy bảng dữ liệu — hãy chạy script SQL tạo bảng bên dưới.' };
      }
      return { success: false, message: `Kết nối được tới Supabase nhưng có lỗi truy vấn: ${error.message}` };
    }
    return { success: true, message: 'Kết nối thành công tới Supabase!' };
  } catch (err: any) {
    return { success: false, message: `Không thể kết nối: ${err?.message || 'Kiểm tra lại URL/Key.'}` };
  }
};

// ==========================================================================
// DDL schema đầy đủ cho tất cả các bảng (bảng cũ + 4 phần nâng cấp mới)
// ==========================================================================
export const SUPABASE_SQL_DDL = `-- SCRIPT TẠO DATABASE CHUẨN GARAGE "BÊN TRONG GARA"
-- Copy-paste tập lệnh này vào Supabase SQL Editor và chạy nó.

-- 1. Bảng Customers (Khách hàng)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Vehicles (Xe cộ)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_brand TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year TEXT,
    vin TEXT,
    current_km INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng Service Orders (Phiếu sửa chữa)
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    advisor_id TEXT NOT NULL,
    status TEXT NOT NULL,
    received_date TEXT NOT NULL,
    expected_delivery TEXT,
    completed_date TEXT,
    total_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng Service Items (Chi tiết dịch vụ phụ tùng)
CREATE TABLE IF NOT EXISTS service_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    total NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bảng Vehicle Inspections (Khảo sát, hiện trạng checklist)
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL, -- 'interior' hoặc 'condition'
    item_name TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Bảng Vehicle Images (Hình ảnh xe các góc)
CREATE TABLE IF NOT EXISTS vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT NOT NULL, -- 'front', 'rear', 'left', 'right', 'interior', 'engine'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Bảng Signatures (Chữ ký điện tử)
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    signature_type TEXT NOT NULL, -- 'intake' hoặc 'handover' hoặc 'advisor'
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Bảng Users (Hệ thống nhân sự)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Bảng Parts (Phụ tùng / Kho)
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'cái',
    cost_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    sell_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    quantity_on_hand NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    min_quantity_threshold NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    supplier TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Bảng Stock Transactions (Lịch sử nhập / xuất kho)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
    part_name TEXT,
    type TEXT NOT NULL, -- 'IMPORT' | 'EXPORT' | 'ADJUST'
    quantity NUMERIC(15, 2) NOT NULL,
    related_order_code TEXT,
    note TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Bảng Quotes (Báo giá)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'DRAFT' NOT NULL,
    advisor_id TEXT,
    advisor_name TEXT,
    customer_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    plate_number TEXT,
    brand TEXT,
    car_name TEXT,
    model_year TEXT,
    vin TEXT,
    odometer TEXT,
    discount_type TEXT DEFAULT 'AMOUNT',
    discount_value NUMERIC(15, 2) DEFAULT 0,
    tax NUMERIC(5, 2) DEFAULT 0,
    note TEXT,
    valid_until TEXT,
    converted_order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Bảng Quote Items (Chi tiết Dịch vụ / Sản phẩm / Khác trong báo giá)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    item_group TEXT NOT NULL, -- 'SERVICE' | 'PRODUCT' | 'OTHER'
    name TEXT NOT NULL,
    quantity NUMERIC(15, 2) DEFAULT 1 NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    part_id UUID REFERENCES parts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Bảng Business Settings (Thông tin doanh nghiệp - 1 dòng duy nhất)
CREATE TABLE IF NOT EXISTS business_settings (
    id TEXT PRIMARY KEY DEFAULT 'business-settings-singleton',
    garage_name TEXT,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_code TEXT,
    bank_info TEXT,
    working_hours TEXT,
    note TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trình tự khởi tạo số hiệu phiếu:
-- Đảm bảo an toàn không trùng lặp mã phiếu / mã báo giá / mã phụ tùng
`;

// Sequential order code generator
const generateSequentialOrderCode = (existingCount: number): string => {
  const nextNum = existingCount + 1;
  const numStr = String(nextNum).padStart(5, '0');
  return `GR2026${numStr}`;
};

const generateSequentialQuoteCode = (existingCount: number): string => {
  const nextNum = existingCount + 1;
  const numStr = String(nextNum).padStart(5, '0');
  return `BG2026${numStr}`;
};

const generateSequentialPartSku = (existingCount: number): string => {
  const nextNum = existingCount + 1;
  const numStr = String(nextNum).padStart(5, '0');
  return `PT${numStr}`;
};

export const garageDb = {
  // GET ALL SERVICE ORDERS (Reconstruct from tables)
  async getForms(): Promise<IntakeForm[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        console.log('Fetching service orders from Supabase Relational Schema...');
        // 1. Fetch service orders
        const { data: orders, error: oError } = await supabase
          .from('service_orders')
          .select('*')
          .order('order_code', { ascending: false });
        
        if (oError) throw oError;
        if (!orders || orders.length === 0) return [];

        const reconstructedForms: IntakeForm[] = [];

        // Batch fetching of relational tables to optimize performance (React Query Cache / performance optimization)
        for (const order of orders) {
          // Fetch customer
          const { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', order.customer_id)
            .single();

          // Fetch vehicle
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', order.vehicle_id)
            .single();

          // Fetch items
          const { data: items } = await supabase
            .from('service_items')
            .select('*')
            .eq('service_order_id', order.id);

          // Fetch inspections
          const { data: inspections } = await supabase
            .from('vehicle_inspections')
            .select('*')
            .eq('service_order_id', order.id);

          // Fetch images
          const { data: images } = await supabase
            .from('vehicle_images')
            .select('*')
            .eq('service_order_id', order.id);

          // Fetch signatures
          const { data: sigs } = await supabase
            .from('signatures')
            .select('*')
            .eq('service_order_id', order.id);

          // Build maps for survey/condition
          const interiorSurvey: Record<string, string> = {};
          const condition: Record<string, string> = {};
          inspections?.forEach(ins => {
            if (ins.inspection_type === 'interior') {
              interiorSurvey[ins.item_name] = ins.status;
            } else {
              condition[ins.item_name] = ins.status;
            }
          });

          // Build vehicle images map
          const vehicleImgMap: Record<string, string> = {};
          images?.forEach(img => {
            vehicleImgMap[img.image_type] = img.image_url;
          });

          // Build signature references
          let intakeSig = null;
          let handoverSig = null;
          let advisorSig = null;
          sigs?.forEach(sg => {
            if (sg.signature_type === 'intake') intakeSig = sg.image_url;
            else if (sg.signature_type === 'handover') handoverSig = sg.image_url;
            else if (sg.signature_type === 'advisor') advisorSig = sg.image_url;
          });

          const detailedServices: ServiceItem[] = (items || []).map(it => ({
            id: it.id,
            name: it.service_name,
            price: Number(it.unit_price),
            quantity: it.quantity,
            status: it.status as 'PENDING' | 'EXECUTING' | 'DONE',
            timestamp: it.timestamp,
            isDone: it.status === 'DONE'
          }));

          reconstructedForms.push({
            id: order.id,
            orderCode: order.order_code,
            createdAt: order.created_at || new Date().toISOString(),
            advisorId: order.advisor_id,
            status: order.status as VehicleStatus,
            plateNumber: vehicle?.license_plate || '',
            brand: vehicle?.vehicle_brand || '',
            color: '',
            modelYear: vehicle?.vehicle_year || '',
            carName: vehicle?.vehicle_model || '',
            vin: vehicle?.vin || '',
            odometer: String(vehicle?.current_km || ''),
            inspectionExpiry: '',
            dateIn: order.received_date,
            dateOut: order.expected_delivery || '',
            customerName: customer?.full_name || '',
            customerNamePrinted: customer?.full_name || '',
            gender: '',
            company: '',
            phone: customer?.phone || '',
            email: customer?.email || '',
            address: customer?.address || '',
            district: '',
            city: '',
            birthday: '',
            source: '',
            salesPerson: order.advisor_id,
            services: [],
            detailedServices,
            otherRequests: '',
            interiorSurvey,
            condition,
            fuelLevel: 50,
            techNotes: inspections?.[0]?.note || '', 
            discount: 0,
            tax: 0,
            totalAmount: Number(order.total_amount),
            vehicleImages: vehicleImgMap,
            intakeSignature: intakeSig,
            handoverSignature: handoverSig,
            advisorSignature: advisorSig,
            advisorName: 'Cố vấn'
          });
        }

        return reconstructedForms;
      } catch (err) {
        console.warn('Failed to query Supabase directly. Falling back to local storage...', err);
      }
    }

    // Fallback: LocalStorage
    const saved = localStorage.getItem('garage_forms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as IntakeForm[];
        if (parsed.length > 0) {
          // Auto-migrate standard sequential order codes if missing
          let changed = false;
          parsed.forEach((form, index) => {
            if (!form.orderCode) {
              form.orderCode = generateSequentialOrderCode(parsed.length - 1 - index);
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem('garage_forms', JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch (err) {
        console.error('Error parsing simulated SQL LocalStorage database: ', err);
      }
    }
    // Khởi tạo mặc định 10 xe mẫu & 10 khách hàng mẫu
    localStorage.setItem('garage_forms', JSON.stringify(SAMPLE_FORMS));
    return SAMPLE_FORMS;
  },

  // COMPREHENSIVE SAVING & UPSERT MAPPING TO 8 RELATIONAL TABELS
  async saveForm(form: IntakeForm): Promise<IntakeForm[]> {
    let currentForms = await this.getForms();

    // Gen unique sequential sequential order code if not exists
    if (!form.orderCode) {
      form.orderCode = generateSequentialOrderCode(currentForms.length);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('Writing relational entries to Supabase for order:', form.orderCode);
        
        // 1. Upsert customer
        let customerId = '';
        const { data: existCust, error: ce } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', form.phone)
          .maybeSingle();

        if (ce) console.warn('Customer check error:', ce);

        if (existCust) {
          customerId = existCust.id;
          await supabase
            .from('customers')
            .update({
              full_name: form.customerName,
              email: form.email,
              address: form.address
            })
            .eq('id', customerId);
        } else {
          const { data: newCust, error: ne } = await supabase
            .from('customers')
            .insert({
              full_name: form.customerName,
              phone: form.phone,
              email: form.email,
              address: form.address
            })
            .select('id')
            .single();
          if (ne) throw ne;
          customerId = newCust.id;
        }

        // 2. Upsert vehicle linked to customer
        let vehicleId = '';
        const { data: existVeh, error: ve } = await supabase
          .from('vehicles')
          .select('id')
          .eq('license_plate', form.plateNumber)
          .maybeSingle();

        if (ve) console.warn('Vehicle check error:', ve);

        if (existVeh) {
          vehicleId = existVeh.id;
          await supabase
            .from('vehicles')
            .update({
              customer_id: customerId,
              vehicle_brand: form.brand,
              vehicle_model: form.carName,
              vehicle_year: form.modelYear,
              vin: form.vin,
              current_km: parseInt(form.odometer) || 0
            })
            .eq('id', vehicleId);
        } else {
          const { data: newVeh, error: nv } = await supabase
            .from('vehicles')
            .insert({
              customer_id: customerId,
              license_plate: form.plateNumber,
              vehicle_brand: form.brand,
              vehicle_model: form.carName,
              vehicle_year: form.modelYear,
              vin: form.vin,
              current_km: parseInt(form.odometer) || 0
            })
            .select('id')
            .single();
          if (nv) throw nv;
          vehicleId = newVeh.id;
        }

        // 3. Upsert service_order
        const orderPayload = {
          order_code: form.orderCode,
          customer_id: customerId,
          vehicle_id: vehicleId,
          advisor_id: form.advisorId || 'system-advisor',
          status: form.status,
          received_date: form.dateIn || new Date().toISOString().split('T')[0],
          expected_delivery: form.dateOut,
          completed_date: form.status === VehicleStatus.COMPLETED ? new Date().toISOString() : undefined,
          total_amount: form.totalAmount || 0
        };

        const { data: existOrder } = await supabase
          .from('service_orders')
          .select('id')
          .eq('order_code', form.orderCode)
          .maybeSingle();

        let orderId = form.id;
        if (existOrder) {
          orderId = existOrder.id;
          await supabase
            .from('service_orders')
            .update(orderPayload)
            .eq('id', orderId);
        } else {
          const { data: newOrder, error: no } = await supabase
            .from('service_orders')
            .insert({
              id: orderId, // Use preset UUID/id
              ...orderPayload
            })
            .select('id')
            .single();
          if (no) {
            // Retry inserting without hardcoded ID if it causes integrity issues
            const { data: retryNewOrder, error: retryNo } = await supabase
              .from('service_orders')
              .insert(orderPayload)
              .select('id')
              .single();
            if (retryNo) throw retryNo;
            orderId = retryNewOrder.id;
            form.id = orderId; // Sync ID
          } else {
            orderId = newOrder.id;
          }
        }

        // 4. Update service_items (Delete and insert)
        await supabase.from('service_items').delete().eq('service_order_id', orderId);
        if (form.detailedServices && form.detailedServices.length > 0) {
          const servicePayloads = form.detailedServices.map(item => ({
            service_order_id: orderId,
            service_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.price * item.quantity,
            status: item.status || (item.isDone ? 'DONE' : 'PENDING'),
            timestamp: item.timestamp || new Date().toISOString()
          }));
          await supabase.from('service_items').insert(servicePayloads);
        }

        // 5. Update vehicle inspections (interior + condition)
        await supabase.from('vehicle_inspections').delete().eq('service_order_id', orderId);
        const inspectionPayloads: any[] = [];
        Object.entries(form.interiorSurvey || {}).forEach(([key, val]) => {
          if (val) {
            inspectionPayloads.push({
              service_order_id: orderId,
              inspection_type: 'interior',
              item_name: key,
              status: val,
              note: form.techNotes
            });
          }
        });
        Object.entries(form.condition || {}).forEach(([key, val]) => {
          if (val) {
            inspectionPayloads.push({
              service_order_id: orderId,
              inspection_type: 'condition',
              item_name: key,
              status: val,
              note: form.techNotes
            });
          }
        });
        if (inspectionPayloads.length > 0) {
          await supabase.from('vehicle_inspections').insert(inspectionPayloads);
        }

        // 6. Update vehicle images
        await supabase.from('vehicle_images').delete().eq('service_order_id', orderId);
        if (form.vehicleImages) {
          const imgPayloads: any[] = [];
          Object.entries(form.vehicleImages).forEach(([type, url]) => {
            if (url) {
              imgPayloads.push({
                service_order_id: orderId,
                image_url: url,
                image_type: type
              });
            }
          });
          if (imgPayloads.length > 0) {
            await supabase.from('vehicle_images').insert(imgPayloads);
          }
        }

        // 7. Update signatures
        await supabase.from('signatures').delete().eq('service_order_id', orderId);
        const sigPayloads: any[] = [];
        if (form.intakeSignature) {
          sigPayloads.push({
            service_order_id: orderId,
            signature_type: 'intake',
            image_url: form.intakeSignature
          });
        }
        if (form.handoverSignature) {
          sigPayloads.push({
            service_order_id: orderId,
            signature_type: 'handover',
            image_url: form.handoverSignature
          });
        }
        if (sigPayloads.length > 0) {
          await supabase.from('signatures').insert(sigPayloads);
        }

        // Re-get pristine list representing state from DB
        return await this.getForms();
      } catch (err) {
        console.warn('Supabase transactional sync yielded exception. Saving to local database replica...', err);
      }
    }

    // LocalStorage Fallback Saving
    const idx = currentForms.findIndex(f => f.id === form.id);
    if (idx >= 0) {
      currentForms[idx] = form;
    } else {
      currentForms = [form, ...currentForms];
    }
    localStorage.setItem('garage_forms', JSON.stringify(currentForms));
    return currentForms;
  },

  // BULK EXPORT & BACKUP/IMPORT FUNCTIONALITY
  async bulkImport(importedForms: IntakeForm[]): Promise<IntakeForm[]> {
    if (isSupabaseConfigured) {
      for (const form of importedForms) {
        await this.saveForm(form);
      }
      return await this.getForms();
    } else {
      localStorage.setItem('garage_forms', JSON.stringify(importedForms));
      return importedForms;
    }
  }
};

// ==========================================================================
// PHỤ TÙNG / KHO / TỒN KHO — CRUD + xuất/nhập kho
// ==========================================================================
export const partsDb = {
  async getParts(): Promise<Part[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('parts').select('*').order('sku', { ascending: true });
        if (error) throw error;
        return (data || []).map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category || '',
          unit: p.unit || 'cái',
          costPrice: Number(p.cost_price) || 0,
          sellPrice: Number(p.sell_price) || 0,
          quantityOnHand: Number(p.quantity_on_hand) || 0,
          minQuantityThreshold: Number(p.min_quantity_threshold) || 0,
          supplier: p.supplier || '',
          location: p.location || '',
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      } catch (err) {
        console.warn('Failed to query parts from Supabase. Falling back to local storage...', err);
      }
    }
    const saved = localStorage.getItem('garage_parts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Part[];
        if (parsed.length > 0) return parsed;
      } catch (err) { console.error(err); }
    }
    // Khởi tạo mặc định 10 phụ tùng / phụ kiện mẫu
    localStorage.setItem('garage_parts', JSON.stringify(SAMPLE_PARTS));
    return SAMPLE_PARTS;
  },

  async savePart(part: Part): Promise<Part[]> {
    const currentParts = await this.getParts();
    const isNew = !currentParts.find(p => p.id === part.id);

    if (!part.sku) {
      part.sku = generateSequentialPartSku(currentParts.length);
    }
    part.updatedAt = new Date().toISOString();
    if (!part.createdAt) part.createdAt = part.updatedAt;

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          sku: part.sku,
          name: part.name,
          category: part.category,
          unit: part.unit,
          cost_price: part.costPrice,
          sell_price: part.sellPrice,
          quantity_on_hand: part.quantityOnHand,
          min_quantity_threshold: part.minQuantityThreshold,
          supplier: part.supplier,
          location: part.location,
          updated_at: part.updatedAt
        };

        if (isNew) {
          const { error } = await supabase.from('parts').insert({ id: part.id, ...payload, created_at: part.createdAt });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('parts').update(payload).eq('id', part.id);
          if (error) throw error;
        }
        return await this.getParts();
      } catch (err) {
        console.warn('Supabase part sync failed. Saving to local replica...', err);
      }
    }

    let nextParts: Part[];
    const idx = currentParts.findIndex(p => p.id === part.id);
    if (idx >= 0) {
      nextParts = [...currentParts];
      nextParts[idx] = part;
    } else {
      nextParts = [part, ...currentParts];
    }
    localStorage.setItem('garage_parts', JSON.stringify(nextParts));
    return nextParts;
  },

  async deletePart(id: string): Promise<Part[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('parts').delete().eq('id', id);
        if (error) throw error;
        return await this.getParts();
      } catch (err) {
        console.warn('Supabase part deletion failed. Removing from local replica...', err);
      }
    }
    const currentParts = await this.getParts();
    const nextParts = currentParts.filter(p => p.id !== id);
    localStorage.setItem('garage_parts', JSON.stringify(nextParts));
    return nextParts;
  },

  async getTransactions(partId?: string): Promise<StockTransaction[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('stock_transactions').select('*').order('created_at', { ascending: false });
        if (partId) query = query.eq('part_id', partId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((t: any) => ({
          id: t.id,
          partId: t.part_id,
          partName: t.part_name,
          type: t.type as StockTransactionType,
          quantity: Number(t.quantity),
          relatedOrderCode: t.related_order_code,
          note: t.note,
          createdBy: t.created_by,
          createdAt: t.created_at
        }));
      } catch (err) {
        console.warn('Failed to query stock_transactions from Supabase. Falling back to local storage...', err);
      }
    }
    const saved = localStorage.getItem('garage_stock_transactions');
    let all: StockTransaction[] = [];
    if (saved) {
      try { all = JSON.parse(saved) as StockTransaction[]; } catch (err) { console.error(err); }
    }
    if (all.length === 0) {
      all = SAMPLE_STOCK_TRANSACTIONS;
      localStorage.setItem('garage_stock_transactions', JSON.stringify(SAMPLE_STOCK_TRANSACTIONS));
    }
    return partId ? all.filter(t => t.partId === partId) : all;
  },

  seedDefaultData(): void {
    localStorage.setItem('garage_forms', JSON.stringify(SAMPLE_FORMS));
    localStorage.setItem('garage_parts', JSON.stringify(SAMPLE_PARTS));
    localStorage.setItem('garage_stock_transactions', JSON.stringify(SAMPLE_STOCK_TRANSACTIONS));
  },

  async recordTransaction(tx: StockTransaction): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('stock_transactions').insert({
          id: tx.id,
          part_id: tx.partId,
          part_name: tx.partName,
          type: tx.type,
          quantity: tx.quantity,
          related_order_code: tx.relatedOrderCode,
          note: tx.note,
          created_by: tx.createdBy,
          created_at: tx.createdAt
        });
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase stock transaction insert failed. Saving to local replica...', err);
      }
    }
    const saved = localStorage.getItem('garage_stock_transactions');
    let all: StockTransaction[] = [];
    if (saved) {
      try { all = JSON.parse(saved) as StockTransaction[]; } catch (err) { console.error(err); }
    }
    all = [tx, ...all];
    localStorage.setItem('garage_stock_transactions', JSON.stringify(all));
  },

  /** Nhập kho: cộng số lượng vào tồn kho hiện tại và ghi lịch sử. */
  async stockIn(part: Part, quantity: number, note: string, createdBy: string): Promise<Part[]> {
    const updatedPart: Part = { ...part, quantityOnHand: part.quantityOnHand + quantity };
    const nextParts = await this.savePart(updatedPart);
    await this.recordTransaction({
      id: Math.random().toString(36).substr(2, 9),
      partId: part.id,
      partName: part.name,
      type: 'IMPORT',
      quantity,
      note,
      createdBy,
      createdAt: new Date().toISOString()
    });
    return nextParts;
  },

  /** Xuất kho dùng cho sửa xe / báo giá: trừ tồn kho hiện tại và ghi lịch sử. */
  async stockOut(part: Part, quantity: number, relatedOrderCode: string, note: string, createdBy: string): Promise<Part[]> {
    const updatedPart: Part = { ...part, quantityOnHand: Math.max(0, part.quantityOnHand - quantity) };
    const nextParts = await this.savePart(updatedPart);
    await this.recordTransaction({
      id: Math.random().toString(36).substr(2, 9),
      partId: part.id,
      partName: part.name,
      type: 'EXPORT',
      quantity,
      relatedOrderCode,
      note,
      createdBy,
      createdAt: new Date().toISOString()
    });
    return nextParts;
  }
};

// ==========================================================================
// BÁO GIÁ — CRUD
// ==========================================================================
export const quotesDb = {
  async getQuotes(): Promise<Quote[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: quoteRows, error } = await supabase
          .from('quotes')
          .select('*')
          .order('quote_code', { ascending: false });
        if (error) throw error;
        if (!quoteRows || quoteRows.length === 0) return [];

        const reconstructed: Quote[] = [];
        for (const q of quoteRows) {
          const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', q.id);
          const mapItem = (it: any) => ({
            id: it.id,
            name: it.name,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unit_price),
            partId: it.part_id || undefined
          });
          reconstructed.push({
            id: q.id,
            quoteCode: q.quote_code,
            createdAt: q.created_at,
            validUntil: q.valid_until || undefined,
            status: q.status,
            advisorId: q.advisor_id || '',
            advisorName: q.advisor_name || '',
            customerName: q.customer_name || '',
            phone: q.phone || '',
            email: q.email || '',
            address: q.address || '',
            plateNumber: q.plate_number || '',
            brand: q.brand || '',
            carName: q.car_name || '',
            modelYear: q.model_year || '',
            vin: q.vin || '',
            odometer: q.odometer || '',
            serviceItems: (items || []).filter((it: any) => it.item_group === 'SERVICE').map(mapItem),
            productItems: (items || []).filter((it: any) => it.item_group === 'PRODUCT').map(mapItem),
            otherItems: (items || []).filter((it: any) => it.item_group === 'OTHER').map(mapItem),
            discountType: q.discount_type || 'AMOUNT',
            discountValue: Number(q.discount_value) || 0,
            tax: Number(q.tax) || 0,
            note: q.note || '',
            convertedOrderId: q.converted_order_id || undefined
          });
        }
        return reconstructed;
      } catch (err) {
        console.warn('Failed to query quotes from Supabase. Falling back to local storage...', err);
      }
    }
    const saved = localStorage.getItem('garage_quotes');
    if (saved) {
      try { return JSON.parse(saved) as Quote[]; } catch (err) { console.error(err); }
    }
    return [];
  },

  async saveQuote(quote: Quote): Promise<Quote[]> {
    const currentQuotes = await this.getQuotes();
    if (!quote.quoteCode) {
      quote.quoteCode = generateSequentialQuoteCode(currentQuotes.length);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          quote_code: quote.quoteCode,
          status: quote.status,
          advisor_id: quote.advisorId,
          advisor_name: quote.advisorName,
          customer_name: quote.customerName,
          phone: quote.phone,
          email: quote.email,
          address: quote.address,
          plate_number: quote.plateNumber,
          brand: quote.brand,
          car_name: quote.carName,
          model_year: quote.modelYear,
          vin: quote.vin,
          odometer: quote.odometer,
          discount_type: quote.discountType,
          discount_value: quote.discountValue,
          tax: quote.tax,
          note: quote.note,
          valid_until: quote.validUntil,
          converted_order_id: quote.convertedOrderId
        };

        const { data: existing } = await supabase.from('quotes').select('id').eq('quote_code', quote.quoteCode).maybeSingle();
        let quoteId = quote.id;
        if (existing) {
          quoteId = existing.id;
          await supabase.from('quotes').update(payload).eq('id', quoteId);
        } else {
          const { data: inserted, error } = await supabase.from('quotes').insert({ id: quoteId, ...payload }).select('id').single();
          if (error) {
            const { data: retryInserted, error: retryErr } = await supabase.from('quotes').insert(payload).select('id').single();
            if (retryErr) throw retryErr;
            quoteId = retryInserted.id;
            quote.id = quoteId;
          } else {
            quoteId = inserted.id;
          }
        }

        await supabase.from('quote_items').delete().eq('quote_id', quoteId);
        const buildRows = (group: 'SERVICE' | 'PRODUCT' | 'OTHER', list: typeof quote.serviceItems) =>
          list.map(item => ({
            quote_id: quoteId,
            item_group: group,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            part_id: item.partId || null
          }));
        const rows = [
          ...buildRows('SERVICE', quote.serviceItems),
          ...buildRows('PRODUCT', quote.productItems),
          ...buildRows('OTHER', quote.otherItems)
        ];
        if (rows.length > 0) {
          await supabase.from('quote_items').insert(rows);
        }

        return await this.getQuotes();
      } catch (err) {
        console.warn('Supabase quote sync failed. Saving to local replica...', err);
      }
    }

    let nextQuotes: Quote[];
    const idx = currentQuotes.findIndex(q => q.id === quote.id);
    if (idx >= 0) {
      nextQuotes = [...currentQuotes];
      nextQuotes[idx] = quote;
    } else {
      nextQuotes = [quote, ...currentQuotes];
    }
    localStorage.setItem('garage_quotes', JSON.stringify(nextQuotes));
    return nextQuotes;
  },

  async deleteQuote(id: string): Promise<Quote[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) throw error;
        return await this.getQuotes();
      } catch (err) {
        console.warn('Supabase quote deletion failed. Removing from local replica...', err);
      }
    }
    const currentQuotes = await this.getQuotes();
    const nextQuotes = currentQuotes.filter(q => q.id !== id);
    localStorage.setItem('garage_quotes', JSON.stringify(nextQuotes));
    return nextQuotes;
  }
};

// ==========================================================================
// THÔNG TIN DOANH NGHIỆP — Cấu hình 1 dòng duy nhất (singleton)
// ==========================================================================
export const settingsDb = {
  async getSettings(): Promise<BusinessSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('id', DEFAULT_BUSINESS_SETTINGS.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          return {
            id: data.id,
            garageName: data.garage_name || DEFAULT_BUSINESS_SETTINGS.garageName,
            logoUrl: data.logo_url || DEFAULT_BUSINESS_SETTINGS.logoUrl,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            taxCode: data.tax_code || '',
            bankInfo: data.bank_info || '',
            workingHours: data.working_hours || '',
            note: data.note || ''
          };
        }
      } catch (err) {
        console.warn('Failed to query business_settings from Supabase. Falling back to local storage...', err);
      }
    }
    const saved = localStorage.getItem('garage_business_settings');
    if (saved) {
      try { return JSON.parse(saved) as BusinessSettings; } catch (err) { console.error(err); }
    }
    return DEFAULT_BUSINESS_SETTINGS;
  },

  async saveSettings(settings: BusinessSettings): Promise<BusinessSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: DEFAULT_BUSINESS_SETTINGS.id,
          garage_name: settings.garageName,
          logo_url: settings.logoUrl,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          tax_code: settings.taxCode,
          bank_info: settings.bankInfo,
          working_hours: settings.workingHours,
          note: settings.note,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('business_settings').upsert(payload);
        if (error) throw error;
        return await this.getSettings();
      } catch (err) {
        console.warn('Supabase business settings sync failed. Saving to local replica...', err);
      }
    }
    localStorage.setItem('garage_business_settings', JSON.stringify(settings));
    return settings;
  }
};
