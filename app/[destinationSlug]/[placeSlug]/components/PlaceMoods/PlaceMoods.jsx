import styles from './PlaceMoods.module.css';

const MOOD_ICONS = {
  adventurous: '🧗',
  relaxing: '🌿',
  cultural: '🎭',
  foodie: '🍽',
  'off-the-beaten-path': '🗺',
  romantic: '🌹',
  'family-friendly': '👨‍👩‍👧',
};

export default function PlaceMoods({ moods }) {
  if (!moods?.length) return null;
  return (
    <div className={styles.moods}>
      {moods.map(({ mood }) => (
        <span key={mood.id} className={styles.moodTag}>
          {MOOD_ICONS[mood.slug] ?? '✨'} {mood.name}
        </span>
      ))}
    </div>
  );
}
