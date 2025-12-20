# TomeSphere Mobile Architecture & Design System

## 1. Technical Architecture

### Core Stack
- **Framework**: React Native (via Expo SDK 50+)
- **Routing**: `expo-router` (File-based routing similar to Next.js)
- **State Management**: React Context + Local State (Zustand/Redux not needed yet)
- **Backend/Data**: Supabase (PostgreSQL + RLS)
- **Offline Storage**: `expo-secure-store` for Auth Tokens

### Directory Structure
```
mobile/
├── app/                  # Routes (Screens)
│   ├── (tabs)/          # Main Tab Navigation
│   │   ├── index.tsx    # Home (Cinematic View)
│   │   ├── library.tsx  # User's Books
│   │   ├── explore.tsx  # Discovery
│   │   └── profile.tsx  # Settings & Stats
│   ├── _layout.tsx      # Root Provider (Auth/Theme)
│   └── ...
├── components/          # Reusable UI Parts
│   ├── MobileVoiceListener.tsx # Gaka AI Overlay
│   └── Themed.tsx       # Basic Text/View wrappers
└── lib/                 # Singletons & Helpers
    └── supabase.ts      # Database Client
```

## 2. "Neo-Bento" UI Design System (World Class)

### Core Philosophy
- **"Modular & Playful"**: Content is organized in "Bento Boxes"—distinct, rounded islands of content.
- **"Canva-Fresh"**: High contrast, vibrant pops of color against deep backgrounds.
- **Deep Depth**: Multiple layers: Background -> Glass Sheet -> Content Block -> Floating Action.
- **Motion First**: Everything springs, slides, and fades.

### Visual Tokens

#### Colors
| Token | Value | Sage |
|-------|-------|------|
| `bg-canvas` | `#0f172a` | Deep Slate Canvas |
| `surface-1` | `#1e293b` | Base Card |
| `surface-2` | `#334155` | Elevated Card |
| `accent-primary` | `#8b5cf6` | Electric Violet |
| `accent-secondary`| `#10b981` | Emerald Green |
| `text-high` | `#ffffff` | Pure White |
| `text-med` | `#cbd5e1` | Soft Grey |

#### Components

1. **Bento Cards**
   - `borderRadius: 24` (Soft & Friendly).
   - No borders, just depth via color difference or subtle glow.
   - "Big Number" stats.

2. **Typography**
   - Headings: Massive, Geometric Sans (`fontWeight: '800'`).
   - Body: Clean, readable, well-spaced.

3. **Navigation**
   - Floating "Island" Tab Bar (detached from bottom).

#### Haptics Strategy
- **Tap**: `Selection` (Light & Crisp).
- **Success**: `Notification.Success` (Double tap feeling).
- **Error**: `Notification.Error` (Heavy buzz).

## 3. Implementation Roadmap
- [x] **Home Screen**: Implemented (Cinematic Layout).
- [ ] **Library Screen**: Needs upgrade to "Grid Poster" layout.
- [ ] **Explore Screen**: Needs upgrade to "Category Lanes" and Search.
- [x] **Gaka AI**: Implemented (Holographic Overlay).
