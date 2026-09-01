// src/components/ReviewsStrip.jsx
// Swipeable strip of published reviews — Parish25's light-theme
// counterpart to IQ Academy's ReviewsCarousel. Reads the same
// academy_reviews table (shared Supabase project); Parish25Home.jsx
// does the fetch/sort, this just renders what it's given.

export default function ReviewsStrip({ reviews }) {
  if (!reviews || reviews.length === 0) return null

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2 className="p25-h2">Reviews</h2>
      <p className="p25-lede" style={{ marginBottom: '1.25rem' }}>
        From people who've actually gone through a cohort or private mentorship with IQ Academy.
      </p>
      <div className="p25-reviews-track">
        {reviews.map((r) => (
          <div className="p25-review-card" key={r.id}>
            <p className="p25-review-quote">&ldquo;{r.content}&rdquo;</p>
            <p className="p25-review-name">{r.name}</p>
            {(r.occupation || r.location) && (
              <p className="p25-review-sub">
                {[r.occupation, r.location].filter(Boolean).join(' · ')}
              </p>
            )}
            <span className="p25-review-badge">
              {r.is_private_mentorship ? 'Private mentorship' : (r.academy_trainings?.title || 'Cohort')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
