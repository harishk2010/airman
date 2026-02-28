'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plane, LayoutDashboard, BookOpen, CalendarDays,
  Shield, LogOut, User, Menu, X, ChevronRight,
  Bell, Settings
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { label: 'Courses', href: '/courses', icon: BookOpen, roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { label: 'Bookings', href: '/bookings', icon: CalendarDays, roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { label: 'Admin Panel', href: '/admin', icon: Shield, roles: ['ADMIN'] },
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cockpit-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-glow-pulse"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <Plane className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div className="font-mono text-xs text-sky-400/60 tracking-widest animate-pulse">INITIALIZING...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter(item => user?.role && item.roles.includes(user.role));

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) await authApi.logout();
    } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-cockpit-gradient">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300',
          'border-r border-white/[0.05]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )} style={{ background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(20px)' }}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.1))', border: '1px solid rgba(249,115,22,0.3)' }}>
              <Plane className="w-4.5 h-4.5 text-amber-400" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-base font-bold text-white tracking-widest">AIRMAN</div>
              <div className="font-mono text-[9px] text-sky-400/50 tracking-widest">FLIGHT MANAGEMENT</div>
            </div>
            <button className="ml-auto lg:hidden text-sky-400/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tenant badge */}
          {user && (
            <div className="px-5 py-3 border-b border-white/[0.04]">
              <div className="instrument text-xs">
                <div className="text-amber-400/60 tracking-widest text-[9px] mb-0.5">TENANT</div>
                <div className="text-sky-300/80 truncate">{user.tenantId || user.tenant_id || ''.slice(0, 8).toUpperCase()}...</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="text-[9px] font-mono text-sky-400/30 tracking-widest px-4 mb-2">SYSTEMS</div>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={cn('nav-item', active && 'active')}
                  onClick={() => setSidebarOpen(false)}>
                  <Icon className={cn('w-4 h-4 nav-icon flex-shrink-0', active ? 'text-amber-400' : '')} />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-sky-400/40" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/[0.06] p-4 space-y-2">
            <Link href="/profile" className={cn('nav-item', isActive('/profile') && 'active')}
              onClick={() => setSidebarOpen(false)}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(74,114,196,0.3), rgba(46,82,163,0.3))', border: '1px solid rgba(74,114,196,0.3)' }}>
                {user ? getInitials(user.firstName || user.first_name || "", user.firstName || user.first_name || "") : '??'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate font-display">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-[9px] font-mono tracking-wider" style={{
                  color: user?.role === 'ADMIN' ? '#fb923c' : user?.role === 'INSTRUCTOR' ? '#7096d8' : '#4ade80'
                }}>
                  {user?.role}
                </div>
              </div>
            </Link>
            <button onClick={handleLogout}
              className="nav-item w-full text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors">
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Eject Session</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b border-white/[0.05]"
            style={{ background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(16px)' }}>
            <button className="lg:hidden text-sky-400/60 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400/40">
              <Plane className="w-3 h-3" />
              <span className="tracking-widest">AIRMAN</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-sky-300/70 tracking-wider">
                {pathname.split('/').filter(Boolean).join(' / ').toUpperCase() || 'DASHBOARD'}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Status indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg instrument">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-mono text-sky-400/50 tracking-widest">CONNECTED</span>
              </div>

              {/* Notification stub */}
              <button className="relative w-8 h-8 rounded-lg flex items-center justify-center btn-ghost">
                <Bell className="w-4 h-4" />
              </button>

              {/* Settings stub */}
              <Link href="/profile" className="w-8 h-8 rounded-lg flex items-center justify-center btn-ghost">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
