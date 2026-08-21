import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Quote, Star } from 'lucide-react';
import { Card, CardBody, Modal, Skeleton } from '@/shared/ui';
import { useTestimonials } from '@/entities/testimonial/hooks';
import { useLocalize } from '@/shared/lib/localize';
import type { Testimonial } from '@/entities/testimonial/types';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rating ? 'h-3.5 w-3.5 fill-sol text-sol' : 'h-3.5 w-3.5 text-hairline'}
        />
      ))}
    </div>
  );
}

export interface TestimonialsProps {
  courseId?: string;
}

export function Testimonials({ courseId }: TestimonialsProps) {
  const { t: tl } = useLocalize();
  const { t } = useTranslation();
  const { data, isLoading } = useTestimonials(courseId ? { courseId } : {});
  const [video, setVideo] = useState<Testimonial | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {data.map((item) => (
          <Card key={item.id} className="flex h-full flex-col">
            <CardBody className="flex flex-1 flex-col">
              <div className="mb-3 flex items-center justify-between">
                <Quote className="h-5 w-5 text-oxide" aria-hidden="true" />
                <Stars rating={item.rating} />
              </div>
              <p className="flex-1 text-sm text-ice">{tl(item.content)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
                <div>
                  <p className="text-sm font-medium">{item.authorName}</p>
                  {item.authorRole && <p className="text-xs text-dust">{tl(item.authorRole)}</p>}
                </div>
                {item.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideo(item)}
                    aria-label="Play video"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline text-oxide transition-colors hover:border-oxide/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(video)}
        onOpenChange={(v) => (v ? undefined : setVideo(null))}
        title={video?.authorName ?? ''}
        size="lg"
        closeLabel={t('actions.close')}
      >
        {video?.videoUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-sm bg-black">
            <iframe
              src={video.videoUrl}
              title={video.authorName}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </Modal>
    </>
  );
}
