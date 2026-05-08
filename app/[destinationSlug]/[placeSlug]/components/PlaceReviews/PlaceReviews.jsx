import styles from './PlaceReviews.module.css';

export default function PlaceReviews({ reviews }) {
  if (!reviews?.length) return null;
  return (
    <div className={styles.reviews}>
      <h2>Reviews</h2>
      {reviews.map((review) => (
        <div key={review.id} className={styles.review}>
          <div className={styles.reviewHeader}>
            <strong>{review.user.name}</strong>
            <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
          </div>
          {review.body && <p>{review.body}</p>}
        </div>
      ))}
    </div>
  );
}
