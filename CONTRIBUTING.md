# Contributing to hiero-react

Thank you for your interest in contributing to hiero-react! This document explains how to contribute.

## Prerequisites

- Node.js 18+ installed
- Git configured with your name and email
- GPG key set up for signing commits

## Getting Started

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork
```bash
git clone https://github.com/imatthew55/hiero-react.git
cd hiero-react
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Create a Branch
```bash
git checkout -b feat/your-feature-name
```

## Development Workflow

### Available Commands
```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Build and watch for changes
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
npm run lint       # Check code style
npm run format     # Auto-format code
```

### Making Changes

1. Write your code in `src/`
2. Add tests in `tests/`
3. Run `npm test` to verify
4. Run `npm run lint` to check style

## Commit Requirements

### DCO Sign-off (Required)

All commits must include a sign-off line certifying you wrote the code:
```bash
git commit -s -m "feat: add useAccount hook"
```

This adds: `Signed-off-by: Your Name <your@email.com>`

### GPG Signing (Required)

Commits must be cryptographically signed:
```bash
git config commit.gpgsign true
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use For |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |
| `refactor:` | Code changes that don't add features or fix bugs |

Examples:
- `feat: add useTransactions hook`
- `fix: handle null account ID`
- `docs: update README quickstart`

## Pull Request Process

1. Push your branch to your fork
2. Open a Pull Request against `main`
3. Fill in the PR template
4. Wait for CI to pass
5. Request review
6. Address feedback
7. Merge!

## Code Style

- Use TypeScript for all code
- Export types for public APIs
- Write JSDoc comments for public functions
- Keep functions small and focused

## Questions?

Open an issue if you have questions or need help!

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.