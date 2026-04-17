import Image from 'next/image';
import prisma from '@/lib/prisma';
import styles from './Header.module.css';
import HeaderClient from '@/components/HeaderClient';

export default async function Header() {
  const [featuredDestinations, featuredPlaces] = await Promise.all([
    prisma.featuredDestination.findMany({
      orderBy: { position: 'asc' },
      take: 8,
      include: { destination: { select: { name: true, slug: true } } },
    }),
    prisma.featuredPlace.findMany({
      orderBy: { position: 'asc' },
      take: 8,
      include: {
        place: {
          select: {
            name: true,
            slug: true,
            destination: { select: { slug: true } },
          },
        },
      },
    }),
  ]);

  const destinations = featuredDestinations.map(({ destination: d }) => ({
    label: d.name,
    href: `/${d.slug}`,
  }));

  const places = featuredPlaces.map(({ place: p }) => ({
    label: p.name,
    href: `/${p.destination.slug}/${p.slug}`,
  }));

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <Image src="/logo.png" alt="Detour Sights" height={68} width={133} className={styles.logoImg} />
        </a>
        <HeaderClient destinations={destinations} places={places} />
      </div>
    </header>
  );
}
