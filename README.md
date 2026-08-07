# bulletinbored Documentation

Documentation website for [bulletinbored](https://github.com/bulletinbored/bulletinbored-core) — minimal, extensible forum software with zero dependencies.

Built with [Docusaurus](https://docusaurus.io/).

## Getting Started

This project requires **Node.js 18+** and npm.

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Build the static site
npm run build

# Serve the built site locally
npm run serve
```

## Project Structure

```
├── docs/                    # Documentation content (Markdown)
│   ├── intro.md             # Welcome / landing doc
│   ├── installation.md      # Installation guide
│   ├── installation-manual.md # Manual installation
│   ├── architecture.md      # Architecture
│   ├── configuration.md     # Configuration
│   ├── plugins.md           # Plugin development
│   ├── themes.md            # Theme development
│   ├── managers.md          # Managers
│   ├── localization.md      # Localization
│   ├── versioning.md        # Versioning
│   └── license.md           # License
├── src/
│   ├── css/custom.css       # Global styles & branding
│   └── pages/               # Landing page
├── static/img/              # Logo & favicon
├── docusaurus.config.js     # Site configuration
├── sidebars.js              # Sidebar navigation
└── package.json
```

## Branding

The site uses the bulletinbored brand:

- **Colors**: `#550296` (primary purple), `#9a3bf6` (secondary purple), `#1a1a2e` (dark text), `#0f0f1e` (dark background)
- **Fonts**: Inter (body), JetBrains Mono (code)
- **Logo/Favicon**: `static/img/logo.svg` and `static/img/favicon.svg`

## License

BSD Zero Clause — see [LICENSE](https://github.com/bulletinbored/bulletinbored-core/blob/master/LICENSE).