#!/bin/bash
set -e

echo "🦀 Publishing deckyfx-dioxus-react-integration to crates.io..."
echo ""

# Check if logged in
echo "🔐 Checking cargo login..."
if ! cargo login --help &> /dev/null; then
    echo "❌ Please run 'cargo login' first with your crates.io API token"
    exit 1
fi

# Check if ipc-bridge dependency is published
echo "📦 Checking if deckyfx-dioxus-ipc-bridge is available..."
if ! cargo search deckyfx-dioxus-ipc-bridge | grep -q "deckyfx-dioxus-ipc-bridge ="; then
    echo "❌ Error: deckyfx-dioxus-ipc-bridge must be published first"
    exit 1
fi

echo "🧪 Running dry run..."
cargo publish --dry-run

echo ""
echo "🚀 Publishing to crates.io..."
cargo publish

echo ""
echo "✅ deckyfx-dioxus-react-integration published successfully!"
echo ""
echo "Verify at: https://crates.io/crates/deckyfx-dioxus-react-integration"
echo ""
