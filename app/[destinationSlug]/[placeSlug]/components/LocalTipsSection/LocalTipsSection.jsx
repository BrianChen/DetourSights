import shared from '../shared.module.css';
import styles from './LocalTipsSection.module.css';

export default function LocalTipsSection({ localTips }) {
  if (!localTips?.length) return null;
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Local Tips</h2>
      <ol className={styles.localTips}>
        {localTips.map((tip, i) => (
          <li key={i} className={styles.localTip}>
            <span className={styles.localTipNum}>{i + 1}</span>
            <p>{tip}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
