# Quick Dark Mode Fix Script

## Automated Replacement Pattern

For all remaining admin pages, use find & replace with these patterns:

### Pattern 1: Card/Container Backgrounds
**Find:**
```
bg-white rounded-lg shadow-sm border border-gray-200
```

**Replace with:**
```
card-glass
```

OR for non-hoverable elements:
```
bg-white dark:bg-secondary-900 rounded-xl border border-gray-200 dark:border-secondary-700
```

### Pattern 2: Text Colors

**Find & Replace:**
```
text-gray-900" -> text-gray-900 dark:text-white"
text-gray-700" -> text-gray-700 dark:text-gray-300"
text-gray-600" -> text-gray-600 dark:text-gray-400"
text-gray-500" -> text-gray-500 dark:text-gray-400"
border-gray-200" -> border-gray-200 dark:border-secondary-700"
border-gray-300" -> border-gray-300 dark:border-secondary-700"
```

### Pattern 3: Modal Overlays
**Find:**
```
bg-black bg-opacity-50
```

**Replace with:**
```
bg-black/60 dark:bg-black/80 backdrop-blur-sm
```

### Pattern 4: Table Headers
**Find:**
```
bg-gray-50
```

**Replace with:**
```
bg-gray-50 dark:bg-secondary-800
```

### Pattern 5: Hover States
**Find:**
```
hover:bg-gray-50
```

**Replace with:**
```
hover:bg-gray-50 dark:hover:bg-secondary-800/50
```

### Pattern 6: Input Elements
**Find:**
```
bg-white
```
(in input/select/textarea elements)

**Replace with:**
```
bg-white dark:bg-secondary-900
```

## Files to Update
Run these replacements on all files in:
- `src/pages/admin/*.tsx`
- `src/components/*.tsx`

## VS Code Multi-File Find & Replace
1. Open VS Code
2. Press `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac)
3. Enable "Use Regular Expression" mode
4. Set "files to include": `react frontend/src/pages/admin/*.tsx, react frontend/src/components/*.tsx`
5. Run each replacement pattern above

## Priority Files
1. ✅ AdminVotes.tsx
2. ✅ AdminWithdrawals.tsx
3. AdminEvents.tsx
4. AdminProfile.tsx
5. AdminNotifications.tsx
6. AdminTransactions.tsx
7. NomineesPage.tsx
8. SubscriptionsPage.tsx

## Post-Fix Checklist
- [ ] All white backgrounds have dark mode variants
- [ ] All text colors have proper contrast
- [ ] All borders are visible in dark mode
- [ ] All modals have glassmorphism  
- [ ] All tables use `.table-modern` class
- [ ] All stat cards use `.card-glass` class
- [ ] All forms use `.form-*` classes

