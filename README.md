# bulletinbored Documentation

Documentation website for [bulletinbored](https://github.com/bulletinbored/bulletinbored-core) — minimal, extensible forum software with zero dependencies.

Built with [docmd](https://github.com/docmd-io/docmd).

## Getting Started

This project requires **Node.js 18+** and npm.

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build the static site
npm run build

# Serve the built site locally
npm run preview
```

## Project Structure

```
├── docs/                    # Documentation content (Markdown)
│   ├── index.md             # Welcome / landing page
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
├── assets/
│   ├── css/custom.css       # Global styles & branding
│   └── images/              # Logo & favicon
├── docmd.config.json        # Site configuration
└── package.json
```

## License

BSD Zero Clause — see [LICENSE](https://github.com/bulletinbored/bulletinbored-core/blob/master/LICENSE).