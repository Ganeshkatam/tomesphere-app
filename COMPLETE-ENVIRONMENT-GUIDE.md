# 🚀 TomeSphere - Complete Environment Setup Package

## 📦 What's Included on Your External Drive

This package contains EVERYTHING you need to run TomeSphere on any Windows computer:

### 1. **TomeSphere Application** ✅
- Complete Next.js 14 source code
- All components, pages, and utilities
- Supabase integration
- Pre-configured styling and assets

### 2. **Documentation** 📚
- Implementation walkthrough
- System flowchart
- Complete setup guide
- API documentation

### 3. **Environment Configuration** ⚙️
- `.env.local` with Supabase credentials
- `package.json` with all dependencies
- Database schema SQL file

---

## 🖥️ Prerequisites (Install on Target Computer)

Before using this package on a new computer, install:

### **1. Node.js (Required)**
- Download: https://nodejs.org/
- Version: 18.x or higher
- Includes NPM automatically

**Verify Installation:**
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
```

### **2. Git (Optional - Recommended)**
- Download: https://git-scm.com/
- Useful for version control

### **3. VS Code (Optional - Recommended)**
- Download: https://code.visualstudio.com/
- Best editor for development

---

## 🚀 Quick Start Guide

### **Step 1: Copy from External Drive**

Copy the entire `TomeSphere-Complete` folder from D: drive to your local computer:

```
From: D:\TomeSphere-Complete\
To:   C:\Projects\TomeSphere\
```

### **Step 2: Install Dependencies**

Open Command Prompt or PowerShell:

```bash
# Navigate to project
cd C:\Projects\TomeSphere\TomeSphere-App

# Install all dependencies (this may take 5-10 minutes)
npm install
```

### **Step 3: Set Up Database**

1. **Go to Supabase**: https://supabase.com
2. **Login** to your project
3. **Open SQL Editor** (Left sidebar)
4. **Copy contents** of `supabase\schema.sql`
5. **Paste and Run** in SQL Editor

### **Step 4: Verify Environment Variables**

Check that `.env.local` exists with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://calkipmghibcukkuaure.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhbGtpcG1naGliY3Vra3VhdXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTc0NzksImV4cCI6MjA3OTMzMzQ3OX0.neOAjsrVgMvCPA0awZCOzflL6NT13HjIGndwFZJU5uw
```

### **Step 5: Run Development Server**

```bash
npm run dev
```

### **Step 6: Open in Browser**

Visit: **http://localhost:3000**

---

## 📂 External Drive Folder Structure

```
D:\TomeSphere-Complete\
│
├── TomeSphere-App\                    # Main application
│   ├── app\                           # Next.js pages
│   │   ├── page.tsx                   # Landing page
│   │   ├── login\                     # Login page
│   │   ├── signup\                    # Signup page
│   │   ├── home\                      # User home
│   │   ├── profile\                   # User profile
│   │   ├── dashboard\                 # User dashboard
│   │   └── admin\                     # Admin panel
│   │
│   ├── components\                    # React components
│   │   ├── Navbar.tsx
│   │   ├── BookCard.tsx
│   │   └── admin\
│   │
│   ├── lib\                           # Utilities
│   │   ├── supabase.ts                # Supabase client
│   │   ├── ai-recommendations.ts      # AI engine
│   │   └── pdf-export.ts              # PDF generator
│   │
│   ├── supabase\                      # Database
│   │   ├── schema.sql                 # Database setup
│   │   └── make-admin.sql             # Admin setup
│   │
│   ├── .env.local                     # ⚠️ IMPORTANT: Credentials
│   ├── package.json                   # Dependencies list
│   ├── next.config.mjs                # Next.js config
│   ├── tsconfig.json                  # TypeScript config
│   ├── tailwind.config.ts             # Tailwind config
│   │
│   ├── README.md                      # Project overview
│   ├── SETUP.md                       # Detailed setup
│   └── USB-Setup-Guide.md             # This guide
│
└── Documentation\                     # All documentation
    ├── walkthrough.md                 # Implementation details
    ├── flowchart.md                   # System architecture
    ├── task.md                        # Development checklist
    └── implementation_plan.md         # Technical plan
```

