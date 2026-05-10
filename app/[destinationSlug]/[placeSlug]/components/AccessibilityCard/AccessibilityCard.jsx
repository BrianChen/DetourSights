import { Check, X } from 'lucide-react';
import shared from '../shared.module.css';
import styles from './AccessibilityCard.module.css';

const FIELDS = [
  { key: 'wheelchairAccessibleEntrance', label: 'Wheelchair entrance' },
  { key: 'wheelchairAccessibleParking',  label: 'Accessible parking' },
  { key: 'wheelchairAccessibleRestroom', label: 'Accessible restroom' },
  { key: 'wheelchairAccessibleSeating',  label: 'Accessible seating' },
];

export default function AccessibilityCard({ accessibilityOptions }) {
  if (!accessibilityOptions) return null;

  const items = FIELDS.filter(({ key }) => accessibilityOptions[key] != null);
  if (items.length === 0) return null;

  return (
    <div className={shared.sidebarCard}>
      <h2 className={shared.sidebarCardTitle}>Accessibility</h2>
      <ul className={styles.list}>
        {items.map(({ key, label }) => {
          const available = accessibilityOptions[key];
          return (
            <li key={key} className={`${styles.item} ${!available ? styles.unavailable : ''}`}>
              <span className={`${styles.icon} ${available ? styles.iconYes : styles.iconNo}`}>
                {available
                  ? <Check size={13} strokeWidth={2.5} />
                  : <X size={13} strokeWidth={2.5} />
                }
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
