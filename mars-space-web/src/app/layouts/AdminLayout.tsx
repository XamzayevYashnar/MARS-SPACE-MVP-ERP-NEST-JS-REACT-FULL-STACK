import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  FolderTree,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Quote,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { authApi } from '@/shared/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from '@/features/language-switcher/LanguageSwitcher';
import { ThemeToggle } from '@/features/theme-toggle/ThemeToggle';
import { paths } from '@/app/router/paths';
import { cn } from '@/shared/lib/cn';

type NavKey =
  | 'dashboard'
  | 'leads'
  | 'courses'
  | 'categories'
  | 'teachers'
  | 'groups'
  | 'students'
  | 'news'
  | 'testimonials'
  | 'messages'
  | 'settings'
  | 'users';

interface NavItem {
  to: string;
  icon: LucideIcon;
  key: NavKey;
  roles?: string[];
}

const NAV: NavItem[] = [
  { to: paths.admin.dashboard, icon: LayoutDashboard, key: 'dashboard' },
  { to: paths.admin.leads, icon: Inbox, key: 'leads' },
  { to: paths.admin.courses, icon: BookOpen, key: 'courses' },
  { to: paths.admin.categories, icon: FolderTree, key: 'categories' },
  { to: paths.admin.teachers, icon: GraduationCap, key: 'teachers' },
  { to: paths.admin.groups, icon: UsersRound, key: 'groups' },
  { to: paths.admin.students, icon: Users, key: 'students' },
  { to: paths.admin.news, icon: Newspaper, key: 'news' },
  { to: paths.admin.testimonials, icon: Quote, key: 'testimonials' },
  { to: paths.admin.messages, icon: MessageSquare, key: 'messages' },
  { to: paths.admin.settings, icon: Settings, key: 'settings' },
  { to: paths.admin.users, icon: Users, key: 'users', roles: ['SUPER_ADMIN'] },
];

export function AdminLayout() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const onLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the call fails, drop the local session.
    }
    clearSession();
    void navigate(paths.admin.login, { replace: true });
  };

  const items = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex min-h-screen bg-void">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-basalt md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-hairline px-5">
          <span className="h-6 w-6 rounded-sm bg-oxide" aria-hidden="true" />
          <span className="font-display text-lg font-bold">Mars Space</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === paths.admin.dashboard}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-basalt-raised text-ice'
                    : 'text-dust hover:bg-basalt-raised hover:text-ice',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-hairline bg-basalt px-4 md:px-6">
          <span className="font-mono text-xs text-dust md:hidden">Mars Space</span>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {user && <span className="hidden text-sm text-dust sm:inline">{user.fullName}</span>}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-hairline px-3 text-sm text-dust transition-colors hover:border-alert/40 hover:text-alert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
            >
              <LogOut className="h-4 w-4" /> {t('actions.logout')}
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-basalt px-2 py-2 md:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === paths.admin.dashboard}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-sm px-3 py-1.5 text-xs transition-colors',
                  isActive ? 'bg-basalt-raised text-ice' : 'text-dust',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
