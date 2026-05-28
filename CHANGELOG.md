# Changelog

All notable changes to this project will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] — 2026-05-28

### Changed

- **Interrupt behavior: abort-all replaced with queue / immediate-execute**
  - Navigating during an animation now queues the request rather than aborting the current animation
  - The queue executes in FIFO order; each navigation starts as soon as the previous one completes with no inter-animation gap
  - **Immediate-execute** (abort + restart) fires when the target resolves to the animation's origin face, or when `animation: false` is passed — this produces a seamless reverse when called immediately after starting forward navigation
  - Multiple queued requests for the same face are deduplicated; only one animation runs
  - An immediate-execute clears the entire pending queue
- **Boundary animation internals**: virtual-wrap concept abolished; boundary (wrap-around) animations now use direct-wrap exclusively, making `getCurrentFace()` always return a valid face number during any animation

### Fixed

- **Bilateral CSS animation restored** (#23): `aria-hidden` removal on the incoming face is now deferred to `step()`, after `applyFaceTransforms()` positions the face. Previously the face was revealed at its center position before the transition started, causing only the outgoing face to animate; now both faces start their CSS transitions from their side positions simultaneously
- **Animation glitches** (#18): fixed boundary snap on the first frame, abort flash when interrupting a transition, and a React state consolidation issue that caused intermediate renders during navigation
- **React `inert` on hidden faces**: replaced `useEffect` + `useRef` with a ref callback so the DOM property is set synchronously before paint; fixes a regression in React 18 where the `inert` JSX prop was silently dropped
- **No-op DOM mutation guards** (#22): `setCurrentFace` and `hideFace` now skip classList/attribute writes when the value is already correct, preventing spurious MutationObserver records in Chrome and jsdom

## [0.3.0] — 2026-05-26

### Added

- **Interrupt support**: calling `next()`, `prev()`, or `goTo()` during an in-flight animation now cancels it and starts a new animation from the current display face, instead of being ignored

## [0.2.2] — 2026-05-25

### Fixed

- Corrected copyright holder in LICENSE

## [0.2.1] — 2026-05-25

### Fixed

- README: fixed compound component examples and `TurnBoxRootHandle` table
- README: added flip card GIF to React / Vue Quick Start

## [0.2.0] — 2026-05-25

### Added

- **Accessibility baseline**: hidden faces are marked `inert` and `aria-hidden`; keyboard focus moves to the newly visible face after each navigation; `prefers-reduced-motion` support
- **`reduceAnimation` option** (`"system setting"` | `"never"`): controls whether `prefers-reduced-motion` suppresses animations. Defaults to `"system setting"`
- **`TurnBox.Provider`** component for React and Vue to set `reduceAnimation` for a subtree

## [0.1.0] — 2026-05-24

### Added

- `@kazuhi-ra/turnbox-dom` — Vanilla JS adapter with `createTurnBox()`
- `@kazuhi-ra/turnbox-react` — React compound component (`TurnBox.Root / Face / Button`) and `useTurnBox` hook
- `@kazuhi-ra/turnbox-vue` — Vue compound component (`TurnBox.Root / Face / Button`) and `useTurnBox` composable
- `@kazuhi-ra/turnbox-core` — Pure geometry and navigation functions for custom renderers

[Unreleased]: https://github.com/nohtcoltd/turnbox_js/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/nohtcoltd/turnbox_js/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/nohtcoltd/turnbox_js/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/nohtcoltd/turnbox_js/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/nohtcoltd/turnbox_js/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/nohtcoltd/turnbox_js/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nohtcoltd/turnbox_js/releases/tag/v0.1.0
