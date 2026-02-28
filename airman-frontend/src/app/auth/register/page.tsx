'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Plane, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { authApi, tenantApi } from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Tenant } from '@/types';

// FIX: register uses tenant_slug (slug string), role is STUDENT only (per problem statement)
const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Minimum 8 characters'),
  tenant_slug: z.string().min(1, 'Please select a flight school'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  useEffect(() => {
    // FIX: public endpoint, no auth required
    tenantApi.list()
      .then((r) => setTenants(r.data.data || []))
      .catch(() => setTenants([]))
      .finally(() => setTenantsLoading(false));
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', tenant_slug: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // FIX: authApi.register maps fields to backend camelCase + tenantSlug
      await authApi.register(data);
      setSuccess(true);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  if (success) {
    return (
      <div className="animate-slide-up cockpit-card p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">CLEARANCE REQUESTED</h2>
        <div className="instrument p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sky-300/80 font-mono mb-1">PENDING ADMIN APPROVAL</p>
              <p className="text-xs text-sky-400/50">
                Your registration has been submitted. An admin must approve your account before you can log in.
                Contact your flight school administrator.
              </p>
            </div>
          </div>
        </div>
        <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2">
          <Plane className="w-4 h-4" /> BACK TO LOGIN
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))', border: '1px solid rgba(249,115,22,0.3)' }}>
          <Plane className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">AIRMAN</h1>
      </div>

      <div className="cockpit-card p-8">
        <h2 className="font-display text-xl font-semibold text-white mb-1">REQUEST CLEARANCE</h2>
        <p className="text-xs text-sky-400/60 font-mono tracking-wider mb-1">STUDENT REGISTRATION</p>
        <p className="text-xs text-amber-400/60 font-mono mb-6">⚠ Accounts require admin approval before login</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">First Name</label>
              <input {...register('first_name')} className="form-input" placeholder="John" />
              {errors.first_name && <p className="text-red-400 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input {...register('last_name')} className="form-input" placeholder="Doe" />
              {errors.last_name && <p className="text-red-400 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* FIX: uses tenant_slug, value is slug string */}
          <div>
            <label className="form-label">Flight School</label>
            {tenantsLoading ? (
              <div className="form-input h-10 shimmer" />
            ) : tenants.length > 0 ? (
              <select {...register('tenant_slug')} className="form-input">
                <option value="">— Select your school —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            ) : (
              <input {...register('tenant_slug')} className="form-input" placeholder="e.g. alpha-flight-school" />
            )}
            {errors.tenant_slug && <p className="text-red-400 text-xs mt-1">{errors.tenant_slug.message}</p>}
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <input {...register('email')} type="email" className="form-input" placeholder="pilot@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPass ? 'text' : 'password'} className="form-input pr-12" placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400/50 hover:text-sky-300 transition-colors p-1">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FOR CLEARANCE'}
          </button>
        </form>

        <div className="hud-divider" />
        <p className="text-center text-xs text-sky-400/50">
          Already have access?{' '}
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
