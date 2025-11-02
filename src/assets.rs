//! Asset Registry System
//!
//! Provides dynamic asset loading and management for React applications.

use once_cell::sync::Lazy;
use std::collections::HashMap;

/// Asset registry for dynamic asset loading
pub struct AssetRegistry {
    assets: HashMap<String, String>,
}

impl AssetRegistry {
    /// Create a new asset registry
    pub fn new() -> Self {
        Self {
            assets: HashMap::new(),
        }
    }

    /// Register an asset
    pub fn register(&mut self, name: String, path: String) {
        self.assets.insert(name, path);
    }

    /// Get an asset by name
    pub fn get(&self, name: &str) -> Option<&String> {
        self.assets.get(name)
    }
}

impl Default for AssetRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Global asset registry
pub static ASSET_REGISTRY: Lazy<AssetRegistry> = Lazy::new(AssetRegistry::new);
