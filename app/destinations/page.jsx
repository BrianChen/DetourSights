import prisma from '@/lib/prisma';
import DestinationsExplorer from './DestinationsExplorer';
import styles from './page.module.css';

export const metadata = {
  title: 'All Destinations | DetourSights',
  description: 'Browse all 91 destinations on DetourSights — cities, towns, and regions around the world with curated things to do.',
  alternates: {
    canonical: 'https://www.detoursights.com/destinations',
  },
};

export default async function DestinationsPage() {
  const destinations = await prisma.destination.findMany({
    select: {
      id: true,
      name: true,
      country: true,
      slug: true,
      coverImageUrl: true,
      _count: { select: { places: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <main>
      <div className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>All Destinations</h1>
          <p className={styles.subtitle}>
            {destinations.length} destinations across the world
          </p>
        </div>
      </div>
      <DestinationsExplorer destinations={destinations} />
    </main>
  );
}
