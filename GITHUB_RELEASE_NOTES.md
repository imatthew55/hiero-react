# v0.2.0 — hiero-react

React hooks for reading data from the Hiero / Hedera network via the Mirror Node REST API.

## What's included

This release ships the complete read-only hook surface for the Hiero ecosystem:

- **Account & transaction hooks** — `useAccount`, `useTransactions`, `useTokens`, `useNFTs`
- **File service hooks** — `useFile`, `useFileContents`
- **Smart contract hooks** — `useContract`, `useContractCalls`, `useContractLogs`
- **HCS topic hooks** — `useTopic`, `useTopicMessages`
- **Context** — `HieroProvider`, `useHiero`

All hooks are read-only, require no private keys, and connect to the public Hedera Mirror Node REST API.

## Install

```bash
npm install hiero-react
```

## Changes in this release

### Added
- Full hook surface: `useFile`, `useFileContents`, `useContract`, `useContractCalls`, `useContractLogs`, `useTopic`, `useTopicMessages`
- Improved README with complete hooks reference, architecture diagram, and full usage examples
- Updated CONTRIBUTING.md with DCO and GPG signing guidance
- CodeQL security scanning and Dependabot dependency updates

### Fixed
- Replaced broken `tim-actions/dco` action with a reliable custom shell-script DCO check
- Updated DCO action configuration

### Changed
- Updated LICENSE

> GPG-signed commits and DCO sign-offs enforced from 2026-02-27 onward.

## Links

- [npm](https://www.npmjs.com/package/hiero-react)
- [Documentation / README](https://github.com/imatthew55/hiero-react#readme)
- [Changelog](https://github.com/imatthew55/hiero-react/blob/main/CHANGELOG.md)