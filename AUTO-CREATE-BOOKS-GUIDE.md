# Auto-Create Books from PDF Upload

## How It Works

When you upload a PDF to the `book-pdfs` bucket in Supabase Storage, a book entry is **automatically created** in the `books` table.

## Setup Instructions

1. **Go to Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/qusuvzwycdmnecixzsgc/sql

2. **Run the SQL:**
   - Open `supabase/auto-create-books-trigger.sql`
   - Copy and paste the entire SQL into the editor
   - Click **"Run"**

3. **Done!** Now try it:
   - Upload a PDF to `book-pdfs` bucket
   - Go to the `books` table
   - You'll see a new book entry automatically created!

## How Files Are Processed

**Filename:** `Harry_Potter_and_the_Sorcerers_Stone.pdf`

**Creates book with:**
- **Title:** "Harry Potter and the Sorcerers Stone" (extracted from filename)
- **Author:** "Unknown Author" (default - you can edit later)
- **Genre:** "General" (default - you can edit later)
- **Description:** "Automatically imported from PDF upload"
- **PDF URL:** Full storage URL (auto-generated)
- **Language:** "English" (default)

## Updating Book Details

After auto-creation, go to:
1. **Admin Panel** → Books tab
2. Find the auto-created book
3. Click to edit and update:
   - Author name
   - Genre
   - Description
   - Cover image
   - Other metadata

Or update directly in Supabase Table Editor.

## File Naming Tips

For best results, name your PDFs like:
- `Book_Title_Here.pdf` → Title: "Book Title Here"
- `The_Great_Gatsby.pdf` → Title: "The Great Gatsby"
- Underscores `_` are converted to spaces

## Benefits

✅ **No manual data entry** for basic book info
✅ **PDF URL automatically linked**
✅ **Instant book availability** in the app
✅ **Edit details later** via Admin Panel

## Limitations

- Author, genre, description use defaults (must be updated manually)
- Cover images not auto-extracted (upload via Admin Panel)
- Only works for `book-pdfs` bucket
- Metadata extraction is basic (filename only)

## Advanced: Batch Upload

1. Upload multiple PDFs to `book-pdfs` bucket
2. All books auto-created at once
3. Bulk edit in Admin Panel to add proper metadata
