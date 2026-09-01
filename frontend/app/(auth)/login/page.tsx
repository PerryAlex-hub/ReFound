'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import gsap from 'gsap';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { AxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

// Only ever redirect back to a path within this app — a bare "/x" is safe,
// but "//evil.com" is browser-parsed as protocol-relative and must be rejected.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Spinner size="lg" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [showPass, setShowPass] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.login-el', {
        opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.1,
      });
    });
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      router.push(next);
    } catch (err) {
      const e = err as AxiosError<{ message: string; error: string }>;
      const msg = e.response?.data?.message ?? 'Sign in failed. Please try again.';
      if (e.response?.status === 401) {
        setError('password', { message: 'Incorrect email or password' });
      } else if (e.response?.status === 403) {
        toast('Your account has been suspended.', 'error');
      } else {
        toast(msg, 'error');
      }
    }
  };

  return (
    <div ref={containerRef}>
      <div className="login-el flex justify-center mb-5">
        <div className="w-14 h-14 rounded-full bg-[#FFF7ED] flex items-center justify-center">
          <Search size={26} className="text-[#F97316]" />
        </div>
      </div>

      <h1 className="login-el text-2xl font-extrabold text-[#111827] text-center mb-1">Welcome Back</h1>
      <p className="login-el text-sm text-gray-500 text-center mb-7">Sign in to reunite with your lost items</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="login-el">
          <Input
            label="Campus Email"
            type="email"
            placeholder="student@university.edu"
            icon={<Mail size={16} />}
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="login-el">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            autoComplete="current-password"
            error={errors.password?.message}
            trailing={
              <button type="button" onClick={() => setShowPass((v) => !v)} className="p-1">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            {...register('password')}
          />
        </div>

        <div className="login-el flex justify-end -mt-1">
          <button
            type="button"
            onClick={() => toast('Password reset is not yet available.', 'info')}
            className="text-xs font-semibold text-[#F97316] hover:opacity-80"
          >
            Forgot Password?
          </button>
        </div>

        <div className="login-el mt-2">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Sign In
          </Button>
        </div>
      </form>

      <p className="login-el text-sm text-center text-gray-500 mt-5">
        Don&apos;t have an account?{' '}
        <Link
          href={next !== '/dashboard' ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="font-bold text-[#F97316] hover:opacity-80"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
