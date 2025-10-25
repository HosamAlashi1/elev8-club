# 🔧 Book Reader - Troubleshooting Guide

## 🚨 Common Issues & Solutions

---

### Issue 1: "Sample Book" with fallback text appears

**Symptoms:**
- Title shows "Sample Book"
- Only one chapter: "Chapter 1"
- Text: "This is a sample book. Add your JSON file..."

**Cause:**
The mock API failed to load `book-22.json` and fell back to hardcoded data.

**Solutions:**

#### ✅ Solution A: Verify File Exists
```bash
# PowerShell
Test-Path "src\assets\mock\book-22.json"
# Should return: True
```

#### ✅ Solution B: Check File Content
Open `src/assets/mock/book-22.json` and verify it has:
```json
{
  "book": { ... },
  "chapters": [ ... ],
  "flow": [ ... ]
}
```

#### ✅ Solution C: Clear Cache & Restart
```bash
# Stop server (Ctrl+C)
# Clear browser cache (Ctrl+Shift+Delete)
ng serve
# Hard refresh browser (Ctrl+F5)
```

#### ✅ Solution D: Check Browser Console
Look for errors like:
```
GET http://localhost:4200/assets/mock/book-22.json 404
```

If you see 404, the file path is wrong. Verify:
- File is in correct location
- File name is exactly `book-22.json`
- No typos in path

---

### Issue 2: Blank/Empty Pages

**Symptoms:**
- Pages display but are empty
- No text content
- Only page numbers visible

**Cause:**
Pagination failed or flow array is empty.

**Solutions:**

#### ✅ Check Console
```javascript
// Open browser console
console.log('Pages:', pages.length);
console.log('Flow:', flow.length);
```

#### ✅ Verify JSON Structure
Check `book-22.json` has flow items:
```json
"flow": [
  { "id": "b-1", "type": "h1", "text": "..." },
  { "id": "p1", "type": "p", "text": "..." }
]
```

#### ✅ Check Typography Settings
In JSON, verify:
```json
"typography": {
  "size": 16,        // Not 0
  "lineHeight": 1.65 // Not 0
}
```

---

### Issue 3: Pages Look Cut Off / Overflow

**Symptoms:**
- Text is cut off at bottom
- Content overflows page boundaries

**Cause:**
Page dimensions don't match CSS or content is too large.

**Solutions:**

#### ✅ Adjust Page Settings
In `book-22.json`:
```json
"page": {
  "width": 820,   // Match CSS aspect-ratio
  "height": 600,  // Match CSS aspect-ratio
  "padding": 40   // Match CSS padding
}
```

#### ✅ Check CSS
In `book-reader.component.css`:
```css
.book-page {
  aspect-ratio: 820 / 600;  /* Must match JSON */
  padding: 40px;            /* Must match JSON */
}
```

#### ✅ Reduce Font Size
Click **A-** button multiple times to shrink text.

---

### Issue 4: Navigation Buttons Don't Work

**Symptoms:**
- Clicking ◄/► does nothing
- Keyboard arrows don't work

**Cause:**
Event handlers not binding or page state issue.

**Solutions:**

#### ✅ Check Console for Errors
Look for JavaScript errors when clicking.

#### ✅ Verify Component State
In Angular DevTools:
```javascript
// Select component element
currentPage  // Should be number
totalPages   // Should be > 0
pages.length // Should match totalPages
```

#### ✅ Check Button State
If both buttons are disabled, check:
```javascript
currentPage === 1 && totalPages === 1
// Single page = both disabled
```

---

### Issue 5: Settings Don't Apply

**Symptoms:**
- Clicking A+/A- doesn't change font
- Theme selector doesn't work
- Line spacing slider has no effect

**Cause:**
Settings not binding to page styles or re-pagination failing.

**Solutions:**

#### ✅ Check Console
```javascript
settings.fontSize    // Should change when clicking A+/A-
settings.theme       // Should be 'light'/'sepia'/'dark'
settings.lineHeight  // Should be 1.4-2.0
```

#### ✅ Force Re-render
Change theme multiple times to trigger change detection.

#### ✅ Verify Style Binding
In HTML, check:
```html
[style.font-size.px]="settings.fontSize"
[style.line-height]="settings.lineHeight"
```

---

### Issue 6: State Not Persisting

**Symptoms:**
- Refresh browser → Returns to page 1
- Settings reset after reload

**Cause:**
LocalStorage disabled or not saving.

**Solutions:**

#### ✅ Check LocalStorage
Open browser console:
```javascript
localStorage.getItem('reader:22:position')
// Should return: {"chapterId":1,"pageIndex":2,...}

localStorage.getItem('reader:settings')
// Should return: {"fontSize":16,"theme":"light",...}
```

#### ✅ Enable LocalStorage
- Check browser privacy settings
- Allow cookies/storage for localhost
- Try different browser

#### ✅ Clear Old Data
```javascript
localStorage.clear()
// Refresh page
```

---

### Issue 7: Sidebar/Settings Panel Won't Open

**Symptoms:**
- Clicking ☰ or ⚙️ does nothing
- Panels don't slide in

**Cause:**
Click event not firing or CSS transition issue.

**Solutions:**

