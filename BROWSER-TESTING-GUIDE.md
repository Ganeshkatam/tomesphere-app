# TomeSphere - Complete Browser Testing Guide

**Server:** http://localhost:3000  
**Status:** ✅ Running  
**Date:** 2025-12-12

---

## ⚠️ IMPORTANT: Setup Required Before Testing

### 1. Add Supabase Credentials

Create/edit `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qusuvzwycdmnecixzsgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V2end5Y2RtbmVjaXh6c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTY0MDAsImV4cCI6MjA3OTg5MjQwMH0.rrTm1dBtPoIHphAdP6HdJKZGUoUbD17Hmn7G1sM9o1Q
```

### 2. Restart Dev Server

After adding credentials:
```bash
# Press Ctrl+C to stop current server
npm run dev
```

---

## 📋 Testing Checklist - All 8 Pages

### ✅ PAGE 1: Landing Page (`/`)

**URL:** http://localhost:3000

#### Expected Visual Elements:
- [ ] Large "TomeSphere" title with gradient effect
- [ ] Subtitle: "Discover your next favorite book"
- [ ] Glass-morphism card with "Get Started" heading
- [ ] Email input field with placeholder "you@example.com"
- [ ] Blue gradient "Continue" button
- [ ] Link: "Already have an account? Sign in"
- [ ] Footer text: "Join thousands of book lovers..."
- [ ] Dark gradient background with library image (blurred)

#### Functionality Tests:

**Test 1.1: Email Validation**
1. Click Continue without entering email
2. ✅ Should show error: "Please enter your email"

**Test 1.2: New User Flow**
1. Enter NEW email: `newuser@test.com`
2. Click Continue
3. ✅ Should redirect to: `/signup?email=newuser@test.com`

