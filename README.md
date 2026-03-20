# dioxus-react-integration

> **DEPRECATED** — This repository is moving to [dx-react/integration](https://github.com/dx-react/integration). This repo will be archived once the migration is complete.

> **Compatibility**: Currently tested with **Dioxus 0.7.3**

[![Crates.io](https://img.shields.io/crates/v/deckyfx-dioxus-react-integration.svg)](https://crates.io/crates/deckyfx-dioxus-react-integration)
[![Documentation](https://docs.rs/deckyfx-dioxus-react-integration/badge.svg)](https://docs.rs/deckyfx-dioxus-react-integration)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](LICENSE)

Serve **React applications** inside the **Dioxus desktop webview** with automatic IPC bridge injection, CSS/JS loading, and proper asset resolution.

## Why React + Dioxus?

- **Use React's Ecosystem** — thousands of React libraries, Tailwind CSS, shadcn/ui, etc.
- **Native Performance** — Dioxus provides the native runtime and window management
- **Seamless IPC** — built-in bridge for Rust <-> React communication
- **Single Binary** — package your React app inside your Dioxus binary
- **Cross-Platform** — desktop, web, and mobile from one codebase

## Features

- **`ReactApp` Component** — loads CSS, injects IPC bridge, mounts JS bundle with correct asset resolution
- **`ReactManifest`** — reads `metadata.json` from your build output to discover hashed chunk filenames
- **Folder Assets** — uses Dioxus `asset!()` on the build output directory (symlink-friendly, no copying)
- **`<base href>` Injection** — automatically sets the document base so relative asset paths in JS resolve correctly
- **Asset Registry** — dynamic asset loading system (optional feature)

## Breaking Changes (v0.2.0)

`ReactContainer` has been removed. Use `ReactApp` instead:

```rust
// Before (v0.1.x):
ReactContainer { bundle: BUNDLE, mount_id: "root" }

// After (v0.2.0):
ReactApp { dir: REACT_DIR, manifest: manifest, bridge: bridge }
```

## Quick Start

### Installation

```toml
[dependencies]
dioxus = "0.7"
deckyfx-dioxus-ipc-bridge = "0.2"
deckyfx-dioxus-react-integration = "0.2"
serde_json = "1.0"
```

### Usage

```rust
use dioxus::prelude::*;
use deckyfx_dioxus_react_integration::prelude::*;
use std::time::Duration;

/// Folder asset pointing to the React build output
const REACT_DIR: Asset = asset!("/assets/react");

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    // 1. Create IPC bridge
    let bridge = IpcBridge::builder()
        .timeout(Duration::from_secs(30))
        .build();

    // 2. Set up routes
    let router = use_signal(|| {
        IpcRouter::builder()
            .route("GET", "/hello/:name", Box::new(HelloHandler))
            .build()
    });

    // 3. Start router
    use_effect(move || {
        router.read().start();
    });

    // 4. Parse build manifest (embedded at compile time)
    let manifest = ReactManifest::from_json(
        include_str!("../assets/react/metadata.json")
    ).expect("invalid metadata.json");

    // 5. Render React app
    rsx! {
        ReactApp {
            dir: REACT_DIR,
            manifest: manifest,
            bridge: bridge,
        }
    }
}
```

## How It Works

### Build Pipeline

```
react-app/
├── src/              ← React source (TypeScript, Tailwind, etc.)
└── dist/             ← Bun/bundler output (hashed chunks)
    ├── chunk-xxx.js
    ├── chunk-yyy.css
    ├── logo-zzz.svg
    └── metadata.json ← generated post-build

assets/
└── react → ../react-app/dist   ← symlink (copy on Windows)
```

1. Build React app with any bundler (Bun, Vite, etc.)
2. Post-build script generates `metadata.json` listing the chunk filenames
3. Symlink `assets/react` to the build output directory
4. Dioxus reads the folder via `asset!("/assets/react")` and the manifest via `include_str!`

### What `ReactApp` Does

The component handles the full lifecycle:

1. **`<base href>`** — injects a base tag so relative URLs in JS (like `./logo.svg`) resolve to the asset folder
2. **Stylesheets** — loads all CSS files listed in the manifest
3. **IPC bridge** — injects the bridge initialization script before React loads
4. **Mount point** — creates the `<div id="root">` where React mounts
5. **JS bundles** — loads all script files listed in the manifest

### Asset Resolution

Dioxus desktop serves the document at `dioxus://index.html/` but assets live at `/assets/react/`. The `<base href>` tag bridges this gap:

| Reference in JS | Without `<base>` | With `<base href="/assets/react/">` |
|---|---|---|
| `"./logo.svg"` | `/logo.svg` (404) | `/assets/react/logo.svg` (works) |
| `"./chunk.css"` | `/chunk.css` (404) | `/assets/react/chunk.css` (works) |

CSS `url()` references already resolve correctly (relative to the CSS file), so they work regardless.

## API Reference

### `ReactApp` Component

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `dir` | `Asset` | Yes | — | Folder asset from `asset!("/assets/react")` |
| `manifest` | `ReactManifest` | Yes | — | Build manifest with chunk filenames |
| `bridge` | `Option<IpcBridge>` | No | `None` | IPC bridge (auto-injects script) |
| `mount_id` | `String` | No | `"root"` | DOM element ID for React mount |

### `ReactManifest`

```rust
let manifest = ReactManifest::from_json(
    include_str!("../assets/react/metadata.json")
).expect("invalid metadata.json");
```

Expected JSON format:
```json
{
  "scripts": ["chunk-2b2s0nqa.js"],
  "styles": ["chunk-q7kzc8rh.css"],
  "assets": ["logo-kygw735p.svg", "react-c5c0zhye.svg"]
}
```

### Optional Features

- **`asset-registry`** — dynamic asset loading system via `AssetRegistry`

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Desktop (Windows/macOS/Linux) | Fully Supported | Native webview |
| Web (WASM) | Fully Supported | WASM + JavaScript |
| Mobile (iOS/Android) | Fully Supported | Native webview |

## Examples

See [dioxus-react-example](https://github.com/deckyfx/dioxus-react-example) for a complete working app with IPC routes, event streaming, Tailwind CSS, and shadcn/ui components.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Licensed under either of:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Related

- [deckyfx/dioxus-react-example](https://github.com/deckyfx/dioxus-react-example) - Complete working example app
- [deckyfx/dioxus-ipc-bridge](https://github.com/deckyfx/dioxus-ipc-bridge) - Core IPC bridge library
- [deckyfx/dioxus-ipc-bridge-macros](https://github.com/deckyfx/dioxus-ipc-bridge-macros) - Proc macros for route handlers
- [deckyfx/dioxus-react-bridge](https://github.com/deckyfx/dioxus-react-bridge) - React hooks and components for IPC
- [Dioxus](https://dioxuslabs.com/) - Rust GUI framework
- [React](https://react.dev/) - JavaScript UI library
