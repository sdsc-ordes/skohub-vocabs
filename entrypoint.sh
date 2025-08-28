#!/bin/sh
set -e

# Path where external branding stuff is expected
EXTERNAL_DIR="/custom-assets"
echo "Checking for external branding components in $EXTERNAL_DIR"

TARGET_DIR="/app/src"
echo "Target directory for branding components is $TARGET_DIR"
# only use entrypoint if running skohub-vocabs

if [ "$1" = "npm" ] ; then
    if [ -d "$EXTERNAL_DIR/" ]; then
    echo "External branding components found. Copying..."
    cp -r "$EXTERNAL_DIR/"* "$TARGET_DIR/"
    else
    echo "No external branding components found in $EXTERNAL_DIR. Skipping."
    fi
else
    echo "Not running skohub-vocabs, skipping branding component check."
fi
# Finally, run the container's main CMD
exec "$@"
