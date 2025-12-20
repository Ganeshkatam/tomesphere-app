# Auto-Match Cover Images Feature

## 🎯 What This Does

**Upload image to `book-covers` bucket → Automatically updates matching book's `cover_url`**

## 📋 How It Works

### Filename Matching Logic:

The trigger matches images to books based on filename:

**Examples:**

| Image Filename | Matches Book Title | Result |
|----------------|-------------------|---------|
| `Harry_Potter.jpg` | "Harry Potter and the..." | ✅ Matched |
| `1984.png` | "1984" | ✅ Matched |
| `Lord_of_the_Rings.jpg` | "The Lord of the Rings" | ✅ Matched |
| `JavaScript.jpg` | "JavaScript_ JavaScript For..." | ✅ Matched |

### Matching Rules:

1. **Exact match** (case-insensitive)
   - `harry_potter.jpg` → "Harry Potter"

2. **Partial match** (contains)
   - `1984.jpg` → "1984: A Novel"
   - `wings.jpg` → "Wings of fire"

3. **Flexible matching**
   - Underscores → Spaces
   - Case doesn't matter
   - Matches if filename is ANYWHERE in title

## 🚀 Setup

1. **Go to Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/qusuvzwycdmnecixzsgc/sql

2. **Run:** `supabase/auto-match-covers.sql`

3. **Done!** Trigger is active.

## 🧪 Test It

### Method 1: Via Supabase Dashboard

1. Go to Storage → `book-covers` bucket
2. Upload an image (e.g., `harry_potter.jpg`)
3. Go to Table Editor → `books`
4. Find "Harry Potter" book → `cover_url` updated! ✅

### Method 2: Via Admin Panel

1. Go to Admin Panel (http://localhost:3000/admin)
2. Use the book upload form
3. Upload cover image → Auto-matched!

## 📝 Naming Tips

**Best Practice:** Name images to match book titles:

✅ **Good:**
- Book: "Harry Potter" → Image: `Harry_Potter.jpg`
- Book: "1984" → Image: `1984.jpg`
- Book: "The Great Gatsby" → Image: `Great_Gatsby.jpg`

❌ **Won't Match:**
- Book: "Harry Potter" → Image: `book1.jpg` (too generic)
- Book: "1984" → Image: `cover.jpg` (no title info)

## ⚠️ Important Notes

### Multiple Matches:
If filename matches MULTIPLE books, ALL will be updated with the same cover.

**Example:**
- Upload `Wings.jpg`
- Books: "Wings of Fire" + "Broken Wings"
- **Both** get the same cover!

**Solution:** Use more specific filenames:
- `Wings_of_Fire.jpg` (more specific)

### No Match:
If no book matches, nothing happens. The image is stored but no book is updated.

**Check:** Make sure the book exists in the table first!

## 🔄 How It's Different from PDF Auto-Create

| Feature | PDF Upload | Cover Upload |
|---------|-----------|--------------|
| **Creates new book?** | ✅ Yes | ❌ No |
| **Updates existing?** | ❌ No | ✅ Yes |
| **Requires book to exist?** | ❌ No | ✅ Yes |

**PDF:** Creates a NEW book from scratch  
**Cover:** Updates EXISTING book's cover

## 📊 Current Auto-Features

✅ **Upload PDF** → Auto-creates book  
✅ **Upload image** → Auto-updates cover  
✅ **Release date** → Auto-set to today  

❌ **Page count** → Manual (requires PDF parsing)  
❌ **ISBN** → Manual  
❌ **Real author/genre** → Manual  

## 🎨 Workflow Example

**Step 1:** Upload PDFs to `book-pdfs`
- Creates 10 books with titles, PDFs, dates ✅

**Step 2:** Upload covers to `book-covers`
- Name them: `Book1.jpg`, `Book2.jpg`, etc.
- Covers auto-matched to books! ✅

**Step 3:** Edit remaining fields
- Go to Table Editor
- Add: ISBN, page count, correct author/genre

**Result:** Fully populated book database with minimal manual work! 🎉