**Test 1.3: Existing User Flow**
1. Go back to `/`
2. Enter EXISTING email (one you've already used)
3. Click Continue
4. ✅ Should redirect to: `/verify-password?email=existing@test.com`

**Test 1.4: Sign In Link**
1. Click "Sign in" link
2. ✅ Should navigate to: `/login`

---

### ✅ PAGE 2: Login Page (`/login`)

**URL:** http://localhost:3000/login

#### Expected Visual Elements:
- [ ] Header: "Welcome Back"
- [ ] Subtitle: "Sign in to continue to TomeSphere"
- [ ] Email input field (auto-focused)
- [ ] Password input field with show/hide icon
- [ ] "Sign In" button
- [ ] Link: "Don't have an account? Get started"
- [ ] Helper text: "💡 Press Enter to navigate or submit"

#### Functionality Tests:

**Test 2.1: Empty Form Validation**
1. Click "Sign In" without filling fields
2. ✅ HTML5 validation should prevent submission

**Test 2.2: Invalid Credentials**
1. Enter email: `wrong@test.com`
2. Enter password: `wrongpass`
3. Click Sign In
4. ✅ Should show error toast: "Invalid credentials"

**Test 2.3: Valid User Login**
1. Enter valid user credentials
2. Click Sign In
3. ✅ Should show: "Login successful!"
4. ✅ Should redirect to: `/home`

**Test 2.4: Admin Login**
1. Enter admin credentials (if you have an admin account)
2. Click Sign In
3. ✅ Should redirect to: `/admin`

**Test 2.5: Password Toggle**
1. Enter password
2. Click eye icon
3. ✅ Password should become visible
4. Click again
5. ✅ Password should hide

**Test 2.6: Keyboard Navigation**
1. Type in email, press Enter
2. ✅ Should focus password field
3. Type password, press Enter
4. ✅ Should submit form

---

### ✅ PAGE 3: Signup Page (`/signup`)

**URL:** http://localhost:3000/signup?email=test@example.com

#### Expected Visual Elements:
- [ ] Header: "Create Account"
- [ ] Subtitle: "Join TomeSphere and start discovering books"
- [ ] Email field (prefilled, readonly, grayed out)
- [ ] Name input field (auto-focused)
- [ ] Password input field with show/hide
- [ ] Confirm Password field with show/hide
- [ ] "Create Account" button
- [ ] Link: "Already have an account? Sign in"
- [ ] Helper text about Enter key navigation

#### Functionality Tests:

**Test 3.1: Email Prefill**
1. Navigate to `/signup?email=myemail@test.com`
2. ✅ Email field should show: `myemail@test.com`
3. ✅ Email field should be readonly (grayed, can't edit)

**Test 3.2: Password Mismatch**
1. Fill name: "Test User"
2. Fill password: "password123"
3. Fill confirm: "different123"
4. Click Create Account
5. ✅ Should show error: "Passwords do not match"

**Test 3.3: Short Password**
1. Fill name: "Test User"
2. Fill password: "12345"
3. Fill confirm: "12345"
4. Click Create Account
5. ✅ Should show error: "Password must be at least 6 characters"

**Test 3.4: Successful Signup**
1. Fill name: "Test User"
2. Fill password: "password123"
3. Fill confirm: "password123"
4. Click Create Account
5. ✅ Should show: "Account created successfully!"
6. ✅ Wait 1 second, then redirect to: `/home`
7. ✅ New profile should be created in Supabase profiles table

**Test 3.5: Password Visibility Toggles**
1. Test both password fields can show/hide independently

---

### ✅ PAGE 4: Verify Password (`/verify-password`)

**URL:** http://localhost:3000/verify-password?email=existing@test.com

#### Expected Visual Elements:
- [ ] Header: "Welcome Back"
- [ ] Subtitle: "Enter your password to continue"
- [ ] Email field (prefilled, readonly)
- [ ] Password input field (auto-focused) with show/hide
- [ ] "Continue" button
- [ ] Link: "Not you? Use another account"
- [ ] Helper text about Enter key

#### Functionality Tests:

**Test 4.1: Email Prefill**
1. Navigate with email param
2. ✅ Email should be prefilled and readonly

**Test 4.2: Wrong Password**
1. Enter incorrect password
2. Click Continue
3. ✅ Should show error: "Incorrect password"

**Test 4.3: Correct Password - User Role**
1. Enter correct password for user account
2. Click Continue
3. ✅ Should show: "Welcome back!"
4. ✅ Should redirect to: `/home`

**Test 4.4: Correct Password - Admin Role**
1. Enter correct password for admin account
2. Click Continue
3. ✅ Should redirect to: `/admin`

**Test 4.5: "Use Another Account" Link**
1. Click "Use another account"
2. ✅ Should navigate to: `/`

---

### ✅ PAGE 5: Home Page (`/home`) - USER ONLY

**URL:** http://localhost:3000/home

**⚠️ Protected Route:** Requires authentication

#### Expected Visual Elements:

**Navbar:**
- [ ] TomeSphere logo (left)
- [ ] Links: 📚 Discover | 📊 Dashboard | 👤 Profile
- [ ] Logout button (red)

**Page Header:**
- [ ] Title: "Discover Books"
- [ ] Subtitle: "Find your next favorite read from our collection"

**Search & Filters Card (Glass effect):**
- [ ] Search input: "Search by title or author..."
- [ ] Genre dropdown: "All Genres"
- [ ] "📥 Export PDF" button

**Tabs:**
- [ ] "All Books (X)"
- [ ] "🔥 Trending (X)"
- [ ] "✨ For You (X)"

**Results:**
- [ ] Count: "Showing X books"
- [ ] Grid of book cards (4 columns on large screens)

**Book Cards (Each card):**
- [ ] Book cover image
- [ ] Book title
- [ ] Author name
- [ ] Genre badge
- [ ] Heart icon (like button)
- [ ] Star rating (1-5 stars)
- [ ] Dropdown: Add to list (Want to Read / Currently Reading / Finished)

#### Functionality Tests:

**Test 5.1: Search Functionality**
1. Type in search box: "Atomic"
2. ✅ Books should filter in real-time
3. ✅ Count should update: "Showing X books"
4. Clear search
5. ✅ All books should reappear

**Test 5.2: Genre Filter**
1. Select a genre from dropdown (e.g., "Fiction")
2. ✅ Only books of that genre should show
3. ✅ Count should update
4. Select "All Genres"
5. ✅ All books should show

**Test 5.3: Combined Search + Filter**
1. Enter search term + select genre
2. ✅ Books should match both criteria

**Test 5.4: Like a Book**
1. Click heart icon on a book
2. ✅ Should show toast: "Added to likes!"
3. ✅ Heart should turn solid/filled
4. Click again
5. ✅ Should show: "Removed from likes"
6. ✅ Heart should become outline

**Test 5.5: Rate a Book**
1. Click on star rating (e.g., 4 stars)
2. ✅ Should show toast: "Rated 4 stars!"
3. ✅ Stars should fill to 4th star
4. Click different rating
5. ✅ Should update

**Test 5.6: Add to Reading List**
1. Click dropdown on book card
2. Select "Want to Read"
3. ✅ Should show toast: "Added to Want to Read!"

**Test 5.7: Tabs**
1. Click "🔥 Trending" tab
2. ✅ Should show trending books
3. Click "✨ For You" tab
4. ✅ Should show AI recommendations
5. Click "All Books" tab
6. ✅ Should show all books

**Test 5.8: Export PDF**
1. Filter/search for specific books
2. Click "📥 Export PDF"
3. ✅ Should show toast: "PDF downloaded!"
4. ✅ PDF file should download
5. ✅ PDF should contain filtered books

**Test 5.9: Empty State**
1. Search for non-existent book: "zzzzz"
2. ✅ Should show: "No books found"
3. ✅ Should show: "Try adjusting your filters"

**Test 5.10: Navbar Navigation**
1. Click "📊 Dashboard"
2. ✅ Should navigate to `/dashboard`
3. Click "👤 Profile"
4. ✅ Should navigate to `/profile`
5. Click "📚 Discover"
6. ✅ Should return to `/home`
7. Click "TomeSphere" logo
8. ✅ Should stay on `/home`

---

### ✅ PAGE 6: Dashboard Page (`/dashboard`)

**URL:** http://localhost:3000/dashboard

**⚠️ Protected Route:** Requires authentication

#### Expected Visual Elements:

**Navbar:** Same as Home page

**Page Header:**
- [ ] Title: "My Dashboard"
- [ ] Subtitle: "Track your reading activity and preferences"

**Stats Grid (4 cards):**
- [ ] ❤️ Liked Books: X
- [ ] ⭐ Ratings Given: X
- [ ] 💬 Comments: X
- [ ] 📚 Reading List: X

**Tabs:**
- [ ] ❤️ Liked (X)
- [ ] ⭐ Ratings (X)
- [ ] 💬 Comments (X)
- [ ] 📚 Reading List (X)

#### Functionality Tests:

**Test 6.1: Page Load**
1. Navigate to `/dashboard`
2. ✅ Stats should load with correct counts
3. ✅ If no activity, should show empty state

**Test 6.2: Empty State**
1. If new user with no activity:
2. ✅ Should show 📖 icon
3. ✅ Should show: "No Activity Yet"
4. ✅ Should show: "Discover Books" button
5. Click button
6. ✅ Should navigate to `/home`

**Test 6.3: Liked Books Tab** (if you have likes)
1. Click "❤️ Liked" tab
2. ✅ Should show grid of liked books
3. ✅ Each book shows: title, author, genre badge

**Test 6.4: Ratings Tab**
1. Click "⭐ Ratings" tab
2. ✅ Should show list of rated books
3. ✅ Each shows: cover image, title, author, star rating

**Test 6.5: Comments Tab**
1. Click "💬 Comments" tab
2. ✅ Should show list of comments
3. ✅ Each shows: book title, date, comment text

**Test 6.6: Reading List Tab**
1. Click "📚 Reading List" tab
2. ✅ Should show books in reading list
3. ✅ Each shows: cover, title, author, status badge
4. ✅ Status badges colored:
   - ✅ Green: "Finished"
   - 📖 Blue: "Reading"
   - 📚 Yellow: "Want to Read"

---

### ✅ PAGE 7: Profile Page (`/profile`)

**URL:** http://localhost:3000/profile

**⚠️ Protected Route:** Requires authentication

#### Expected Visual Elements:

**Navbar:** Same as Home page

**Page Header:**
- [ ] Title: "Profile"
- [ ] Subtitle: "Manage your account information"

**Profile Card:**
- [ ] Avatar circle with first letter of name
- [ ] User name (large text)
- [ ] Email address
- [ ] Role badge: "👤 User" or "👑 Admin"

**Personal Information Section:**
- [ ] "✏️ Edit Profile" button (when not editing)
- [ ] Name input field
- [ ] Email input field (readonly, grayed)
- [ ] Bio textarea
- [ ] "✓ Save Changes" and "Cancel" buttons (when editing)

**Account Details:**
- [ ] Member Since: date
- [ ] Last Updated: date

**Danger Zone:**
- [ ] "🚪 Logout" button (red)

#### Functionality Tests:

**Test 7.1: View Profile**
1. Navigate to `/profile`
2. ✅ Should show your name, email, role
3. ✅ Avatar should show first letter of name
4. ✅ Role badge should be correct color

**Test 7.2: Edit Profile**
1. Click "✏️ Edit Profile"
2. ✅ Fields should become editable (except email)
3. ✅ "Save Changes" and "Cancel" buttons appear
4. Change name to "New Name"
5. Add bio: "Book lover"
6. Click "✓ Save Changes"
7. ✅ Should show spinner: "Saving..."
8. ✅ Should show toast: "Profile updated successfully!"
9. ✅ Name should update in display
10. ✅ Avatar letter should update

**Test 7.3: Cancel Edit**
1. Click "✏️ Edit Profile"
2. Change name
3. Click "Cancel"
4. ✅ Changes should revert
5. ✅ Edit mode should close

**Test 7.4: Email is Readonly**
1. Click "✏️ Edit Profile"
2. Try to click email field
3. ✅ Should be disabled/readonly
4. ✅ Shows message: "Email cannot be changed"

**Test 7.5: Logout**
1. Click "🚪 Logout"
2. ✅ Should show toast: "Logged out successfully"
3. ✅ Should redirect to: `/`

---

### ✅ PAGE 8: Admin Page (`/admin`) - ADMIN ONLY

**URL:** http://localhost:3000/admin

**⚠️ Protected Route:** Requires admin role

#### Expected Visual Elements:

**Navbar (Admin version):**
- [ ] TomeSphere logo
- [ ] Links: 🛠️ Admin Panel | 👤 Profile
- [ ] Logout button

**Page Header:**
- [ ] Title: "Admin Panel"
- [ ] Subtitle: "Manage books, users, and content moderation"

**Tabs:**
- [ ] 📊 Overview
- [ ] 📚 Books (X)
- [ ] 👥 Users (X)
- [ ] 💬 Reviews

#### Tab: Overview

**Analytics Cards (4):**
- [ ] 📚 Total Books: X
- [ ] 👥 Total Users: X
- [ ] 🏆 Top Genre: X
- [ ] 🆕 New Books (30d): X

**Add New Book Form:**
- [ ] Title input
- [ ] Author input
- [ ] Genre dropdown
- [ ] Description textarea
- [ ] Cover URL input
- [ ] ISBN, Pages, Publisher, Language inputs
- [ ] "Upload Book" button

#### Tab: Books

**Filters:**
- [ ] Search input
- [ ] "📥 Export PDF" button
- [ ] Filter buttons: All (X) | 🆕 New (7d) | ⭐ Featured

**Book List:**
- [ ] Each book shows: cover, title, author, genre
- [ ] ⭐ Shows star if featured
- [ ] "⭐ Featured" or "Feature" button
- [ ] 🗑️ Delete button

#### Tab: Users

**UserManagement Component:**
- [ ] List of all users
- [ ] Shows: name, email, role badge
- [ ] User count

#### Tab: Reviews

**ReviewModeration Component:**
- [ ] List of flagged reviews
- [ ] Shows: book title, review content, flagged reason
- [ ] Action buttons

#### Functionality Tests:

**Test 8.1: Admin Access**
1. Try to access as non-admin user
2. ✅ Should redirect to `/home`

**Test 8.2: Admin Login**
1. Login with admin credentials
2. ✅ Should redirect directly to `/admin`

**Test 8.3: Overview Analytics**
1. Click "📊 Overview" tab
2. ✅ Stats should load with correct numbers
3. ✅ Cards should display total books, users, top genre

**Test 8.4: Add New Book**
1. On Overview tab, scroll to form
2. Fill in book details:
   - Title: "Test Book"
   - Author: "Test Author"
   - Genre: "Fiction"
   - Description: "A test book"
3. Click "Upload Book"
4. ✅ Should show toast: "Book uploaded successfully!"
5. ✅ Total books count should increase

**Test 8.5: View All Books**
1. Click "📚 Books" tab
2. ✅ Should show list of all books
3. ✅ Count should match total

**Test 8.6: Search Books (Admin)**
1. Type in search: "Test"
2. ✅ Should filter books in real-time

**Test 8.7: Filter Buttons**
1. Click "🆕 New (7d)"
2. ✅ Should show only books added in last 7 days
3. Click "⭐ Featured"
4. ✅ Should show only featured books
5. Click "All"
6. ✅ Should show all books

**Test 8.8: Toggle Featured**
1. Find a non-featured book
2. Click "Feature" button
3. ✅ Should show toast: "Added to featured"
4. ✅ Button should change to "⭐ Featured"
5. ✅ Star icon should appear next to title
6. Click "⭐ Featured" again
7. ✅ Should show: "Removed from featured"

**Test 8.9: Delete Book**
1. Click 🗑️ on a book
2. ✅ Should show browser confirm: "Are you sure?"
3. Click OK
4. ✅ Should show toast: "Book deleted successfully!"
5. ✅ Book should disappear from list
6. ✅ Total count should decrease

**Test 8.10: Export PDF (Admin)**
1. Filter books
2. Click "📥 Export PDF"
3. ✅ Should show toast: "Report downloaded!"
4. ✅ PDF should download

**Test 8.11: View Users**
1. Click "👥 Users" tab
2. ✅ Should show list of all users
3. ✅ Should show names, emails, role badges

**Test 8.12: View Reviews**
1. Click "💬 Reviews" tab
2. ✅ Should show flagged reviews (if any)

**Test 8.13: Admin Navbar**
1. Click "TomeSphere" logo
2. ✅ Should stay on `/admin` (not go to /home)
3. Click "👤 Profile"
4. ✅ Should navigate to `/profile`
5. Go back, try to naviate to `/home`
6. ✅ Should redirect back to `/admin`

---

## 🔒 Protected Route Tests

### Test: Unauthenticated Access

1. Logout completely
2. Try to access `/home`
3. ✅ Should redirect to `/login`
4. Try to access `/dashboard`
5. ✅ Should redirect to `/login`
6. Try to access `/profile`
7. ✅ Should redirect to `/login`
8. Try to access `/admin`
9. ✅ Should redirect to `/login`

### Test: User vs Admin Routes

**As User:**
1. Login as regular user
2. Try to access `/admin`
3. ✅ Should redirect to `/home`
4. Access `/home` directly
5. ✅ Should work

**As Admin:**
1. Login as admin
2. Try to access `/home`
3. ✅ Should redirect to `/admin`
4. Try to access `/dashboard`
5. ✅ Should redirect to `/admin`
6. Access `/profile`
7. ✅ Should work (both roles can access)

---

## 🎨 Visual Quality Checklist

### Design Elements to Verify:

- [ ] **Glassmorphism:** Cards have frosted glass effect
- [ ] **Gradients:** Title text and buttons have color gradients
- [ ] **Dark Theme:** Background is dark with subtle texture
- [ ] **Animations:** 
  - fadeIn on page load
  - slideIn on cards
  - Smooth transitions on hover
- [ ] **Blur Background:** Library image visible behind content (blurred)
- [ ] **Custom Scrollbar:** Styled scrollbar (if content scrolls)
- [ ] **Hover Effects:** 
  - Buttons lift on hover
  - Cards lift on hover
  - Links change color on hover
- [ ] **Loading States:** Spinner shows during async operations
- [ ] **Toasts:** Notifications appear top-right with smooth animation

### Responsive Design:

Test different screen sizes:
- [ ] Desktop (1920px+)
- [ ] Laptop (1366px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

## 📊 Database Verification

After testing features, verify in Supabase:

### Profiles Table
- [ ] New signup created profile
- [ ] Role is 'user' by default
- [ ] Name from signup is saved

### Books Table
- [ ] Admin can add books
- [ ] is_featured updates correctly

### Likes Table
- [ ] Liking creates row
- [ ] Unliking deletes row

### Ratings Table
- [ ] Rating creates/updates row
- [ ] Rating value (1-5) is correct

### Reading Lists Table
- [ ] Adding to list creates row
- [ ] Status is correct

### Activity Log Table
- [ ] Actions are logged
- [ ] Metadata is saved

---

## ⚡ Performance Tests

- [ ] **Page Load:** All pages load in < 2 seconds
- [ ] **Search:** Real-time filtering is instant
- [ ] **Navigation:** Page transitions are smooth
- [ ] **Images:** Book covers load properly
- [ ] **No Console Errors:** Check browser console for errors

---

## 🐛 Common Issues to Check

### If pages don't load:
1. Check dev server is running
2. Verify `.env.local` has Supabase credentials
3. Check browser console for errors

### If authentication fails:
1. Verify Supabase credentials are correct
2. Check `auth.users` table exists in Supabase
3. Verify trigger `handle_new_user()` executed

### If data doesn't show:
1. Check Supabase tables have data
2. Run sample data from `schema.sql`
3. Verify RLS policies allow reads

### If middleware redirects incorrectly:
1. Check user role in profiles table
2. Clear browser cache
3. Try incognito window

---

## ✅ Testing Summary Template

```markdown
## Testing Completed: [Date]

### Pages Tested: X/8

- [x] Landing Page - ✅ All tests passed
- [x] Login Page - ✅ All tests passed
- [x] Signup Page - ✅ All tests passed
- [ ] Verify Password - ⚠️ Issue: [describe]
- [ ] Home Page - ❌ Failed: [describe]
- [ ] Profile Page
- [ ] Dashboard Page
- [ ] Admin Page

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
- [Any additional observations]
```

---

**END OF TESTING GUIDE**

Next Steps:
1. Add Supabase credentials to `.env.local`
2. Restart dev server
3. Follow this guide page by page
4. Document any issues found
