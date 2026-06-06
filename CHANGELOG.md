# Changelog

All notable changes to GreenCharge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — 2026-06-06

### 📖 Documentation
- Restructured contributing guide: merged `CONTRIBUTOR.md` into `CONTRIBUTING.md` as the main English guide
- Added comprehensive Chinese contributing guide (`CONTRIBUTING_CN.md`)
- Added Code of Conduct section
- Added Security Vulnerability Reporting section
- Added Developer Certificate of Origin (DCO) section
- Added Bug Report and Feature Request templates
- Added Conventional Commits specification with examples
- Added Table of Contents to both EN and CN guides
- Added bidirectional language links across all contributing files
- Added GitHub Actions deploy status badge to README
- Added `CONTRIBUTOR.md` as a redirect stub to avoid broken links

### 🔧 Changed
- Unified project name to "GreenCharge" across all documentation
- Updated README Contributing section with contribution badges

---

## [2.0.1] — 2026-05-05

### 📖 Documentation
- Added initial `CONTRIBUTING.md` to guide community contributions

### 🐛 Fixed
- Portal page demo mode: use mock data instead of API calls
- Test account format updated in both README and README_CN

---

## [2.0.0] — 2026-04-28

### 🚀 Added

#### Core Platform
- **Operations Dashboard** — KPI cards (revenue, active stations, utilization rate), revenue trend charts, station ranking table
- **Station Monitoring** — Interactive map (React-Leaflet), real-time station status, custom color-coded markers, station detail modal with power curves
- **User Charging Portal** — Nearby station search, QR code scanning, real-time charging monitor (power/voltage/current/cost), online payment simulation, reservation system
- **Financial Settlement** — Split billing with adjustable ratio, monthly settlement table, revenue vs expenditure chart
- **User Management** — Search and filter, account freeze/unfreeze, pagination

#### AI & Data
- **AI Smart Dispatching** — 24h demand prediction with confidence intervals, dynamic pricing (4 tiers), AI decision recommendations (peak shaving, fault warning, load balancing), model performance monitoring
- **Big Data Analytics** — Dark neon-themed dashboard, charging heatmap (hour × day of week), user segmentation (4 tiers), hourly session distribution

#### Energy Innovation
- **V2G Bidirectional Charging** — Bidirectional power curve visualization, interactive revenue calculator, V2G station list
- **Virtual Power Plant (VPP)** — Grid interaction curves (generation/consumption/storage), resource distribution chart, revenue breakdown

#### Business Modules
- **Charging + Ecosystem** — Business model cards (retail/dining/logistics), partner network grid, revenue composition, ROI calculator
- **County Expansion** — Market opportunity statistics, cost comparison (traditional vs lightweight deployment), expansion timeline

#### Infrastructure
- **Backend** — Express.js API (22 RESTful endpoints, 7 modules), SQLite with WAL mode, JWT authentication, Socket.IO WebSocket real-time updates
- **Frontend** — React 19 + Vite 8, React Router v7 (HashRouter), Tailwind CSS v4, Chart.js + react-chartjs-2
- **CI/CD** — GitHub Actions auto-deploy to GitHub Pages on push to main
- **Demo Mode** — One-click demo login, no backend required

#### Documentation
- Bilingual README (English + Chinese)
- Demo GIF
- Video links (YouTube + Bilibili)
- GitHub badges (stars, forks, license)

---

## Versioning notes

- **Pre-2.0** releases are considered alpha builds and are not documented here.
- This changelog starts from the first public release (v2.0.0).

---

[2.1.0]: https://github.com/Rhi637/ev-charging-platform/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/Rhi637/ev-charging-platform/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Rhi637/ev-charging-platform/releases/tag/v2.0.0
