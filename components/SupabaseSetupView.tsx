import React, { useState } from 'react';
import {
  isSupabaseConfigured,
  supabaseConfigSource,
  getActiveSupabaseUrl,
  getRuntimeSupabaseConfig,
  saveSupabaseRuntimeConfig,
  clearSupabaseRuntimeConfig,
  testSupabaseConnection,
  SUPABASE_SQL_DDL
} from '../supabaseClient';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  KeyRound
} from 'lucide-react';

export const SupabaseSetupView: React.FC = () => {
  const currentRuntime = getRuntimeSupabaseConfig();
  const [url, setUrl] = useState(currentRuntime?.url || getActiveSupabaseUrl() || '');
  const [anonKey, setAnonKey] = useState(currentRuntime?.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Có lỗi khi kiểm tra kết nối.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndReload = () => {
    if (!url.trim() || !anonKey.trim()) {
      alert('Vui lòng nhập đầy đủ Supabase URL và Anon Key!');
      return;
    }
    saveSupabaseRuntimeConfig(url, anonKey);
    alert('Đã lưu cấu hình Supabase! Hệ thống sẽ tải lại trang để khởi tạo kết nối mới.');
    window.location.reload();
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc muốn xoá cấu hình Supabase đã lưu và quay lại chế độ lưu trữ trình duyệt (LocalStorage)?')) {
      clearSupabaseRuntimeConfig();
      window.location.reload();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Cấu Hình Cơ Sở Dữ Liệu Supabase PostgreSQL</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Kết nối máy chủ cơ sở dữ liệu trên đám mây để đồng bộ thời gian thực cho nhiều thiết bị trong garage
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã kết nối đám mây ({supabaseConfigSource})</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
              <span>Chế độ Offline / Trình duyệt</span>
            </span>
          )}
        </div>
      </div>

      {/* Connection Info Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-4 h-4 text-blue-600" />
          <span>Thông Số Kết Nối Dự Án Supabase</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
              Project URL (Đường dẫn kết nối dự án)
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Lấy tại: Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
              Project API Anon Key (Khóa bảo mật công khai)
            </label>
            <input
              type="text"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-none select-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Lấy tại: Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys &rarr; anon / public
            </p>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <div>
              <p>{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
          </button>

          <div className="flex items-center gap-2">
            {currentRuntime && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
              >
                Xoá cấu hình
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAndReload}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 cursor-pointer transition-all"
            >
              Lưu & Tải Lại Ứng Dụng
            </button>
          </div>
        </div>
      </div>

      {/* SQL Script / DDL Table Setup */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tập Lệnh SQL Khởi Tạo Bảng Dữ Liệu (SQL Schema DDL)</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Copy đoạn mã này vào mục <strong>SQL Editor</strong> trên Supabase để tự động khởi tạo bảng
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Đã sao chép!' : 'Sao chép SQL'}</span>
          </button>
        </div>

        <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl overflow-x-auto max-h-96 font-mono text-[11px] leading-relaxed border border-slate-800">
          <pre>{SUPABASE_SQL_DDL}</pre>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetupView;
