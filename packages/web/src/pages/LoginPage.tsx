import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '@dsa/shared';
import { useAuth } from '../features/auth/useAuth';
import { CenteredLayout } from '../layouts/AppShell';
import { PixelButton, PixelCard, PixelInput } from '../components/ui';
import { getApiErrorMessage } from '../lib/api-error';
import { zodFieldErrors } from '../lib/form';

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const from = location.state?.from?.pathname ?? '/world';

  const [values, setValues] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authed') return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CenteredLayout>
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-lg text-gold">Welcome back</h1>
        <PixelCard>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {formError && (
              <p className="border-2 border-ember bg-ember/20 px-3 py-2 text-sm text-parchment">
                {formError}
              </p>
            )}
            <PixelInput
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              error={fieldErrors.email}
            />
            <PixelInput
              label="Password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              error={fieldErrors.password}
            />
            <PixelButton type="submit" fullWidth loading={submitting}>
              Log in
            </PixelButton>
          </form>
        </PixelCard>
        <p className="mt-4 text-center text-sm text-stone-300">
          New here?{' '}
          <Link to="/register" className="text-gold underline">
            Create an account
          </Link>
        </p>
      </div>
    </CenteredLayout>
  );
}
