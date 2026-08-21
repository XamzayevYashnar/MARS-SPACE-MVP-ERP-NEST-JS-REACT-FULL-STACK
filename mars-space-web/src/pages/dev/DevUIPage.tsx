import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Search, Users } from 'lucide-react';
import { LanguageSwitcher } from '@/features/language-switcher/LanguageSwitcher';
import { ThemeToggle } from '@/features/theme-toggle/ThemeToggle';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TBody,
  TD,
  Textarea,
  TH,
  THead,
  TR,
} from '@/shared/ui';

// Full static class strings so Tailwind's JIT emits each swatch colour.
const TOKENS: { name: string; className: string }[] = [
  { name: 'void', className: 'bg-void' },
  { name: 'basalt', className: 'bg-basalt' },
  { name: 'basalt-raised', className: 'bg-basalt-raised' },
  { name: 'hairline', className: 'bg-hairline' },
  { name: 'oxide', className: 'bg-oxide' },
  { name: 'sol', className: 'bg-sol' },
  { name: 'ice', className: 'bg-ice' },
  { name: 'dust', className: 'bg-dust' },
  { name: 'signal', className: 'bg-signal' },
  { name: 'alert', className: 'bg-alert' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="eyebrow">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

/**
 * Dev-only design-system showcase (spec §15.3). Every primitive and every
 * state (loading / error / empty / success) is rendered here for visual QA.
 */
export function DevUIPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(3);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-void px-6 py-10 text-ice">
      <div className="mx-auto max-w-container space-y-12">
        <header className="flex items-center justify-between border-b border-hairline pb-6">
          <div>
            <p className="eyebrow">MARS SPACE // DESIGN SYSTEM</p>
            <h1 className="mt-2 font-display text-display-lg">UI Primitives</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <Section title="i18n (live)">
          <div className="space-y-2 font-mono text-sm text-dust">
            <p>
              nav.home → <span className="text-ice">{t('nav.home')}</span>
            </p>
            <p>
              actions.apply → <span className="text-ice">{t('actions.apply')}</span>
            </p>
            <p>
              course.seatsLeft →{' '}
              <span className="text-sol">{t('course.seatsLeft', { count: 3 })}</span>
            </p>
          </div>
        </Section>

        <Section title="Colour tokens">
          {TOKENS.map((t) => (
            <div key={t.name} className="w-28">
              <div className={`h-16 w-full rounded-md border border-hairline ${t.className}`} />
              <p className="mt-2 font-mono text-xs text-dust">--{t.name}</p>
            </div>
          ))}
        </Section>

        <Section title="Typography">
          <div className="space-y-3">
            <p className="font-display text-display-xl">Display XL</p>
            <p className="font-display text-h2">Heading 2 — Unbounded</p>
            <p className="text-lg">Body large — Onest reads cleanly in Latin and Cyrillic (Salom).</p>
            <p className="font-mono text-sm text-sol">1 200 000 so&apos;m · MS-FS12 · 02 SEP</p>
          </div>
        </Section>

        <Section title="Buttons">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </Section>

        <Section title="Badges">
          <Badge>Neutral</Badge>
          <Badge variant="oxide">Featured</Badge>
          <Badge variant="sol" dot>
            3 seats
          </Badge>
          <Badge variant="success" dot>
            Available
          </Badge>
          <Badge variant="alert" dot>
            Full
          </Badge>
        </Section>

        <Section title="Form controls">
          <div className="w-full max-w-md space-y-4">
            <FormField label="Name" required>
              {(field) => <Input placeholder="Enter your name" {...field} invalid={field['aria-invalid']} />}
            </FormField>
            <FormField label="Email" error="validation.email.invalid" hint="We never share it">
              {(field) => <Input placeholder="you@example.com" {...field} invalid={field['aria-invalid']} />}
            </FormField>
            <FormField label="Course">
              {(field) => (
                <Select
                  {...field}
                  placeholder="Select a course"
                  options={[
                    { value: 'fe', label: 'Frontend Development' },
                    { value: 'be', label: 'Backend Development' },
                    { value: 'ui', label: 'UI/UX Design' },
                  ]}
                  invalid={field['aria-invalid']}
                />
              )}
            </FormField>
            <FormField label="Message">
              {(field) => <Textarea placeholder="Type your message" {...field} invalid={field['aria-invalid']} />}
            </FormField>
            <Input leading={<Search className="h-4 w-4" />} placeholder="Search with leading icon" />
          </div>
        </Section>

        <Section title="Cards">
          <Card interactive className="w-72 corner-ticks">
            <CardHeader>
              <Badge variant="oxide">Featured</Badge>
            </CardHeader>
            <CardBody>
              <h3 className="font-display text-h3">Frontend Development</h3>
              <p className="mt-2 text-sm text-dust">
                6 oy · 3 dars/hafta. Practising mentors, project-based portfolio.
              </p>
              <p className="mt-3 font-mono text-lg text-sol">1 200 000 so&apos;m</p>
            </CardBody>
            <CardFooter>
              <Button size="sm">Ariza qoldirish</Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="uz" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="uz">UZ</TabsTrigger>
              <TabsTrigger value="ru">RU</TabsTrigger>
              <TabsTrigger value="en">EN</TabsTrigger>
            </TabsList>
            <TabsContent value="uz">Uzbek tab content.</TabsContent>
            <TabsContent value="ru">Russian tab content.</TabsContent>
            <TabsContent value="en">English tab content.</TabsContent>
          </Tabs>
        </Section>

        <Section title="Table">
          <Table>
            <THead>
              <TR>
                <TH>Group</TH>
                <TH>Course</TH>
                <TH>Start</TH>
                <TH>Seats</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD className="font-mono">MS-FS12</TD>
                <TD>Frontend</TD>
                <TD className="font-mono">02 SEP</TD>
                <TD>
                  <Badge variant="sol" dot>
                    3
                  </Badge>
                </TD>
              </TR>
              <TR>
                <TD className="font-mono">MS-BE07</TD>
                <TD>Backend</TD>
                <TD className="font-mono">09 SEP</TD>
                <TD>
                  <Badge variant="alert" dot>
                    Full
                  </Badge>
                </TD>
              </TR>
            </TBody>
          </Table>
        </Section>

        <Section title="List states">
          <div className="grid w-full gap-6 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="text-sm text-dust">Loading</p>
              <Card>
                <CardBody className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardBody>
              </Card>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-dust">Empty</p>
              <EmptyState
                icon={Users}
                title="No teachers yet"
                description="Add your first teacher to see them here."
                action={<Button size="sm">Add teacher</Button>}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-dust">Error</p>
              <ErrorState
                title="Couldn't load courses"
                description="Check your connection and try again."
                onRetry={() => undefined}
              />
            </div>
          </div>
        </Section>

        <Section title="Modal & Pagination">
          <Button onClick={() => setModalOpen(true)}>
            <Rocket className="h-4 w-4" /> Open modal
          </Button>
          <Pagination page={page} totalPages={20} onPageChange={setPage} />
          <Modal
            open={modalOpen}
            onOpenChange={setModalOpen}
            title="Ariza qoldirish"
            description="Enter your details and we'll call you back."
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setModalOpen(false)}>Submit</Button>
              </>
            }
          >
            <div className="space-y-4">
              <FormField label="Name" required>
                {(field) => <Input placeholder="Ismingiz" {...field} />}
              </FormField>
              <FormField label="Phone" required>
                {(field) => <Input placeholder="+998 (__) ___-__-__" {...field} />}
              </FormField>
            </div>
          </Modal>
        </Section>
      </div>
    </div>
  );
}
