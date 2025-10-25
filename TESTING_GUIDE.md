# 🧪 Testing the Book Reader

## ✅ Quick Test Steps

### 1. Start Development Server
```bash
ng serve
```

### 2. Navigate to Reader
Open browser: `http://localhost:4200/audio-portal/my-books/reader/22`

### 3. Expected Result
You should see:
- ✅ Book title: "The Mountain's Secret"
- ✅ Two pages displayed side-by-side
- ✅ Chapter 1: "Introduction" in the sidebar
- ✅ Navigation buttons at the bottom
- ✅ Page indicator: "Page 1 of X"

---

## 🔍 What to Test

### ✅ Basic Functionality
- [ ] Book loads successfully
- [ ] Pages display with content
- [ ] Page numbers appear at bottom
- [ ] Chapters list shows in sidebar
- [ ] Current chapter is highlighted

### ✅ Navigation
- [ ] Click **►** button → Next page
- [ ] Click **◄** button → Previous page
- [ ] Press **Arrow Right** → Next page
- [ ] Press **Arrow Left** → Previous page
- [ ] First page: ◄ button is disabled
- [ ] Last page: ► button is disabled

### ✅ Chapter Navigation
- [ ] Click **☰ Chapters** button → Sidebar toggles
- [ ] Click a chapter → Jumps to that chapter
- [ ] Active chapter is highlighted in teal

### ✅ Settings
- [ ] Click **⚙️ Settings** → Panel slides in
- [ ] Click **A+** → Font size increases
- [ ] Click **A-** → Font size decreases
- [ ] Change line spacing slider → Text adjusts
- [ ] Click **Light/Sepia/Dark** → Theme changes
- [ ] Toggle audio → Switch works
- [ ] Adjust volume slider → Value updates

### ✅ State Persistence
- [ ] Navigate to page 3
- [ ] Refresh browser (F5)
- [ ] Should return to page 3
- [ ] Settings should be remembered

### ✅ Responsive Design
- [ ] Resize browser to tablet width → Single page view
- [ ] Resize to mobile → Sidebar hides, navigation compacts
- [ ] Resize back to desktop → Two-page view returns

---

## 🐛 Common Issues & Fixes

### Issue: "Sample Book" with fallback text
**Cause**: JSON file not loading  
**Fix**: 
1. Check console for 404 error
2. Verify file exists: `src/assets/mock/book-22.json`
3. Clear browser cache
4. Restart `ng serve`

### Issue: Blank pages
**Cause**: Pagination failed  
**Fix**:
1. Check console for errors
2. Verify `flow` array has data
3. Check page dimensions in settings

### Issue: No audio
**Expected**: Audio files are optional  
**To Enable**:
1. Add MP3 files to `src/assets/sfx/`
2. Toggle audio on in settings
3. Check browser allows autoplay

### Issue: Settings not saving
**Cause**: LocalStorage disabled  
**Fix**:
1. Check browser privacy settings
2. Allow localStorage for localhost
3. Try incognito mode

---

## 📊 Expected Data

### Book 22: "The Mountain's Secret"
- **Chapters**: 4
  1. Introduction
  2. The Journey Begins
  3. The Hidden Valley
  4. Secrets Unveiled
- **Pages**: ~12-15 (depends on screen size)
- **Elements**: 32 flow items (1 h1, 4 h2, 27 p)

---

## 🎯 Testing Checklist

### Sprint 1 Features
- [x] Mock API loads book-22.json ✅
- [x] Pagination creates correct pages ✅
- [x] Spread displays two pages ✅
- [x] Navigation works (buttons + keyboard) ✅
- [x] Chapter jump positions correctly ✅
- [x] State persists across reload ✅
- [x] Settings apply immediately ✅
- [x] Theme changes work ✅
- [x] Audio toggle works ✅
- [x] Responsive on mobile ✅
- [x] No TypeScript errors ✅
- [x] No console errors ⚠️ (audio 404 is OK)

---

## 📝 Console Output (Expected)

### On Load
```
BookReaderComponent initialized
Loading book 22...
Book loaded: The Mountain's Secret
Chapters: 4
Flow items: 32
Paginating...
Created 14 pages
Restored position: Chapter 1, Page 1
```

### On Navigation
```
Page changed: 2 / 14
State saved: {"chapterId":1,"pageIndex":1,"timestamp":...}
```

### Audio Errors (OK)
```
GET http://localhost:4200/assets/sfx/page-flip.mp3 404 (Not Found)
```
This is expected if you haven't added audio files yet.

---

## 🔧 Developer Console Tests

Open browser console and try:

```javascript
// Check localStorage
localStorage.getItem('reader:22:position')
localStorage.getItem('reader:settings')

// Check component state
// (After opening Angular DevTools)
ng.getComponent($0) // Select reader element first
```

---

## 📸 Expected Screenshots

### Desktop View
```
┌─────────────────────────────────────────┐
│ ☰ Chapters | The Mountain's Secret | ⚙️│
│         Page 1 of 14                    │
├──────────┬────────────────┬─────────────┤
│Chapters  │  [Page 1]      │ [Page 2]   │
│ ✓ Intro  │                │            │
│   Journey│   Content      │  Content   │
│   Valley │                │            │
│   Secrets│      1         │      2     │
│          ├────────────────┴────────────┤
│          │     ◄   1/14    ►          │
└──────────┴────────────────────────────┘
```

### Mobile View
```
┌────────────────────┐
│ ☰ | Title | ⚙️     │
│    Page 1 of 14    │
├────────────────────┤
│                    │
│    [Page 1]        │
│                    │
│    Content...      │
│                    │
│         1          │
│                    │
├────────────────────┤
│   ◄    1/14    ►   │
└────────────────────┘
```

---

## ✨ Success Criteria

✅ Book loads without errors  
✅ Pages display content correctly  
✅ Navigation is smooth and responsive  
✅ Settings apply immediately  
✅ State persists after refresh  
✅ No TypeScript compilation errors  
✅ Responsive design works on all sizes  

---

## 🆘 Need Help?

1. **Check console** for errors
2. **Review** `BOOK_READER_IMPLEMENTATION.md` for technical details
3. **Verify** file paths are correct
4. **Clear cache** and restart server
5. **Test** in different browser

---

## 🎉 If Everything Works

You should see a beautiful book reader with:
- Professional layout
- Smooth page transitions
- Working navigation
- Customizable settings
- Persistent state

**Congratulations! Sprint 1 is complete! 🚀**
