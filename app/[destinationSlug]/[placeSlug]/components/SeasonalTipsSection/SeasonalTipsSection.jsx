import shared from '../shared.module.css';
import styles from './SeasonalTipsSection.module.css';

export default function SeasonalTipsSection({ seasonalTips }) {
  if (!seasonalTips?.length) return null;
  const goodTips = seasonalTips.filter(t => !t.avoid);
  const avoidTips = seasonalTips.filter(t => t.avoid);
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>When to Go</h2>
      <div className={styles.seasonalGroups}>
        {goodTips.length > 0 && (
          <div className={styles.seasonalGroup}>
            <div className={styles.seasonalGroupHeader}>
              <span className={styles.seasonalGroupBadgeGood}>✓</span>
              <span className={styles.seasonalGroupLabel}>Best times</span>
            </div>
            <div className={styles.seasonalList}>
              {goodTips.map((tip) => (
                <div key={tip.id} className={`${styles.seasonalTip} ${styles.seasonalGood}`}>
                  <div className={styles.seasonalBody}>
                    <strong className={styles.seasonalLabel}>{tip.label}</strong>
                    <p className={styles.seasonalReason}>{tip.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {avoidTips.length > 0 && (
          <div className={styles.seasonalGroup}>
            <div className={styles.seasonalGroupHeader}>
              <span className={styles.seasonalGroupBadgeAvoid}>✕</span>
              <span className={styles.seasonalGroupLabel}>Try to avoid</span>
            </div>
            <div className={styles.seasonalList}>
              {avoidTips.map((tip) => (
                <div key={tip.id} className={`${styles.seasonalTip} ${styles.seasonalAvoid}`}>
                  <div className={styles.seasonalBody}>
                    <strong className={styles.seasonalLabel}>{tip.label}</strong>
                    <p className={styles.seasonalReason}>{tip.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
