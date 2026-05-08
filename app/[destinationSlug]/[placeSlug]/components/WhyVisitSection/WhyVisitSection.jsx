import shared from '../shared.module.css';
import styles from './WhyVisitSection.module.css';

export default function WhyVisitSection({ whyVisit }) {
  if (!whyVisit?.length) return null;
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Why Visit</h2>
      <div className={styles.whyVisitGrid}>
        {whyVisit.map((reason, i) => (
          <div key={i} className={styles.whyVisitCard}>
            <span className={styles.whyVisitNumber}>{String(i + 1).padStart(2, '0')}</span>
            <p>{reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
