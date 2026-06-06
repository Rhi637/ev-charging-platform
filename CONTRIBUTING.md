# Contributing to GreenCharge

> English · [中文版](CONTRIBUTING_CN.md)

Thank you for your interest in contributing to **GreenCharge** — the EV Charging Management Platform!

This guide covers everything from reporting bugs to submitting code. Please read it before opening an issue or pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
- [Developer Certificate of Origin](#developer-certificate-of-origin)
- [Community](#community)
- [License](#license)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for everyone. Please:

- Be respectful and professional in all interactions
- Welcome diverse perspectives and experiences
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

Unacceptable behavior includes harassment, discrimination, and any form of abuse. If you witness or experience such behavior, please report it to the project maintainers.

---

## Quick Start

1. **Fork the repo** and clone to your machine
2. **Install dependencies:** `npm install`
3. **Create a branch:** `git checkout -b feature/your-feature-name`

---

## Development Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git**
- Basic understanding of React, Node.js, and full-stack development

### Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/ev-charging-platform.git
cd ev-charging-platform
git remote add upstream https://github.com/Rhi637/ev-charging-platform.git
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the root directory:

```
REACT_APP_API_URL=http://localhost:5000
# Add other required environment variables
```

### Start Development Server

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

---

## How to Contribute

### Types of Contributions

We welcome all types of contributions:

| Type | Examples |
|------|----------|
| 🐛 **Bug Reports** | Help us identify and fix issues |
| 💡 **Feature Requests** | Suggest new features or improvements |
| 💻 **Code Contributions** | Submit bug fixes or new features |
| 📖 **Documentation** | Improve or add documentation |
| 🧪 **Testing** | Help test features and report issues |
| ⚡ **Performance** | Optimize code and improve efficiency |

### Finding Issues to Work On

1. Check the [Issues](https://github.com/Rhi637/ev-charging-platform/issues) page
2. Look for labels: [`good first issue`](https://github.com/Rhi637/ev-charging-platform/issues?q=label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/Rhi637/ev-charging-platform/issues?q=label%3A%22help+wanted%22)
3. Comment on an issue to express your interest before starting work
4. For significant changes, open a [Discussion](https://github.com/Rhi637/ev-charging-platform/discussions) first to align on approach

### Creating a Feature Branch

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/bug-description
```

Use descriptive names that clearly indicate the purpose.

---

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Usage |
|------|-------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |

### Examples

```
feat(charging): add support for DC fast charging

Added support for DC fast charging stations with real-time power management.
- Implemented DC charging protocol handler
- Added power flow optimization algorithm
- Integrated with grid management system

Closes #123
```

```
fix(auth): resolve token expiration issue

Fixed a bug where authentication tokens were not being refreshed properly,
causing users to be logged out unexpectedly.

Fixes #456
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and linters:**
   ```bash
   npm test
   npm run lint
   ```

3. Ensure the project builds without errors:
   ```bash
   npm run build
   ```

### Submitting

1. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request on the main repository — the [PR template](.github/PULL_REQUEST_TEMPLATE.md) will auto-fill
3. Complete the template:
   - Clear description of changes
   - Reference related issues (use `Closes #123` or `Fixes #456`)
   - List any breaking changes
   - Include screenshots for UI changes
4. Ensure all CI/CD checks pass
5. Wait for review (usually within **1–3 days**)

### PR Checklist

- [ ] My changes follow the code style of this project
- [ ] I have added tests where applicable
- [ ] I have added documentation where necessary
- [ ] All tests pass and the project builds cleanly

### Review Process

- At least one maintainer approval is required
- All CI/CD checks must pass
- Code review feedback should be addressed promptly
- Discussions are encouraged for complex changes

---

## Coding Standards

### JavaScript / React

- Use ES6+ syntax
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex logic
- Avoid `console.log` statements in production code

### Code Quality

- Follow the existing code style (ESLint is configured)
- Write clean, readable code — prioritize clarity
- Avoid code duplication (DRY principle)
- Aim for high test coverage on new code

### Comments

```javascript
// ✅ Good: Explains the 'why', not the 'what'
// Use exponential backoff to avoid overwhelming the server during retries
const delay = Math.pow(2, retryCount) * 1000;

// ❌ Avoid: States the obvious
// Increment i
i++;
```

---

## Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/Rhi637/ev-charging-platform/issues) to avoid duplicates
2. Try to reproduce the bug with the latest code
3. Collect relevant information (browser version, Node.js version, steps to reproduce)

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g. Windows 11, macOS 14]
- Node.js version: [e.g. 18.17.0]
- Browser: [e.g. Chrome 120]

**Screenshots**
If applicable, add screenshots to help explain
```

---

## Suggesting Enhancements

### Before Suggesting

1. Check [existing issues](https://github.com/Rhi637/ev-charging-platform/issues) and [discussions](https://github.com/Rhi637/ev-charging-platform/discussions)
2. Consider whether the enhancement fits the project scope

### Enhancement Proposal Template

```markdown
**Description**
Clear description of the enhancement

**Motivation**
Why should this feature be added?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
Other solutions or features you've considered

**Additional Context**
Any other context or examples
```

---

## Reporting Security Vulnerabilities

⚠️ **Do not report security vulnerabilities publicly.**

If you discover a security issue, please report it privately via:

- **GitHub Security Advisory:** Use the ["Report a vulnerability"](https://github.com/Rhi637/ev-charging-platform/security/advisories/new) tab
- **Email:** Contact the maintainers directly (check the repository for contact details)

We take all security reports seriously and will respond promptly. We ask that you:

- Allow reasonable time for the issue to be addressed before public disclosure
- Provide detailed steps to reproduce the vulnerability
- Do not exploit the vulnerability beyond what is necessary to demonstrate it

---

## Developer Certificate of Origin (DCO)

By contributing to this project, you certify that:

1. The contribution was created in whole or in part by you and you have the right to submit it under the Apache 2.0 license
2. You understand that your contribution will be licensed under the [Apache License 2.0](LICENSE)
3. You grant all necessary patent rights for your contribution

We follow the [Developer Certificate of Origin](https://developercertificate.org/) (DCO) model. By adding a `Signed-off-by` line to your commits, you affirm the above:

```bash
git commit -s -m "feat: add new feature"
```

---

## Community

### Communication Channels

| Channel | Purpose |
|---------|---------|
| [**GitHub Issues**](https://github.com/Rhi637/ev-charging-platform/issues) | Bug reports & feature requests |
| [**GitHub Discussions**](https://github.com/Rhi637/ev-charging-platform/discussions) | Q&A, ideas, general discussion |
| **Pull Requests** | Code review & collaboration |

### Getting Help

- Ask questions in [GitHub Discussions](https://github.com/Rhi637/ev-charging-platform/discussions)
- Review the [README](README.md) and existing documentation
- Check related issues for similar questions

---

## Recognition

Contributors are recognized in:

- Commit history
- [Project README](README.md)
- Release notes for major contributions

---

## Additional Resources

- [GitHub Contributing Guide](https://docs.github.com/en/contributing)
- [Open Source Guides](https://opensource.guide/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Developer Certificate of Origin](https://developercertificate.org/)

---

## License

By contributing to GreenCharge, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

---

Thank you for contributing to GreenCharge! 🚗⚡
