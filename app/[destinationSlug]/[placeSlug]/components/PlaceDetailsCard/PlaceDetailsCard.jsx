import shared from '../shared.module.css';
import styles from './PlaceDetailsCard.module.css';

const INDOOR_OUTDOOR_LABEL = {
  INDOOR: 'Indoor',
  OUTDOOR: 'Outdoor',
  BOTH: 'Indoor & Outdoor',
};

/*
  Sidebar details card showing:
  - Address (all)
  - Website (all)
  - Setting / indoorOutdoor (all)
  - Phone (food, nightlife, arts, activities)
  - Booking / bookInAdvanceWarning (sights, food, nightlife, arts, activities)
  - Dress code (food, nightlife)
  - Time needed / howLongToSpend (sights, nature, arts, activities)

  Need to add:
  - hours
*/

const CATEGORY_FIELDS = {
  'sights-and-landmarks':       ['address', 'website', 'indoorOutdoor', 'booking', 'howLongToSpend'],
  'nature-outdoors':            ['address', 'website', 'indoorOutdoor', 'howLongToSpend'],
  'food-and-drink':             ['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'dressCode'],
  'nightlife':                  ['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'dressCode'],
  'shopping':                   ['address', 'website', 'indoorOutdoor'],
  'arts-and-entertainment':     ['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'howLongToSpend'],
  'activities-and-experiences': ['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'howLongToSpend'],
};

export default function PlaceDetailsCard({ place, categorySlugs = [] }) {
  const visibleFields = new Set(['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'howLongToSpend', 'dressCode']);
  // const visibleFields = new Set(categorySlugs.flatMap(slug => CATEGORY_FIELDS[slug] ?? []));


  const ai = place.aiGenData;
  const hasPracticalInfo =
    (visibleFields.has('address') && place.address) ||
    (visibleFields.has('phone') && place.phone) ||
    (visibleFields.has('website') && place.website) ||
    (visibleFields.has('indoorOutdoor') && ai?.indoorOutdoor) ||
    (visibleFields.has('booking') && ai?.bookingRequired != null) ||
    (visibleFields.has('dressCode') && ai?.dressCode) ||
    (visibleFields.has('howLongToSpend') && ai?.howLongToSpend);

  if (!hasPracticalInfo) return null;

  let websiteHost = null;
  if (place.website) {
    try { websiteHost = new URL(place.website).hostname.replace('www.', ''); } catch { websiteHost = place.website; }
  }

  return (
    <div className={shared.sidebarCard}>
      <div className={styles.practicalCard}>
        {visibleFields.has('address') && place.address && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}>Address</span>
            <span className={styles.practicalVal}>{place.address}</span>
          </div>
        )}
        {visibleFields.has('phone') && place.phone && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}>Phone</span>
            <a href={`tel:${place.phone}`} className={styles.practicalVal}>{place.phone}</a>
          </div>
        )}
        {visibleFields.has('website') && place.website && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}>Website</span>
            <a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.practicalVal}>
              {websiteHost}
            </a>
          </div>
        )}
        {visibleFields.has('indoorOutdoor') && ai?.indoorOutdoor && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}>Setting</span>
            <span className={styles.practicalVal}>{INDOOR_OUTDOOR_LABEL[ai.indoorOutdoor]}</span>
          </div>
        )}
        {visibleFields.has('booking') && ai?.bookingRequired === true && (
          <>
            <div className={`${styles.practicalRow} ${styles.practicalWarn}`}>
              <span className={styles.practicalKey}>Booking</span>
              <span className={styles.practicalVal}>Required in advance</span>
            </div>
            {ai.bookInAdvanceWarning && (
              <div className={`${styles.practicalRow} ${styles.practicalWarn}`}>
                <span className={styles.practicalKey}>Book ahead</span>
                <span className={styles.practicalVal}>{ai.bookInAdvanceWarning}</span>
              </div>
            )}
          </>
        )}
        {visibleFields.has('dressCode') && ai?.dressCode && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}>Dress code</span>
            <span className={styles.practicalVal}>{ai.dressCode}</span>
          </div>
        )}
        {visibleFields.has('howLongToSpend') && ai?.howLongToSpend && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}>Time needed</span>
            <span className={styles.practicalVal}>{ai.howLongToSpend}</span>
          </div>
        )}
      </div>
    </div>
  );
}
