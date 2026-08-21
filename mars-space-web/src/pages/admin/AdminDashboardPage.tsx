import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, Inbox, UsersRound, GraduationCap } from 'lucide-react';
import { Card, CardBody, ErrorState, Skeleton } from '@/shared/ui';
import { Seo } from '@/shared/seo/Seo';
import { AdminPageHeader } from '@/features/admin-crud/AdminPageHeader';
import { useStatisticsOverview } from '@/shared/api/statistics.api';
import { useLocalize } from '@/shared/lib/localize';
import { formatDate } from '@/shared/lib/formatDate';
import type { LeadStatus } from '@/shared/types/common.types';

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: '#8A94A6',
  IN_PROGRESS: '#E8A33D',
  CONTACTED: '#3FB950',
  ENROLLED: '#C1440E',
  REJECTED: '#E5484D',
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-md border border-hairline bg-basalt-raised text-oxide">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-2xl text-ice">{value}</p>
          <p className="text-xs text-dust">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { t: tl, lang } = useLocalize();
  const { data, isLoading, isError, refetch } = useStatisticsOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title={tc('states.errorTitle')}
        description={tc('states.errorDescription')}
        onRetry={() => void refetch()}
        retryLabel={tc('actions.retry')}
      />
    );
  }

  const statusData = (Object.entries(data.leadsByStatus) as [LeadStatus, number][]).map(
    ([status, count]) => ({ status, count, label: t(`leads.status.${status}`) }),
  );

  return (
    <>
      <Seo title={t('dashboard.title')} noindex />
      <AdminPageHeader title={t('dashboard.title')} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label={t('dashboard.courses')} value={data.totals.courses} />
        <StatCard icon={UsersRound} label={t('dashboard.activeGroups')} value={data.totals.activeGroups} />
        <StatCard icon={GraduationCap} label={t('dashboard.students')} value={data.totals.students} />
        <StatCard icon={Inbox} label={t('dashboard.leadsThisMonth')} value={data.totals.leadsThisMonth} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="eyebrow mb-4">{t('dashboard.leadsTrend')}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.leadsTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="oxideFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C1440E" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#C1440E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#8A94A6', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#8A94A6', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#141922', border: '1px solid #2A3240', borderRadius: 4, color: '#E6EDF5' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#C1440E" strokeWidth={2} fill="url(#oxideFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="eyebrow mb-4">{t('dashboard.leadsByStatus')}</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={45} outerRadius={70} strokeWidth={0}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#141922', border: '1px solid #2A3240', borderRadius: 4, color: '#E6EDF5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1">
              {statusData.map((entry) => (
                <li key={entry.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-dust">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[entry.status] }} />
                    {entry.label}
                  </span>
                  <span className="font-mono text-ice">{entry.count}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="eyebrow mb-4">{t('dashboard.topCourses')}</h2>
            <ul className="space-y-2">
              {data.topCourses.map((course) => (
                <li key={course.courseId} className="flex items-center justify-between border-b border-hairline pb-2 text-sm last:border-0">
                  <span className="text-ice">{tl(course.title)}</span>
                  <span className="font-mono text-dust">{course.leadsCount}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="eyebrow mb-4">{t('dashboard.recentLeads')}</h2>
            <ul className="space-y-2">
              {data.recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between border-b border-hairline pb-2 text-sm last:border-0">
                  <span>
                    <span className="block text-ice">{lead.fullName}</span>
                    <span className="block font-mono text-xs text-dust">{lead.phone}</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-xs text-sol">{t(`leads.status.${lead.status}`)}</span>
                    <span className="block text-xs text-dust">{formatDate(lead.createdAt, lang)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
