#!/bin/bash

# Admin Pages Dark Mode Batch Fix Script
# Fixes all remaining bg-white instances in admin pages

echo "🎨 Starting Admin Pages Dark Mode Fix..."
echo "========================================"

# Create backup
BACKUP_DIR="admin_backup_$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r src/pages/admin "$BACKUP_DIR/"

FIXED_COUNT=0

# Process all admin page files
find src/pages/admin -name "*.tsx" -type f | while read file; do
    echo "🔧 Processing: $file"
    
    # Fix 1: Card containers (most common pattern)
    sed -i '' 's/className="\([^"]*\)bg-white rounded-lg shadow-sm\([^"]*\)"/className="\1card-glass\2"/g' "$file"
    sed -i '' 's/className="\([^"]*\)bg-white rounded-xl shadow-sm\([^"]*\)"/className="\1card-glass\2"/g' "$file"
    
    # Fix 2: Cards with borders
    sed -i '' 's/bg-white rounded-lg shadow-sm border border-gray-200/card-glass/g' "$file"
    sed -i '' 's/bg-white rounded-xl shadow-sm border border-gray-200/card-glass/g' "$file"
    
    # Fix 3: Simple white backgrounds
    sed -i '' 's/bg-white rounded-lg shadow-sm/card-glass/g' "$file"
    sed -i '' 's/bg-white rounded-xl shadow-sm/card-glass/g' "$file"
    
    # Fix 4: White backgrounds with padding
    sed -i '' 's/className="\([^"]*\)bg-white rounded-lg p-/className="\1card-glass p-/g' "$file"
    sed -i '' 's/className="\([^"]*\)bg-white rounded-xl p-/className="\1card-glass p-/g' "$file"
    
    # Fix 5: Remaining bg-white with dark mode
    sed -i '' 's/\([^-]\)bg-white"/\1bg-white dark:bg-secondary-900"/g' "$file"
    sed -i '' 's/\([^-]\)bg-white /\1bg-white dark:bg-secondary-900 /g' "$file"
    
    # Fix 6: Text colors
    sed -i '' 's/text-gray-900"/text-gray-900 dark:text-white"/g' "$file"
    sed -i '' 's/text-gray-800"/text-gray-800 dark:text-gray-100"/g' "$file"
    sed -i '' 's/text-gray-700 mb/text-gray-700 dark:text-gray-300 mb/g' "$file"
    sed -i '' 's/text-gray-700"/text-gray-700 dark:text-gray-300"/g' "$file"
    sed -i '' 's/text-gray-600"/text-gray-600 dark:text-gray-400"/g' "$file"
    sed -i '' 's/text-gray-500"/text-gray-500 dark:text-gray-400"/g' "$file"
    
    # Fix 7: Borders
    sed -i '' 's/border-gray-200"/border-gray-200 dark:border-secondary-700"/g' "$file"
    sed -i '' 's/border-gray-300"/border-gray-300 dark:border-secondary-700"/g' "$file"
    sed -i '' 's/divide-gray-200"/divide-gray-200 dark:divide-secondary-700"/g' "$file"
    
    # Fix 8: Table headers
    sed -i '' 's/bg-gray-50"/bg-gray-50 dark:bg-secondary-800"/g' "$file"
    sed -i '' 's/bg-gray-100"/bg-gray-100 dark:bg-secondary-800"/g' "$file"
    
    # Fix 9: Hover states
    sed -i '' 's/hover:bg-gray-50"/hover:bg-gray-50 dark:hover:bg-secondary-800\/50"/g' "$file"
    sed -i '' 's/hover:bg-gray-100"/hover:bg-gray-100 dark:hover:bg-secondary-800"/g' "$file"
    
    # Fix 10: Form elements (if not already using form- classes)
    sed -i '' 's/className="\([^"]*\)block text-sm font-medium text-gray-700 mb-2"/className="\1form-label"/g' "$file"
    sed -i '' 's/className="\([^"]*\)w-full px-3 py-2 border border-gray-300 rounded-lg/className="\1form-input/g' "$file"
    
    FIXED_COUNT=$((FIXED_COUNT + 1))
done

echo ""
echo "✅ Processed $FIXED_COUNT admin files!"
echo "💾 Backup saved to: $BACKUP_DIR"
echo ""
echo "🔍 Checking remaining bg-white instances..."
REMAINING=$(grep -r "bg-white" src/pages/admin --include="*.tsx" | grep -v "dark:" | wc -l | tr -d ' ')
echo "📊 Remaining bg-white without dark mode: $REMAINING"
echo ""
echo "⚠️  IMPORTANT: Please review the changes and test your admin pages!"
echo "   If something breaks, restore from: $BACKUP_DIR"
echo ""
echo "🎉 Admin dark mode fix complete!"

