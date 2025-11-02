# dioxus-react-integration

[![Crates.io](https://img.shields.io/crates/v/dioxus-react-integration.svg)](https://crates.io/crates/dioxus-react-integration)
[![Documentation](https://docs.rs/dioxus-react-integration/badge.svg)](https://docs.rs/dioxus-react-integration)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](LICENSE)

Serve **React applications** within the Dioxus runtime, combining the best of both worlds: **native Dioxus capabilities** with **React's ecosystem**.

## Why React + Dioxus?

- **🎯 Use React's Ecosystem**: Leverage thousands of React libraries and components
- **⚡ Native Performance**: Dioxus provides the native runtime and window management
- **🔗 Seamless IPC**: Built-in bridge for Rust ↔ React communication
- **📦 Single Binary**: Package your React app inside your Dioxus binary
- **🚀 Cross-Platform**: Desktop, web, and mobile from one codebase

## Features

- **ReactContainer Component**: Drop-in Dioxus component for mounting React apps
- **Asset Registry**: Dynamic asset loading system (optional feature)
- **TypeScript Support**: Full type definitions for the IPC bridge
- **Hot Reload**: Development mode with hot reload support
- **Builder API**: Clean, fluent configuration interface

## Quick Start

### Installation

```toml
[dependencies]
dioxus = "0.7.0-rc.1"
dioxus-ipc-bridge = "0.1"
dioxus-react-integration = "0.1"

# Optional: Enable asset registry
# dioxus-react-integration = { version = "0.1", features = ["asset-registry"] }
```

### Basic Usage

#### 1. Create Your React App

```bash
# Create React app with Vite
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app

# Copy TypeScript definitions
cp path/to/types.ts src/

# Build for production
npm run build
```

#### 2. Use in Dioxus

```rust
use dioxus::prelude::*;
use dioxus_react_integration::prelude::*;

// Define React bundle as asset
const REACT_BUNDLE: Asset = asset!("/assets/react/bundle.js");

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    // Set up IPC bridge
    let router = use_signal(|| {
        IpcRouter::builder()
            .route("GET", "/hello/:name", Box::new(HelloHandler))
            .build()
    });

    // Initialize bridge
    use_effect(move || {
        let bridge = IpcBridge::builder().build();
        bridge.initialize();

        // Start IPC listener...
    });

    rsx! {
        ReactContainer {
            bundle: REACT_BUNDLE,
            mount_id: "react-root".to_string()
        }
    }
}
```

#### 3. Use Bridge in React

```typescript
// src/App.tsx
import { ipcRequest } from './types';

function App() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Call Rust backend
    ipcRequest<{ message: string }>('ipc://hello/World')
      .then(data => setGreeting(data.message));
  }, []);

  return <div>{greeting}</div>;
}
```

## Advanced Usage

### Asset Registry (Optional Feature)

For dynamic asset loading:

```toml
[dependencies]
dioxus-react-integration = { version = "0.1", features = ["asset-registry"] }
```

```rust
use dioxus_react_integration::prelude::*;

// Register assets
let mut registry = AssetRegistry::new();
registry.register("logo".to_string(), asset!("/assets/logo.png").to_string());

// Access from JavaScript
// window.dioxusBridge.fetch('ipc://assets/logo')
```

### Custom React Configuration

```rust
// Advanced setup with custom configuration
#[component]
fn App() -> Element {
    rsx! {
        // Custom mount point and bundle
        ReactContainer {
            bundle: asset!("/dist/main.js"),
            mount_id: "app-root".to_string()
        }

        // You can mix Dioxus and React!
        div {
            class: "dioxus-sidebar",
            "This is rendered by Dioxus"
        }
    }
}
```

### TypeScript Integration

Full TypeScript support with included type definitions:

```typescript
// src/types.ts (provided by library)
import { IpcResponse, ipcRequest, subscribeToStreamingTask } from './types';

interface User {
  id: string;
  name: string;
  email: string;
}

// Type-safe requests
const user = await ipcRequest<User>('ipc://user/123');
console.log(user.name); // TypeScript knows this exists!

// Type-safe streaming
subscribeToStreamingTask(taskId, {
  onProgress: (progress) => {
    console.log(`${progress.percent}%`);
  },
  onComplete: (result) => {
    console.log('Done!');
  }
});
```

### React Hooks for IPC

Create custom hooks for common patterns:

```typescript
// useIpcQuery.ts
import { useState, useEffect } from 'react';
import { ipcRequest } from './types';

export function useIpcQuery<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    ipcRequest<T>(url)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading } = useIpcQuery<User>(`ipc://user/${userId}`);

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

## Building Your React App

### Development Workflow

1. **Develop React app** with hot reload:
   ```bash
   npm run dev
   ```

2. **Build for production**:
   ```bash
   npm run build
   ```

3. **Copy to Dioxus assets**:
   ```bash
   cp dist/assets/index-*.js ../dioxus-app/assets/react/bundle.js
   ```

4. **Run Dioxus app**:
   ```bash
   cargo run
   ```

### Automated Build Script

```bash
#!/bin/bash
# build-react.sh

cd react-app
npm run build

# Copy bundle to Dioxus assets
cp dist/assets/index-*.js ../dioxus-app/assets/react/bundle.js

echo "React app built and copied to Dioxus assets!"
```

### Vite Configuration

Optimize your Vite build for Dioxus integration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Single bundle file
        entryFileNames: 'bundle.js',
        chunkFileNames: 'bundle.js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
```

## Project Structure

Recommended project structure:

```
my-app/
├── Cargo.toml
├── src/
│   └── main.rs           # Dioxus app
├── assets/
│   └── react/
│       └── bundle.js     # Built React bundle
└── react-app/            # React source
    ├── package.json
    ├── src/
    │   ├── App.tsx
    │   └── types.ts      # IPC type definitions
    └── vite.config.ts
```

## Examples

See the `examples/` directory for complete working examples:

- `simple_react.rs` - Basic React integration
- `with_assets.rs` - Using asset registry
- `full_app/` - Complete example application

Run an example:

```bash
cargo run --example simple_react --features desktop
```

## API Reference

### Components

- **`ReactContainer`**: Dioxus component for mounting React apps
  - `bundle: Asset` - React bundle asset
  - `mount_id: String` - DOM element ID for mounting

### Features

- **`asset-registry`**: Enable dynamic asset loading system

### Types (TypeScript)

- **`DioxusBridge`**: Main bridge interface
- **`IpcResponse<T>`**: Response type
- **`IpcRequestOptions`**: Request configuration
- **`StreamingProgress`**: Progress updates
- **`ipcRequest<T>(url)`**: Helper for type-safe requests
- **`subscribeToStreamingTask()`**: Subscribe to streaming events

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Desktop | ✅ Fully Supported | Native window with webview |
| Web | ✅ Fully Supported | WASM + JavaScript |
| Mobile | ✅ Fully Supported | Native webview on iOS/Android |

## Best Practices

### 1. Bundle Optimization

- Use production builds for React (`npm run build`)
- Minimize bundle size with code splitting
- Lazy load heavy components

### 2. Error Handling

```typescript
try {
  const data = await ipcRequest('ipc://api/endpoint');
} catch (error) {
  console.error('IPC request failed:', error);
  // Show user-friendly error message
}
```

### 3. State Management

- Use React Query or SWR for server state
- Keep UI state in React
- Use IPC bridge for Rust-side data only

### 4. Performance

- Batch IPC requests when possible
- Use streaming for large data transfers
- Cache responses in React

## Troubleshooting

### React Bundle Not Loading

- Verify asset path is correct
- Check browser console for errors
- Ensure bundle is built (`npm run build`)

### IPC Bridge Not Available

- Confirm bridge is initialized before React loads
- Check `window.dioxusBridge` exists in browser console
- Verify bridge script is evaluated

### TypeScript Errors

- Ensure `types.ts` is copied to React project
- Update types if bridge API changes
- Check TypeScript compiler options

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Licensed under either of:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Related

- [dioxus-ipc-bridge](https://github.com/yourusername/dioxus-ipc-bridge) - Core IPC bridge library
- [Dioxus](https://dioxuslabs.com/) - Rust GUI framework
- [React](https://react.dev/) - JavaScript UI library
