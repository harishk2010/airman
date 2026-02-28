'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Plane, Loader2 } from 'lucide-react';
import { authApi, tenantApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getApiError } from '@/lib/utils';
import { Tenant } from '@/types';

// FIX: form uses tenant_slug (slug string), not tenant_id (UUID)
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenant_slug: z.string().min(1, 'Please select a flight school'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  useEffect(() => {
    // FIX: /admin/tenants is now a public endpoint — no auth needed
    tenantApi.list()
      .then((r) => setTenants(r.data.data || []))
      .catch(() => setTenants([]))
      .finally(() => setTenantsLoading(false));
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', tenant_slug: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // FIX: authApi.login now maps tenant_slug → tenantSlug internally
      const res = await authApi.login(data);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))', border: '1px solid rgba(249,115,22,0.3)' }}>
          <Plane className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
          <div className="absolute inset-0 rounded-2xl animate-glow-pulse" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-wide text-white">AIRMAN</h1>
        <p className="text-xs text-sky-400/70 tracking-widest font-mono mt-1">FLIGHT MANAGEMENT SYSTEM</p>
      </div>

      {/* Card */}
      <div className="cockpit-card p-8">
        <h2 className="font-display text-xl font-semibold text-white mb-1">CREW LOGIN</h2>
        <p className="text-xs text-sky-400/60 font-mono tracking-wider mb-6">AUTHENTICATE TO CONTINUE</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Tenant selector — FIX: now populated from public API, value is slug */}
          <div>
            <label className="form-label">Flight School</label>
            {tenantsLoading ? (
              <div className="form-input h-10 shimmer" />
            ) : tenants.length > 0 ? (
              <select {...register('tenant_slug')} className="form-input">
                <option value="">— Select your school —</option>
                {tenants.map((t) => (
                  // FIX: value is t.slug (string) not t.id (UUID)
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            ) : (
              <div>
                <input
                  {...register('tenant_slug')}
                  className="form-input"
                  placeholder="e.g. alpha-flight-school"
                />
                <p className="text-xs text-sky-400/50 mt-1 font-mono">Run seed script first to populate tenants</p>
              </div>
            )}
            {errors.tenant_slug && <p className="text-red-400 text-xs mt-1">{errors.tenant_slug.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className="form-input"
              placeholder="pilot@flightschool.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                className="form-input pr-12"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400/50 hover:text-sky-300 transition-colors p-1">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
            {isSubmitting ? 'AUTHENTICATING...' : 'INITIATE FLIGHT'}
          </button>
        </form>

        <div className="hud-divider" />

        {/* Admin credential hint */}
        <div className="instrument text-xs space-y-1.5 mb-4">
          <p className="text-amber-400/70 font-mono text-xs mb-2 tracking-widest">ADMIN CREDENTIALS (after seeding)</p>
          <div className="grid grid-cols-2 gap-1 text-sky-300/60 font-mono">
            <span>SCHOOL A:</span><span>admin@alpha.com</span>
            <span>PASSWORD:</span><span>Admin@Alpha123</span>
            <span>SCHOOL B:</span><span>admin@bravo.com</span>
            <span>PASSWORD:</span><span>Admin@Bravo123</span>
          </div>
          <p className="text-sky-400/30 text-xs mt-2">Instructors: created by admin. Students: self-register → admin approves.</p>
        </div>

        <p className="text-center text-xs text-sky-400/50">
          New crew member?{' '}
          <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
