import { MapPin, Phone, Globe, Layers, Calendar, Clock, Timer } from 'lucide-react';
import shared from '../shared.module.css';
import styles from './PlaceDetailsCard.module.css';
import PlaceHoursRow from './PlaceHoursRow';

const ICON_SIZE = 13;

const INDOOR_OUTDOOR_LABEL = {
  INDOOR: 'Indoors',
  OUTDOOR: 'Outdoors',
  BOTH: 'Indoors & Outdoors',
};

const VISIT_DURATION_LABEL = {
  UNDER_1_HOUR:      'Under 1 hour',
  ONE_TO_TWO_HOURS:  '1–2 hours',
  TWO_TO_FOUR_HOURS: '2–4 hours',
  HALF_DAY:          'Half a day',
  FULL_DAY:          'Full day',
};

/*
  Sidebar details card showing:
  - Address (all)
  - Website (all)
  - Setting / indoorOutdoor (all)
  - Phone (food, nightlife, arts, activities)
  - Booking / bookInAdvanceWarning (sights, food, nightlife, arts, activities)
  - Time needed / visitDuration (sights, nature, arts, activities)

  Need to add:
  - hours
*/

const CATEGORY_FIELDS = {
  'sights-and-landmarks':       ['address', 'website', 'indoorOutdoor', 'booking', 'visitDuration'],
  'nature-outdoors':            ['address', 'website', 'indoorOutdoor', 'visitDuration'],
  'food-and-drink':             ['address', 'phone', 'website', 'indoorOutdoor', 'booking'],
  'nightlife':                  ['address', 'phone', 'website', 'indoorOutdoor', 'booking'],
  'shopping':                   ['address', 'website', 'indoorOutdoor'],
  'arts-and-entertainment':     ['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'visitDuration'],
  'activities-and-experiences': ['address', 'phone', 'website', 'indoorOutdoor', 'booking', 'visitDuration'],
};

export default function PlaceDetailsCard({ place, categorySlugs = [] }) {
  const visibleFields = new Set(['address', 'hours', 'phone', 'website', 'indoorOutdoor', 'booking', 'visitDuration']);
  // const visibleFields = new Set(categorySlugs.flatMap(slug => CATEGORY_FIELDS[slug] ?? []));


  const ai = place.aiGenData;
  const hours = place.openingHours?.weekdayDescriptions;

  const hasPracticalInfo =
    (visibleFields.has('address') && place.address) ||
    (visibleFields.has('hours') && hours?.length) ||
    (visibleFields.has('phone') && place.phone) ||
    (visibleFields.has('website') && place.website) ||
    (visibleFields.has('indoorOutdoor') && ai?.indoorOutdoor) ||
    (visibleFields.has('booking') && ai?.bookingRequired != null) ||
    (visibleFields.has('visitDuration') && ai?.visitDuration);

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
            <span className={styles.practicalKey}><MapPin size={ICON_SIZE} />Address</span>
            <span className={styles.practicalVal}>{place.address}</span>
          </div>
        )}
        {visibleFields.has('hours') && hours?.length > 0 && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}><Clock size={ICON_SIZE} />Hours</span>
            <PlaceHoursRow weekdayDescriptions={hours} />
          </div>
        )}
        {visibleFields.has('phone') && place.phone && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}><Phone size={ICON_SIZE} />Phone</span>
            <a href={`tel:${place.phone}`} className={styles.practicalVal}>{place.phone}</a>
          </div>
        )}
        {visibleFields.has('website') && place.website && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}><Globe size={ICON_SIZE} />Website</span>
            <a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.practicalVal}>
              {websiteHost}
            </a>
          </div>
        )}
        {visibleFields.has('indoorOutdoor') && ai?.indoorOutdoor && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}><Layers size={ICON_SIZE} />Setting</span>
            <span className={styles.practicalVal}>{INDOOR_OUTDOOR_LABEL[ai.indoorOutdoor]}</span>
          </div>
        )}
        {visibleFields.has('booking') && ai?.bookingRequired === true && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}><Calendar size={ICON_SIZE} />Booking</span>
            <span className={styles.practicalVal}>Required in advance</span>
            {ai.bookInAdvanceWarning && (
              <span className={styles.bookingNote}>{ai.bookInAdvanceWarning}</span>
            )}
          </div>
        )}
        {visibleFields.has('visitDuration') && ai?.visitDuration && (
          <div className={styles.practicalRow}>
            <span className={styles.practicalKey}><Timer size={ICON_SIZE} />Time needed</span>
            <span className={styles.practicalVal}>{VISIT_DURATION_LABEL[ai.visitDuration]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
