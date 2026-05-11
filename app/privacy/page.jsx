import styles from './page.module.css';

export const metadata = {
  title: 'Privacy Policy | DetourSights',
  description: 'Privacy Policy for DetourSights.',
  robots: { index: false },
};

// TODO: add contact email once decided
const CONTACT_EMAIL = null;

const LAST_UPDATED = 'May 2026';

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <section className={styles.section}>
          <p>
            DetourSights (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website detoursights.com. This page
            explains what information we collect when you use the site, how we use it, and your
            rights regarding that information.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Information We Collect</h2>
          <p>
            We do not require you to create an account or provide any personal information to use
            DetourSights. However, we collect certain anonymous usage data automatically:
          </p>
          <ul>
            <li>Pages visited and time spent on each page</li>
            <li>Referring website or search engine</li>
            <li>Browser type, device type, and operating system</li>
            <li>Approximate geographic location (country or city level, derived from IP address)</li>
          </ul>
          <p>
            This data is collected in aggregate and cannot be used to identify you personally.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to collect the usage data described
            above. You can instruct your browser to refuse all cookies or to indicate when a cookie
            is being sent. If you do not accept cookies, some portions of the site may not function
            correctly.
          </p>
          <p>
            We also store a cookie to remember destinations you have recently searched, so we can
            show relevant suggestions on the homepage. This cookie contains only a destination slug
            (e.g. &quot;paris&quot;) and no personal information.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Third-Party Services</h2>
          <p>We use the following third-party services, which may collect data independently:</p>
          <ul>
            <li>
              <strong>Google Analytics</strong> — collects anonymous usage data to help us
              understand how the site is used. Google&apos;s privacy policy is available at{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                policies.google.com/privacy
              </a>
              .
            </li>
            <li>
              <strong>Google Maps</strong> — used to display maps on place pages. Subject to
              Google&apos;s privacy policy.
            </li>
            <li>
              <strong>Cloudinary</strong> — hosts images displayed on the site. Cloudinary may log
              requests for images served through their network.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Affiliate Links</h2>
          <p>
            Some links on DetourSights may be affiliate links. If you click an affiliate link and
            make a purchase, we may earn a small commission at no extra cost to you. We only link
            to services we believe are relevant and useful to travelers.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Your Rights</h2>
          <p>
            Depending on your location, you may have rights under applicable privacy laws (including
            GDPR and CCPA) to request access to, correction of, or deletion of any personal data we
            hold about you. As we collect no personally identifiable information, there is typically
            nothing to access or delete. If you have a specific concern, please get in touch using
            the contact information below.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Children&apos;s Privacy</h2>
          <p>
            DetourSights is not directed at children under the age of 13. We do not knowingly
            collect personal information from children.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will note the date of the most
            recent update at the top of this page. Continued use of the site after changes are
            posted constitutes acceptance of the updated policy.
          </p>
        </section>

        {CONTACT_EMAIL && (
          <section className={styles.section}>
            <h2>Contact</h2>
            <p>
              If you have any questions about this privacy policy, please contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
