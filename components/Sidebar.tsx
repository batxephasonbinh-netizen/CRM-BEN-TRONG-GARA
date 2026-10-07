import React from 'react';
import { UserAccount, UserRole } from '../types';
import {
  LayoutDashboard,
  FilePlus,
  Users,
  Warehouse,
  Receipt,
  UserCheck,
  Settings,
  Database,
  LogOut,
  X,
  AlertCircle
} from 'lucide-react';

export type ViewType = 'LOGIN' | 'DASHBOARD' | 'FORM' | 'USERS' | 'CRM' | 'PARTS' | 'QUOTES' | 'BUSINESS_SETTINGS' | 'SUPABASE_SETUP';

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  garageName: string;
  logoUrl: string;
  lowStockCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  currentUser,
  onLogout,
  garageName,
  logoUrl,
  lowStockCount,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    {
      id: 'DASHBOARD',
      label: 'Bảng Điều Khiển',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'FORM',
      label: 'Tiếp Nhận Xe Mới',
      icon: <FilePlus className="w-5 h-5" />
    },
    {
      id: 'CRM',
      label: 'CRM & Lịch Sử Xe',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'PARTS',
      label: 'Kho & Phụ Tùng',
      icon: <Warehouse className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined
    },
    {
      id: 'QUOTES',
      label: 'Báo Giá Sửa Chữa',
      icon: <Receipt className="w-5 h-5" />
    },
    {
      id: 'USERS',
      label: 'Đội Ngũ Kỹ Sư',
      icon: <UserCheck className="w-5 h-5" />,
      adminOnly: true
    },
    {
      id: 'BUSINESS_SETTINGS',
      label: 'Thông Tin Garage',
      icon: <Settings className="w-5 h-5" />,
      adminOnly: true
    },
    {
      id: 'SUPABASE_SETUP',
      label: 'Cấu Hình Supabase',
      icon: <Database className="w-5 h-5" />,
      adminOnly: true
    }
  ];

  const handleSelect = (itemView: ViewType) => {
    setView(itemView);
    onCloseMobile();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case UserRole.ADVISOR:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.TECHNICIAN:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Quản trị viên';
      case UserRole.ADVISOR:
        return 'Cố vấn dịch vụ';
      case UserRole.TECHNICIAN:
        return 'Kỹ thuật viên';
      default:
        return role;
    }
  };

  const content = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 w-72 select-none border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1 shrink-0"
            onError={(e) => {
              // fallback if logo fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-white uppercase tracking-tight truncate">
              {garageName || 'Bên Trong Gara'}
            </h1>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wider">GARAGE PRO V3.0</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          title="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info Bar */}
      <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
          {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getRoleBadge(currentUser.role)}`}>
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-2">
          Hệ thống điều hành
        </div>

        {navItems
          .filter(item => !item.adminOnly || currentUser.role === UserRole.ADMIN)
          .map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    <AlertCircle className="w-3 h-3" />
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/60 transition-all border border-rose-900/40 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng Xuất Tài Khoản</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
