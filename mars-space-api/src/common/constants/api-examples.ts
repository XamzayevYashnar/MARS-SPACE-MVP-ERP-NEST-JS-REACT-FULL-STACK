/**
 * Canonical example values for Swagger.
 *
 * §12.2 asks every DTO property to carry an example. Keeping the recurring
 * ones here means the generated docs, and any client generated from them, show
 * the same shape for an id or a timestamp everywhere instead of whatever each
 * DTO happened to invent.
 */
export const API_EXAMPLES = {
  cuid: 'clx1a2b3c4d5e6f7g8h9i0j1',
  timestamp: '2026-08-19T09:12:00.000Z',
  date: '2026-09-01',
  time: '18:00',
  phone: '+998901234567',
  email: 'alisher@marsspace.uz',
  fullName: 'Alisher Rahimov',
  imageUrl: 'https://cdn.marsspace.uz/uploads/2026/08/cover.webp',
  avatarUrl: 'https://cdn.marsspace.uz/uploads/2026/08/avatar.webp',
  videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
  pageUrl: 'https://marsspace.uz/courses/frontend-react',
  courseSlug: 'frontend-react',
  categorySlug: 'frontend',
  teacherSlug: 'jasur-yuldashev',
  postSlug: 'frontend-dasturchi-bolish-yol-xaritasi',
  groupName: 'FS-2026-01',
  roomName: 'Mars-1',
  colorHex: '#3B82F6',
  iconKey: 'layout',
  utmSource: 'instagram',
  utmMedium: 'cpc',
  utmCampaign: 'autumn-2026',
} as const;