#### ✅ Check Component State
```javascript
showChaptersSidebar  // Should toggle true/false
showSettings         // Should toggle true/false
```

#### ✅ Check CSS Classes
In browser DevTools, verify:
```css
.chapters-sidebar.open { transform: translateX(0); }
.settings-panel.open { transform: translateX(0); }
```

#### ✅ Try ESC Key
Press **ESC** to close panels if stuck.

---

### Issue 8: Audio Not Playing

**Symptoms:**
- Page flip sound doesn't play
- Volume control doesn't work

**Expected Behavior:**
Audio files are **optional**. The app works without them.

**To Enable Audio:**

#### ✅ Add Audio Files
1. Download sound effects (see `assets/sfx/README.md`)
2. Place in `src/assets/sfx/`:
   - `page-flip.mp3`
   - `page-drag.mp3`

#### ✅ Verify Paths
In `book-22.json`:
```json
"sounds": {
  "flip": "assets/sfx/page-flip.mp3",  // No leading /
  "drag": "assets/sfx/page-drag.mp3",
  "enabled": true,
  "volume": 0.35
}
```

#### ✅ Enable in Settings
1. Open Settings (⚙️)
2. Toggle "Sound Effects" ON
3. Adjust volume slider

#### ✅ Check Browser Autoplay Policy
Some browsers block autoplay. User interaction required first.

---

### Issue 9: Responsive Layout Broken

**Symptoms:**
- Mobile view shows two pages (should be one)
- Sidebar doesn't hide on mobile
- Navigation buttons overlap

**Cause:**
CSS media queries not applying or viewport meta tag missing.

**Solutions:**

#### ✅ Check Viewport Meta Tag
In `src/index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

#### ✅ Test Responsive Mode
1. Open browser DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select mobile device (iPhone, Pixel)

#### ✅ Force Mobile View
Add to CSS temporarily:
```css
.book-spread {
  grid-template-columns: 1fr !important;
}
```

---

### Issue 10: TypeScript Errors

**Symptoms:**
- Red squiggles in VS Code
- Build fails with type errors

**Cause:**
Type mismatches or missing imports.

**Solutions:**

#### ✅ Check Common Errors

**Error:** `Property 'pages' does not exist`
```typescript
// Add to component:
pages: Page[] = [];
```

**Error:** `Type 'X' is not assignable to type 'Y'`
```typescript
// Check interfaces match:
export interface Page {
  html: string;
  pageNumber: number;
  chapterId?: number;
}
```

#### ✅ Restart TypeScript Server
In VS Code:
1. Ctrl+Shift+P
2. "TypeScript: Restart TS Server"

#### ✅ Clear Node Modules
```bash
rm -rf node_modules
npm install
```

---

## 🔍 Diagnostic Commands

### Check Environment
```bash
node --version    # Should be 14+
npm --version     # Should be 6+
ng version        # Should be 15+
```

### Clear Everything
```bash
# Stop server
# Clear caches
rm -rf node_modules
rm -rf dist
rm -rf .angular
npm install
ng serve
```

### Check File Structure
```bash
ls src/assets/mock/          # Should show book-22.json
ls src/assets/sfx/           # Should show README.md
ls src/app/modules/audioPortal/pages/my-books/book-reader/services/
# Should show 3 services
```

---

## 📊 Health Check Script

Run in browser console:

```javascript
// Health Check
const health = {
  book: !!book,
  chapters: chapters?.length || 0,
  flow: flow?.length || 0,
  pages: pages?.length || 0,
  currentPage: currentPage,
  totalPages: totalPages,
  settings: !!settings,
  localStorage: {
    position: !!localStorage.getItem('reader:22:position'),
    settings: !!localStorage.getItem('reader:settings')
  }
};

console.table(health);

// Expected output:
// book: true
// chapters: 4
// flow: 32
// pages: 14
// currentPage: 1
// totalPages: 14
// settings: true
// localStorage.position: true
// localStorage.settings: true
```

---

## 🆘 Still Having Issues?

1. **Check all error messages** in browser console
2. **Review** `BOOK_READER_IMPLEMENTATION.md`
3. **Compare** your code with the expected structure
4. **Test** in incognito mode (clean environment)
5. **Try** different browser (Chrome, Firefox, Edge)

---

## ✅ Quick Fixes Checklist

- [ ] File exists: `src/assets/mock/book-22.json`
- [ ] JSON is valid (no syntax errors)
- [ ] Server is running (`ng serve`)
- [ ] Browser cache cleared
- [ ] Console has no errors (except audio 404 - OK)
- [ ] LocalStorage enabled
- [ ] Correct URL: `/audio-portal/my-books/reader/22`
- [ ] TypeScript compiled successfully
- [ ] No network issues (check DevTools Network tab)

---

## 🎯 Expected Normal Operation

1. ✅ Book loads in ~500ms
2. ✅ "The Mountain's Secret" title shows
3. ✅ 4 chapters in sidebar
4. ✅ ~14 pages created
5. ✅ Two-page spread visible
6. ✅ Navigation works smoothly
7. ✅ Settings apply immediately
8. ✅ State persists after F5

If all above are true: **Everything is working!** 🎉
