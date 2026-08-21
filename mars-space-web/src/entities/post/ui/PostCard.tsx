import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui';
import { paths } from '@/app/router/paths';
import { useLocalize } from '@/shared/lib/localize';
import { formatDate } from '@/shared/lib/formatDate';
import type { Post } from '../types';

export interface PostCardProps {
  post: Pick<
    Post,
    'slug' | 'title' | 'excerpt' | 'coverImageUrl' | 'tags' | 'publishedAt' | 'readMinutes'
  >;
}

export function PostCard({ post }: PostCardProps) {
  const { t: tl, lang } = useLocalize();

  return (
    <Card interactive className="h-full overflow-hidden">
      <Link
        to={paths.newsDetail(post.slug)}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
      >
        <div className="aspect-[16/9] w-full overflow-hidden bg-basalt-raised">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={tl(post.title)}
              loading="lazy"
              width={640}
              height={360}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="hairline-grid h-full w-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-dust">
            {post.publishedAt && <span>{formatDate(post.publishedAt, lang)}</span>}
            <span aria-hidden="true">·</span>
            <span>{post.readMinutes} min</span>
          </div>
          <h3 className="font-display text-lg leading-tight">{tl(post.title)}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-dust">{tl(post.excerpt)}</p>
          {post.tags.length > 0 && (
            <p className="mt-3 font-mono text-xs text-oxide">#{post.tags[0]}</p>
          )}
        </div>
      </Link>
    </Card>
  );
}
