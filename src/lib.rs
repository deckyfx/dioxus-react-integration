//! # Dioxus React Integration
//!
//! This crate provides tools for serving React applications within the Dioxus runtime,
//! combining the best of both worlds: native Dioxus capabilities with React's ecosystem.

pub mod container;

#[cfg(feature = "asset-registry")]
pub mod assets;

// Re-export commonly used types
pub use container::ReactContainer;

#[cfg(feature = "asset-registry")]
pub use assets::AssetRegistry;

/// Prelude module for convenient imports
pub mod prelude {
    pub use crate::container::ReactContainer;

    #[cfg(feature = "asset-registry")]
    pub use crate::assets::AssetRegistry;

    // Re-export dioxus-ipc-bridge prelude
    pub use dioxus_ipc_bridge::prelude::*;
}
