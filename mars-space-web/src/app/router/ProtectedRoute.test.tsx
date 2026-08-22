import { describe, expect, it, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div>secret dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  // The access token is memory-only, so a reload starts without one while the
  // silent refresh is still in flight. Redirecting on that would bounce a
  // signed-in admin to the login screen on every F5.
  it('waits for the session bootstrap instead of redirecting', () => {
    useAuthStore.setState({ accessToken: null, user: null, isBootstrapped: false });

    renderAt('/admin');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.queryByText('secret dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to the login page', () => {
    useAuthStore.getState().clearSession();
    renderAt('/admin');
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret dashboard')).not.toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: { id: '1', fullName: 'Admin', email: 'a@b.c', role: 'ADMIN', avatarUrl: null },
    });
    renderAt('/admin');
    expect(screen.getByText('secret dashboard')).toBeInTheDocument();
  });

  it('shows a 403 when the role is not permitted', () => {
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: { id: '1', fullName: 'Manager', email: 'm@b.c', role: 'MANAGER', avatarUrl: null },
    });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <div>super only</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.queryByText('super only')).not.toBeInTheDocument();
  });
});
