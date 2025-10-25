# 📖 Book Reader - Quick Start Guide

## 🚀 Getting Started

### 1. Access the Reader
Navigate to: `/audio-portal/my-books/reader/22`

### 2. First Time Setup

#### Add Audio Files (Optional)
1. Download free sound effects:
   - [Freesound.org](https://freesound.org/) - Search "page turn"
   - [Mixkit.co](https://mixkit.co/free-sound-effects/) - UI sounds
   
2. Place files in `src/assets/sfx/`:
   - `page-flip.mp3` (required)
   - `page-drag.mp3` (optional)

3. Format: MP3, ~1 second duration, < 50KB

---

## 🎮 Controls

### Navigation
| Action | Method |
|--------|--------|
| Next Page | Click **►** button or press **→** |
| Previous Page | Click **◄** button or press **←** |
| Jump to Chapter | Click **☰ Chapters** → Select chapter |
| Close Panels | Press **ESC** |

### Settings
1. Click **⚙️ Settings** button
2. Adjust:
   - **Font Size**: A- / A+ buttons
   - **Line Spacing**: Slider (1.4 - 2.0)
   - **Theme**: Light / Sepia / Dark
   - **Sound Effects**: Toggle on/off
   - **Volume**: Slider (0% - 100%)

---

## 🎨 Features

### Realistic Book View
- ✅ Two pages displayed side-by-side (like real book)
- ✅ Spine shadow between pages
- ✅ Page numbers at bottom
- ✅ Professional typography

### Smart Pagination
- ✅ Automatic text flow
- ✅ No orphaned headings
- ✅ Respects paragraph breaks
- ✅ Real-time re-pagination when changing settings

### Themes
- **☀️ Light**: White background, black text
- **📜 Sepia**: Cream background, warm text (easier on eyes)
- **🌙 Dark**: Dark background, light text (night reading)

### Audio Effects
- 🔊 Page flip sound on navigation
- 🎚️ Adjustable volume
- 🔇 Toggle on/off anytime

---

## 💾 Auto-Save

Your progress is automatically saved:
- ✅ Last page you read
- ✅ Current chapter
- ✅ All settings
- ✅ Restores on next visit

---

## 📱 Responsive Design

### Desktop (> 1200px)
- Two pages side-by-side
- Chapters sidebar visible
- Full toolbar

### Tablet (768px - 1200px)
- Single page view
- Collapsible sidebar
- Compact toolbar

### Mobile (< 768px)
- Single page view
- Hidden sidebar (toggle to show)
- Minimal controls

---

## 🔧 Troubleshooting

### "Book Not Found"
- Falls back to legacy API
- Check projectId in URL

### "No Audio Playing"
- Ensure files exist in `assets/sfx/`
- Check browser console for errors
- Toggle audio off/on in settings

### "Pages Look Wrong"
- Clear browser cache
- Check font size (reset to 16px)
- Try different theme

### "State Not Saving"
- Check localStorage is enabled
- Clear old data: `localStorage.clear()`

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` | Next page |
| `←` | Previous page |
| `ESC` | Close sidebar/settings |

---

## 🎯 Tips

1. **Best Reading Experience**:
   - Use sepia theme for long reading
   - Adjust line spacing to 1.8 for comfort
   - Enable audio for immersion

2. **Performance**:
   - Re-pagination happens automatically on settings change
   - Large books may take 2-3 seconds to paginate

3. **Accessibility**:
   - All buttons have aria-labels
   - Keyboard navigation fully supported
   - High contrast themes available

---

## 📚 Sample Book Content

**Book ID 22**: "The Mountain's Secret"
- 4 chapters
- 32 paragraphs
- ~15 pages
- English language
- Adventure genre

---

## 🆘 Support

For issues or questions:
1. Check `BOOK_READER_IMPLEMENTATION.md` for technical details
2. Review browser console for errors
3. Check `assets/sfx/README.md` for audio setup

---

## ✨ Enjoy Reading!

Happy reading! Use the settings to customize your experience. 📖✨
