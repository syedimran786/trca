import "./Portal.css";

/**
 * Skeletons, not a spinner (#111).
 *
 * On a slow metered connection the wait is long enough that a spinner reads as
 * "stuck". A shape that matches what is about to arrive reads as "loading",
 * and it does not shift the layout when the real content lands.
 */
function PortalSkeleton() {
  return (
    <main className="portal" aria-busy="true" aria-live="polite">
      <span className="portal-sr">Loading your portal</span>
      <div className="portal-skeleton">
        <div className="sk sk-line sk-line--sm" />
        <div className="sk sk-line sk-line--lg" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
    </main>
  );
}

export default PortalSkeleton;
