import shared from '../shared.module.css';
import styles from './WhatToBringCard.module.css';

export default function WhatToBringCard({ whatToBring }) {
  if (!whatToBring?.length) return null;
  return (
    <div className={shared.sidebarCard}>
      <h2 className={shared.sidebarCardTitle}>What to Bring</h2>
      <ul className={styles.bringList}>
        {whatToBring.map((item, i) => (
          <li key={i} className={styles.bringItem}>
            <span className={styles.bringCheck} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
