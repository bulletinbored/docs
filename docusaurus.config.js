// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'bulletinbored',
  tagline: 'Forum software that\'s minimal. Zero dependencies.',
  favicon: 'img/favicon.svg',

  // Set the production url of your site here
  url: 'https://docs.bulletinbored.net',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, you often have to set this to '/bulletinbored-core/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'bulletinbored', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/bulletinbored/bulletinbored-core/tree/master/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/favicon.svg',
      navbar: {
        title: 'bulletinbored',
        logo: {
          alt: 'bulletinbored Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/bulletinbored/bulletinbored-core',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/',
              },
              {
                label: 'Architecture',
                to: '/architecture',
              },
              {
                label: 'Configuration',
                to: '/configuration',
              },
            ],
          },
          {
            title: 'Development',
            items: [
              {
                label: 'Plugins',
                to: '/plugins',
              },
              {
                label: 'Themes',
                to: '/themes',
              },
              {
                label: 'Managers',
                to: '/managers',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/bulletinbored/bulletinbored-core',
              },
              {
                label: 'Plugin Catalog',
                href: 'https://github.com/bulletinbored/bulletinbored-core/blob/master/data/catalog.json',
              },
              {
                label: 'License',
                href: 'https://github.com/bulletinbored/bulletinbored-core/blob/master/LICENSE',
              },
              {
                label: 'CLA',
                href: 'https://github.com/bulletinbored/bulletinbored-core/blob/master/CLA.md',
              },
            ],
          },
        ],
        copyright: `Copyright Â© ${new Date().getFullYear()} bulletinbored Â· BSD Zero Clause License`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['php', 'json', 'bash'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;
