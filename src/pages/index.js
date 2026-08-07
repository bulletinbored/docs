import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function Feature({ icon, title, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function InstallStep({ number, title, description }) {
  return (
    <div className={styles.installStep}>
      <div className={styles.installStepNumber}>{number}</div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} â€” forums, unbloated`}
      description="bulletinbored is minimal, extensible forum software with zero dependencies. Upload files and run â€” no Composer, no Docker, no deployment needed."
    >
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            v0.1.3 Â· Open Source
          </div>
          <h1 className="hero__title">
            Forum software that's <span className="gradient-text">minimal</span>.<br />
            Zero dependencies.
          </h1>
          <p className="hero__subtitle">
            Upload the files to a PHP server and it just works.<br />
            No Composer, no Docker, no hassle.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/docs/installation">
              Get Started
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="https://github.com/bulletinbored/bulletinbored-core"
            >
              GitHub
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Features */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>
              Why <span className="gradient-text">bulletinbored</span>?
            </h2>
            <p className={styles.sectionSubtitle}>Everything you need for a forum, without the bloat.</p>
            <div className={styles.featuresGrid}>
              <Feature icon="âš¡" title="Zero Dependencies" description="No Composer, no Docker, no Node.js. Just PHP 8.x with PDO. Upload the files and you're live." />
              <Feature icon="ðŸ—„ï¸" title="SQLite & MySQL" description="Choose your database. SQLite works out of the box; MySQL is supported via config.php." />
              <Feature icon="ðŸ”Œ" title="Plugin System" description="Extend functionality with simple PHP files. Hooks let you attach to forum events." />
              <Feature icon="ðŸŽ¨" title="Theme System" description="Themes work like plugins: create a folder with a style.css and change the forum's look." />
              <Feature icon="ðŸ”—" title="SEO-Friendly URLs" description="Clean URLs like /thread/1-slug and /category/2-name via rewrite rules." />
              <Feature icon="ðŸ›¡ï¸" title="User Management" description="Registration, profiles with avatars, roles, moderation, private messages, and notifications built in." />
              <Feature icon="ðŸŒ" title="Localization" description="Built-in multilingual support with simple translation files (EN, IT included)." />
              <Feature icon="ðŸ”„" title="Auto Updates" description="Update Manager checks for new versions of core, plugins, and themes via GitHub Releases." />
              <Feature icon="ðŸ–¥ï¸" title="Admin Panel" description="Full dashboard: categories, users, moderation, settings, plugins, themes, and languages." />
            </div>
          </div>
        </section>

        {/* Installation */}
        <section className={clsx(styles.section, styles.sectionDark)}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Installation</h2>
            <p className={styles.sectionSubtitle}>From zero to working forum in under a minute.</p>
            <div className={styles.installSteps}>
              <InstallStep number="1" title="Upload the Files" description="Upload all files to a web server running PHP 8.x with the PDO extension (SQLite or MySQL)." />
              <InstallStep number="2" title="Enable mod_rewrite" description="Make sure Apache mod_rewrite is enabled for SEO-friendly URLs." />
              <InstallStep number="3" title="Set Write Permissions" description="The data/, uploads/, and uploads/avatars/ directories must be writable by the web server." />
              <InstallStep number="4" title="Run the Installer" description="Visit the site: the 2-step installer creates config.php and the database automatically." />
            </div>
            <div className={styles.cta}>
              <Link className="button button--primary button--lg" to="/docs/installation">
                Read the Full Guide
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
