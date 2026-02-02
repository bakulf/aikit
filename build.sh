#!/bin/bash

set -e

COMMAND=${1:-build}
SPECIFIC_ADDON=""

shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --addon)
            SPECIFIC_ADDON="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

get_addons() {
    if [ -n "$SPECIFIC_ADDON" ]; then
        if [ -d "$SPECIFIC_ADDON" ] && [ -f "$SPECIFIC_ADDON/package.json" ]; then
            echo "$SPECIFIC_ADDON"
        else
            echo "Error: Addon '$SPECIFIC_ADDON' not found" >&2
            exit 1
        fi
    else
        echo "aikit-common"
        echo "aikit-orchestrator"
        find . -maxdepth 1 -type d -name "aikit-*-tool" | sort
    fi
}

install_addon() {
    local addon_dir=$1
    local addon_name=$(basename "$addon_dir")

    echo "Installing $addon_name..."
    cd "$addon_dir"

    if npm install; then
        echo "  OK: $addon_name"
    else
        echo "  FAILED: $addon_name" >&2
        cd ..
        return 1
    fi

    cd ..
}

build_addon() {
    local addon_dir=$1
    local addon_name=$(basename "$addon_dir")

    echo "Building $addon_name..."
    cd "$addon_dir"

    if [ ! -f "package.json" ]; then
        echo "  SKIP: no package.json"
        cd ..
        return 0
    fi

    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        if ! npm install > /dev/null 2>&1; then
            echo "  FAILED: dependencies installation" >&2
            cd ..
            return 1
        fi
    fi

    if npm run build; then
        echo "  OK: $addon_name"
    else
        echo "  FAILED: $addon_name" >&2
        cd ..
        return 1
    fi

    cd ..
}

clean_addon() {
    local addon_dir=$1
    local addon_name=$(basename "$addon_dir")

    echo "Cleaning $addon_name..."
    rm -rf "$addon_dir/dist" "$addon_dir/node_modules"
    echo "  OK: $addon_name"
}

package_addon() {
    local addon_dir=$1
    local addon_name=$(basename "$addon_dir")

    if [ ! -d "$addon_dir/dist" ]; then
        echo "  SKIP: $addon_name (no dist directory)"
        return 0
    fi

    if [ ! -f "$addon_dir/dist/manifest.json" ]; then
        echo "  SKIP: $addon_name (no manifest.json)"
        return 0
    fi

    echo "Packaging $addon_name..."

    # Extract version from manifest.json
    local version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$addon_dir/dist/manifest.json" | cut -d'"' -f4)
    if [ -z "$version" ]; then
        version="0.0.1"
    fi

    local xpi_name="${addon_name}-${version}.xpi"
    local xpi_path="releases/$xpi_name"

    # Create releases directory if it doesn't exist
    mkdir -p releases

    # Create XPI file (which is just a zip file)
    cd "$addon_dir/dist"
    if zip -r -FS "../../$xpi_path" * > /dev/null 2>&1; then
        echo "  OK: $xpi_name"
    else
        echo "  FAILED: $addon_name" >&2
        cd ../..
        return 1
    fi
    cd ../..
}

show_help() {
    cat << EOF
AIKit Build Script

Usage: ./build.sh [command] [options]

Commands:
  install    Install dependencies for all addons
  clean      Clean all build artifacts (dist/ and node_modules/)
  build      Build all addons (default)
  package    Build and package addons into XPI files for release
  help       Show this help message

Options:
  --addon NAME    Only process specific addon
                  Example: ./build.sh build --addon aikit-tabs-tool

Examples:
  ./build.sh                          # Build all addons
  ./build.sh install                  # Install all dependencies
  ./build.sh clean                    # Clean all build artifacts
  ./build.sh build --addon aikit-tabs-tool   # Build only tabs tool
  ./build.sh package                  # Build and create XPI release files

Loading in Firefox:
  1. Go to about:debugging#/runtime/this-firefox
  2. Click 'Load Temporary Add-on'
  3. Select aikit-orchestrator/dist/manifest.json
  4. Load each tool's dist/manifest.json

EOF
}

case $COMMAND in
    install)
        echo "Installing all dependencies..."
        echo ""
        for addon in $(get_addons); do
            install_addon "$addon"
            echo ""
        done
        echo "All dependencies installed."
        ;;

    clean)
        echo "Cleaning all addons..."
        echo ""
        for addon in $(get_addons); do
            clean_addon "$addon"
        done
        echo ""
        echo "All addons cleaned."
        ;;

    build)
        echo "Building all addons..."
        echo ""
        for addon in $(get_addons); do
            build_addon "$addon"
            echo ""
        done
        echo "All addons built successfully."
        echo ""
        echo "Built extensions are in:"
        ls -1d */dist 2>/dev/null | sed 's/^/  /' || echo "  (none found)"
        ;;

    package)
        echo "Building and packaging all addons..."
        echo ""
        for addon in $(get_addons); do
            build_addon "$addon"
            echo ""
        done
        echo "All addons built successfully."
        echo ""
        rm -rf releases
        for addon in $(get_addons); do
            package_addon "$addon"
        done
        echo ""
        if [ -d "releases" ] && [ "$(ls -A releases 2>/dev/null)" ]; then
            echo "Release packages created in releases/:"
            ls -1 releases/*.xpi 2>/dev/null | sed 's/^/  /' || echo "  (none found)"
        else
            echo "No XPI files created."
        fi
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        echo "Unknown command: $COMMAND" >&2
        echo ""
        show_help
        exit 1
        ;;
esac
