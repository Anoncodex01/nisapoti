import type { Metadata } from 'next';
import { db } from '@/lib/database';

type LayoutProps = {
  children: React.ReactNode;
  params: { username: string };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nisapoti.com';
const defaultOgImage = `${siteUrl}/logonis.png`;

const normalizeUsername = (value: string) =>
  decodeURIComponent(value).trim().replace(/^@/, '');

const convertImagePath = (imageUrl: string) => {
  if (imageUrl.startsWith('/creator/assets/')) {
    return imageUrl.replace('/creator/assets/', '/uploads/');
  }
  return imageUrl;
};

const toAbsoluteUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  return `${siteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

export async function generateMetadata(
  { params }: { params: { username: string } }
): Promise<Metadata> {
  const username = normalizeUsername(params.username);

  if (!username) {
    return {
      title: 'Creator Profile - Nisapoti',
      description: 'Discover and support your favorite creators on Nisapoti.',
      openGraph: {
        images: [{ url: defaultOgImage }]
      },
      twitter: {
        card: 'summary_large_image',
        images: [defaultOgImage]
      }
    };
  }

  try {
    const creatorQuery = `
      SELECT 
        p.username, p.display_name, p.avatar_url, p.bio
      FROM profiles p
      WHERE (p.username = ? OR LOWER(p.username) = LOWER(?) OR p.creator_url = ? OR LOWER(p.creator_url) = LOWER(?))
        AND p.status = 'active'
      LIMIT 1
    `;
    const creator = await db.queryOne(creatorQuery, [username, username, username, username]);

    const displayName = creator?.display_name || creator?.username || username;
    const bio = creator?.bio || 'Support this creator on Nisapoti.';
    const title = `${displayName} on Nisapoti`;
    const description = bio.length > 180 ? `${bio.slice(0, 177)}...` : bio;

    const avatar = creator?.avatar_url ? convertImagePath(creator.avatar_url) : '';
    const ogImage = avatar ? toAbsoluteUrl(avatar) : defaultOgImage;
    const canonicalUrl = `${siteUrl}/${encodeURIComponent(username)}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'profile',
        url: canonicalUrl,
        title,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${displayName} profile image`
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage]
      }
    };
  } catch (error) {
    return {
      title: `${username} on Nisapoti`,
      description: 'Support this creator on Nisapoti.',
      openGraph: {
        images: [{ url: defaultOgImage }]
      },
      twitter: {
        card: 'summary_large_image',
        images: [defaultOgImage]
      }
    };
  }
}

export default function CreatorLayout({ children }: LayoutProps) {
  return children;
}
