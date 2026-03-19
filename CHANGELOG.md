# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.1] - 2026-03-19

### Added
- Code coverage reporting via `@vitest/coverage-v8` with v8 provider
- `test:coverage` script for running tests with coverage output
- Coverage thresholds enforced in CI: 80% lines/functions, 75% branches
- `CHANGELOG.md` to track version history

---

## [0.2.0] - 2026-03-16

### Added
- Full hook surface: `useFile`, `useFileContents`, `useContract`, `useContractCalls`, `useContractLogs`, `useTopic`, `useTopicMessages`
- Shared pagination utility (`fetchPage`, `fetchAllPages`, `resolveNextUrl`) in `src/utils/pagination.ts`
- Improved README with complete hooks reference, architecture diagram, and full usage examples
- Updated CONTRIBUTING.md with DCO and GPG signing guidance

### Fixed
- Replaced broken `tim-actions/dco` action with a reliable custom shell-script DCO check
- Updated DCO action configuration

### Changed
- Updated LICENSE

---

## [0.1.1] - 2026-02-20

### Fixed
- Corrected `package.json` exports field ordering and build output path configuration

---

## [0.1.0] - 2026-02-20

### Added
- Initial project setup with TypeScript and React (`chore: Eerste initial project setup`)
- `HieroProvider` context provider with `network` and optional `mirrorNodeUrl` props
- `useHiero()` — access current network configuration
- `useAccount(accountId)` — fetch HBAR balance and account info
- `useTransactions(accountId, limit?)` — fetch recent transactions with pagination
- `useTokens(accountId)` — fetch fungible tokens held by an account
- `useNFTs(accountId)` — fetch NFTs with automatic base64 metadata decoding
- ESLint configured with TypeScript types
- Test suite for account, transaction, token, and NFT hooks
- CI pipeline: lint/typecheck, build + test matrix (Node 18/20/22), npm publish dry-run
- CodeQL security scanning, Dependabot dependency updates

---

> GPG-signed commits and DCO sign-offs are enforced from 2026-02-27 onward.