import shared from '../shared.module.css';
import styles from './ProseSection.module.css';

function splitProse(text) {
  const match = text.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (!match) return [null, text];
  return [match[1], match[2]];
}

export default function ProseSection({ title, text }) {
  if (!text) return null;
  const [lead, rest] = splitProse(text);
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>{title}</h2>
      {lead && <p className={styles.proseIntro}>{lead}</p>}
      {rest && <p className={styles.prose}>{rest}</p>}
    </section>
  );
}
