'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CreditCard, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
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
  fullName:     z.string().min(2, 'Full name is required').max(120),
  matricNumber: z.string().min(2, 'Matric number is required').max(30),
  email:        z.string().email('Enter a valid email').max(200),
  phoneNumber:  z.string().regex(/^[+]?[0-9\s\-]{7,20}$/, 'Enter a valid phone number'),
  password:     z.string().min(8, 'Password must be at least 8 characters').max(100),
});
type FormData = z.infer<typeof schema>;

// Only ever redirect back to a path within this app — a bare "/x" is safe,
// but "//evil.com" is browser-parsed as protocol-relative and must be rejected.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Spinner size="lg" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.reg-el', { opacity: 0, y: 16, stagger: 0.06, duration: 0.5, ease: 'power2.out', delay: 0.1 });
    });
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      router.push(next);
    } catch (err) {
      const e = err as AxiosError<{ message: string; fieldErrors?: { field: string; message: string }[] }>;
      if (e.response?.data?.fieldErrors) {
        e.response.data.fieldErrors.forEach(({ field, message }) => {
          setError(field as keyof FormData, { message });
        });
      } else if (e.response?.status === 409) {
        toast(e.response.data?.message ?? 'Email, matric or phone already registered.', 'error');
      } else {
        toast(e.response?.data?.message ?? 'Registration failed.', 'error');
      }
    }
  };

  return (
    <div>
      <h1 className="reg-el text-2xl font-extrabold text-[#111827] mb-1">Create Account</h1>
      <p className="reg-el text-sm text-gray-500 mb-6">Join ReFound to start tracking campus items</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="reg-el">
          <Input label="Full Name" placeholder="Orlando Diggs" icon={<User size={16} />}
            autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        </div>
        <div className="reg-el">
          <Input label="Matric / Student ID" placeholder="A21EC0045" icon={<CreditCard size={16} />}
            error={errors.matricNumber?.message} {...register('matricNumber')} />
        </div>
        <div className="reg-el">
          <Input label="Campus Email" type="email" placeholder="orlando@university.edu" icon={<Mail size={16} />}
            autoComplete="email" error={errors.email?.message} {...register('email')} />
        </div>
        <div className="reg-el">
          <Input label="Phone Number" type="tel" placeholder="+1 555-019-2834" icon={<Phone size={16} />}
            autoComplete="tel" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
        </div>
        <div className="reg-el">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            icon={<Lock size={16} />}
            autoComplete="new-password"
            error={errors.password?.message}
            trailing={
              <button type="button" onClick={() => setShowPass((v) => !v)} className="p-1">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            {...register('password')}
          />
        </div>

        <div className="reg-el mt-2">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Create Account
          </Button>
        </div>
      </form>

      <p className="reg-el text-sm text-center text-gray-500 mt-5">
        Already have an account?{' '}
        <Link
          href={next !== '/dashboard' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-bold text-[#F97316] hover:opacity-80"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
