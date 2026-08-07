import React, { useEffect } from 'react';
import Layout from '@theme/Layout';

export default function Redirect() {
  useEffect(() => {
    window.location.replace('/docs/');
  }, []);

  return (
    <Layout>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#550296'
      }}>
        Redirecting to documentation...
      </div>
    </Layout>
  );
}