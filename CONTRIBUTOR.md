# Contributor Guide

> English version — for 中文版贡献指南请点击 [中文版 (CONTRIBUTING.md)](CONTRIBUTING.md)

Thank you for your interest in contributing to the EV Charging Platform! This document provides guidelines and instructions for contributing to our project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Community](#community)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and professional in all interactions
- Welcome diverse perspectives and experiences
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

Unacceptable behavior includes harassment, discrimination, and any form of abuse. If you witness or experience such behavior, please report it to the project maintainers.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Git
- Basic understanding of React, Node.js, and full-stack development

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ev-charging-platform.git
   cd ev-charging-platform
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Rhi637/ev-charging-platform.git
   ```

## Development Setup

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Configure Environment Variables

Create a `.env.local` file in the root directory with necessary configuration:
```
REACT_APP_API_URL=http://localhost:5000
# Add other required environment variables
```

### Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Run Tests

```bash
npm test
# or
yarn test
```

### Build for Production

```bash
npm run build
# or
yarn build
```

## How to Contribute

### Types of Contributions

We welcome all types of contributions:

- **Bug Reports** - Help us identify and fix issues
- **Feature Requests** - Suggest new features or improvements
- **Code Contributions** - Submit bug fixes or new features
- **Documentation** - Improve or add documentation
- **Testing** - Help test features and report issues
- **Performance Improvements** - Optimize code and performance

### Finding Issues to Work On

1. Check the [Issues](https://github.com/Rhi637/ev-charging-platform/issues) page
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on an issue to express your interest before starting work
4. Discuss approach with maintainers for significant changes

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-description
```

Use descriptive branch names that clearly indicate the feature or fix.

## Commit Guidelines

### Commit Message Format

Follow these guidelines for clear and consistent commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or updating tests
- `chore`: Changes to build process, dependencies, or other non-code changes

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
```

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** to ensure everything passes:
   ```bash
   npm test
   ```

3. **Build the project** to check for any build errors:
   ```bash
   npm run build
   ```

4. **Check code style** (if linter is configured):
   ```bash
   npm run lint
   ```

### Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the main repository and create a Pull Request
3. Fill out the PR template completely:
   - Clear description of changes
   - Reference related issues (use `Closes #123`)
   - List any breaking changes
   - Include screenshots for UI changes

4. Ensure all CI/CD checks pass
5. Request review from maintainers

### PR Review Process

- At least one maintainer approval is required
- All CI/CD checks must pass
- Code review feedback should be addressed promptly
- Discussions are encouraged for complex changes

## Coding Standards

### JavaScript/React

- Use ES6+ syntax
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex logic
- Use PropTypes or TypeScript for type checking

### Code Quality

- Follow the existing code style
- Write clean, readable code
- Avoid code duplication
- Remove console.log statements before submitting
- Aim for high test coverage for new code

### Comments

```javascript
// Good: Explains the 'why', not the 'what'
// Use exponential backoff to avoid overwhelming the server during retries
const delay = Math.pow(2, retryCount) * 1000;

// Avoid: Obvious comments
// Increment i
i++;
```

## Reporting Bugs

### Before Reporting

1. Check existing [issues](https://github.com/Rhi637/ev-charging-platform/issues) to avoid duplicates
2. Try to reproduce the bug with the latest code
3. Collect relevant information:
   - Browser/Node.js version
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior

### Reporting Format

When creating a bug report, please include:

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. First step
2. Second step
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: 
- Node.js version: 
- Browser: 

**Screenshots**
If applicable, add screenshots
```

## Suggesting Enhancements

### Before Suggesting

1. Check existing [issues](https://github.com/Rhi637/ev-charging-platform/issues) and [discussions](https://github.com/Rhi637/ev-charging-platform/discussions)
2. Think about whether the enhancement fits the project scope

### Enhancement Proposal Format

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

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions
- **Pull Requests** - Code review and collaboration

### Getting Help

- Ask questions in GitHub Discussions
- Review existing documentation
- Check related issues for similar questions
- Contact maintainers if needed

## Recognition

Contributors will be recognized in:
- Commit history
- Project README (if applicable)
- Release notes for major contributions

## Additional Resources

- [GitHub's Contributing Guide](https://docs.github.com/en/contributing)
- [Open Source Contribution Best Practices](https://opensource.guide/)
- [Project Repository](https://github.com/Rhi637/ev-charging-platform)

## License

By contributing to this project, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to the EV Charging Platform! Your efforts help make this project better for everyone. 🚗⚡
