#!/bin/bash

# Script to trim transparent spaces from all PNG files in assets directory

ASSETS_DIR="Web/assets"

# Find all PNG files (case insensitive)
find "$ASSETS_DIR" -type f \( -iname "*.png" -o -iname "*.PNG" \) | while read -r file; do
    echo "Processing: $file"
    
    # Create a temporary file
    temp_file="${file}.tmp"
    
    # Trim transparent spaces using ImageMagick
    magick "$file" -trim +repage "$temp_file"
    
    # Check if trim was successful (file size changed or not)
    if [ -f "$temp_file" ]; then
        # Replace original with trimmed version
        mv "$temp_file" "$file"
        echo "✓ Trimmed: $file"
    else
        echo "✗ Failed to trim: $file"
    fi
done

echo "Done! All PNG files have been trimmed."

