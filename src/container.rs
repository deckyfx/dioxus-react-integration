//! React Container Component
//!
//! Provides a Dioxus component that serves as a container for React applications.

use dioxus::prelude::*;

/// React container configuration
pub struct ReactContainerConfig {
    pub bundle_path: String,
    pub mount_id: String,
}

/// React container component
///
/// This component provides a mounting point for React applications
/// and loads the React bundle.
#[component]
pub fn ReactContainer(bundle: Asset, mount_id: String) -> Element {
    rsx! {
        div { id: mount_id }
        script { src: bundle }
    }
}
