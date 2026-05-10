'use client';

import { useState, useEffect } from 'react';
import styles from './PlaceDetailsCard.module.css';

// weekdayDescriptions is ordered Mon (0) – Sun (6)
// JS Date.getDay() is Sun=0, Mon=1 … Sat=6, so map: (jsDay + 6) % 7
export default function PlaceHoursRow({ weekdayDescriptions }) {
  const [todayIndex, setTodayIndex] = useState(null);

  useEffect(() => {
    setTodayIndex((new Date().getDay() + 6) % 7);
  }, []);

  return (
    <div className={styles.hoursList}>
      {weekdayDescriptions.map((desc, i) => {
        const colonIdx = desc.indexOf(': ');
        const day = desc.slice(0, colonIdx);
        const hours = desc.slice(colonIdx + 2);
        const isToday = i === todayIndex;
        const isClosed = hours === 'Closed';

        return (
          <div key={i} className={`${styles.hoursRow} ${isToday ? styles.hoursToday : ''}`}>
            <span className={styles.hoursDay}>{day.slice(0, 3)}</span>
            <span className={`${styles.hoursTime} ${isClosed ? styles.hoursClosed : ''}`}>
              {hours}
            </span>
          </div>
        );
      })}
    </div>
  );
}
