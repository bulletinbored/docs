import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description={siteConfig.tagline}>
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '1rem',
        textAlign: 'center',
        padding: '1rem'
      }}>
        <h1 style={{ color: '#550296', margin: 0 }}>{siteConfig.title}</h1>
        <p style={{ fontSize: '18px', maxWidth: '40rem' }}>{siteConfig.tagline}</p>
        <Link
          to="/docs/"
          className="button button--primary button--lg"
          style={{ marginTop: '1rem' }}>
          Read the docs
        </Link>
      </main>
    </Layout>
  );
}