---

## 🔧 Complete Dependency List

All these will be installed automatically with `npm install`:

### **Core Framework**
- `next` - Next.js 14 framework
- `react` - React 18
- `react-dom` - React DOM

### **Backend & Database**
- `@supabase/supabase-js` - Supabase client

### **UI & Styling**
- `tailwindcss` - Utility CSS framework
- `autoprefixer` - CSS vendor prefixes
- `postcss` - CSS processing

### **Utilities**
- `react-hot-toast` - Toast notifications
- `jspdf` - PDF generation

### **TypeScript**
- `typescript` - TypeScript compiler
- `@types/react` - React type definitions
- `@types/node` - Node.js type definitions

---

## 👑 Admin Setup

After signing up with `katamganesh61@gmail.com`:

**Run in Supabase SQL Editor:**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'katamganesh61@gmail.com';
```

Or use the provided file: `supabase\make-admin.sql`

---

## 🎯 Features Included

### **Authentication**
- ✅ Email/password login
- ✅ Role-based access (User/Admin)
- ✅ Auto-redirects based on role
- ✅ Password visibility toggle
- ✅ Smart Enter key detection

### **User Features**
- ✅ Book discovery with search/filter
- ✅ AI-powered recommendations
- ✅ Trending books
- ✅ Like, rate, and comment on books
- ✅ Reading lists (Want to read, Reading, Finished)
- ✅ User dashboard with activity
- ✅ Profile management
- ✅ PDF export

### **Admin Features**
- ✅ Analytics dashboard
- ✅ Book management (Add/Edit/Delete)
- ✅ User role management
- ✅ Review moderation
- ✅ Featured books management

### **Design**
- ✅ Beautiful library background
- ✅ Glassmorphic UI
- ✅ Responsive design
- ✅ Premium animations
- ✅ Dark theme

---

## 🆘 Troubleshooting

### **"npm is not recognized"**
- Node.js not installed or not in PATH
- Solution: Install Node.js from https://nodejs.org/

### **"Cannot find module"**
- Dependencies not installed
- Solution: Run `npm install`

### **Port 3000 already in use**
- Another app using port 3000
- Solution: `npm run dev -- -p 3001`

### **Build errors**
- Clear cache: `npm cache clean --force`
- Delete node_modules: `Remove-Item -Recurse node_modules`
- Reinstall: `npm install`

### **Database connection errors**
- Check `.env.local` has correct Supabase credentials
- Verify Supabase project is active
- Run database schema if not already done

---

## 📱 Usage Tips

### **Keyboard Shortcuts**
- Press `Enter` on any input field to navigate/submit
- All forms support keyboard-only navigation

### **Development Mode**
- Auto-reloads on file changes
- Shows detailed error messages
- Best for development

### **Production Build**
```bash
npm run build
npm start
```

---

## 🔄 Keeping Your External Drive Updated

After making changes to your project:

```powershell
# Sync changes back to D: drive
robocopy "C:\Projects\TomeSphere\TomeSphere-App" "D:\TomeSphere-Complete\TomeSphere-App" /MIR /XD node_modules .next
```

---

## 📞 Support Files

All documentation is in the `Documentation` folder:
- **walkthrough.md** - Complete feature walkthrough
- **flowchart.md** - System architecture diagram
- **SETUP.md** - Detailed installation guide
- **task.md** - Development task checklist

---

## ✅ Ready to Go!

Your external drive now contains:
1. ✅ Complete TomeSphere application
2. ✅ All source code and components
3. ✅ Database schema and setup files
4. ✅ Environment configuration
5. ✅ Complete documentation
6. ✅ Setup and troubleshooting guides

**Simply copy to any computer with Node.js and you're ready to develop!** 🚀

---

**Last Updated**: December 4, 2025  
**Version**: 1.0  
**Author**: Katam Ganesh
