import styles from './WhyVisit.module.css';

const DESCRIPTION =
  'Travelers love this destination for its rich culture, distinctive character, and the kind of experiences you can\'t find anywhere else. Whether you\'re drawn by the food, the history, or simply the atmosphere, most visitors leave wishing they\'d stayed longer.';

export function WhyVisit({ destinationName }) {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h2 className={styles.heading}>Why should you go to {destinationName}</h2>
        <p className={styles.subtitle}>What other travelers have to say, based on real reviews.</p>
      </div>

      <div className={styles.right}>
        <div className={styles.avatar}>Brian</div>
        <div className={styles.card}>{DESCRIPTION}</div>
      </div>
    </div>
  );
}
