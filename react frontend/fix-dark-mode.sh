.#!/bin/bash

# Dark Mode Batch Fix Script for React Frontend
# This script automatically fixes common dark mode issues across all TSX files

echo "🎨 Starting Dark Mode Batch Fix..."
echo "=================================="

# Count of files to be processed
TOTAL_FILES=$(find src -name "*.tsx" -type f | wc -l | tr -d ' ')
echo "📁 Found $TOTAL_FILES TSX files to process"

# Backup directory
BACKUP_DIR="src_backup_$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup in $BACKUP_DIR..."
cp -r src "$BACKUP_DIR"

# Counter
FIXED_COUNT=0

# Find and fix all TSX files
find src -name "*.tsx" -type f | while read file; do
    echo "🔧 Processing: $file"
    
    # Fix 1: Card/Container backgrounds
    sed -i '' 's/className="\([^"]*\)bg-white rounded-lg shadow-sm border border-gray-200\([^"]*\)"/className="\1card-glass\2"/g' "$file"
    
    # Fix 2: Simple white backgrounds with borders
    sed -i '' 's/bg-white rounded-lg\( shadow[^ "]*\)\? border border-gray-200/bg-white dark:bg-secondary-900 rounded-xl border border-gray-200 dark:border-secondary-700/g' "$file"
    sed -i '' 's/bg-white rounded-xl\( shadow[^ "]*\)\? border border-gray-200/bg-white dark:bg-secondary-900 rounded-xl border border-gray-200 dark:border-secondary-700/g' "$file"
    
    # Fix 3: Text colors
    sed -i '' 's/text-gray-900"/text-gray-900 dark:text-white"/g' "$file"
    sed -i '' 's/text-gray-800"/text-gray-800 dark:text-gray-100"/g' "$file"
    sed -i '' 's/text-gray-700"/text-gray-700 dark:text-gray-300"/g' "$file"
    sed -i '' 's/text-gray-600"/text-gray-600 dark:text-gray-400"/g' "$file"
    sed -i '' 's/text-gray-500"/text-gray-500 dark:text-gray-400"/g' "$file"
    
    # Fix 4: Borders
    sed -i '' 's/border-gray-200"/border-gray-200 dark:border-secondary-700"/g' "$file"
    sed -i '' 's/border-gray-300"/border-gray-300 dark:border-secondary-700"/g' "$file"
    
    # Fix 5: Modal overlays
    sed -i '' 's/bg-black bg-opacity-50/bg-black\/60 dark:bg-black\/80 backdrop-blur-sm/g' "$file"
    
    # Fix 6: Table headers
    sed -i '' 's/className="\([^"]*\)bg-gray-50\([^"]*\)"/className="\1bg-gray-50 dark:bg-secondary-800\2"/g' "$file"
    
    # Fix 7: Hover states
    sed -i '' 's/hover:bg-gray-50"/hover:bg-gray-50 dark:hover:bg-secondary-800\/50"/g' "$file"
    sed -i '' 's/hover:bg-gray-100"/hover:bg-gray-100 dark:hover:bg-secondary-800"/g' "$file"
    
    # Fix 8: Input backgrounds
    sed -i '' 's/className="\([^"]*\)bg-white\([^"]*\)"/className="\1bg-white dark:bg-secondary-900\2"/g' "$file"
    
    FIXED_COUNT=$((FIXED_COUNT + 1))
done

echo ""
echo "✅ Fixed $FIXED_COUNT files!"
echo "💾 Backup saved to: $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANT: Please review the changes before committing!"
echo "   If something breaks, restore from: $BACKUP_DIR"
echo ""
echo "🎉 Dark mode batch fix complete!"

