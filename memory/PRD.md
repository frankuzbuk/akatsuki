# AnimeStream - Product Requirements Document

## Original Problem Statement
Modern anime streaming platform inspired by Crunchyroll with:
- Dark modern UI with orange accent colors
- Hero banner slider, trending/latest anime, anime details
- Video player with episode switching
- User system with JWT + Google OAuth
- Advanced search and filtering
- Admin dashboard with video upload, edit, user ban, payment management
- Multilingual support including Uzbek

## Architecture
- **Frontend**: React 19 + Tailwind CSS + React Router 7
- **Backend**: FastAPI (Python) + Uvicorn
- **Database**: MongoDB with Motor (async)
- **Storage**: Emergent Object Storage (for video uploads)
- **Authentication**: JWT (custom) + Google OAuth (Emergent-managed)
- **Payments**: Stripe (subscription system)

## User Personas
1. **Regular User**: Browses, watches anime, manages watchlist/favorites
2. **Premium User**: Has subscription, accesses premium content
3. **Admin**: Manages anime, episodes, can ban users
4. **Super Admin**: All admin powers + can create other admins

## Core Requirements (Static)
- Dark theme with orange accent colors
- Responsive design
- JWT-based auth with httpOnly cookies
- Google OAuth integration
- Video upload via Emergent Object Storage
- Stripe payment integration
- Admin panel with full CRUD

## What's Been Implemented (Date: 2026-01-24)

### Backend (100% Complete)
- ✅ JWT Authentication (register, login, logout, refresh, password reset)
- ✅ Google OAuth integration (Emergent-managed)
- ✅ Anime CRUD operations
- ✅ Episode CRUD with video/thumbnail upload
- ✅ Comments system
- ✅ Watchlist & Favorites
- ✅ Watch history tracking
- ✅ Admin user management (create admin, ban/unban users)
- ✅ Analytics dashboard endpoints
- ✅ Stripe payment integration (monthly/yearly subscriptions)
- ✅ External API integration (Jikan + AniList)
- ✅ File storage with Emergent Object Storage
- ✅ Demo data seeded (10 anime, 50 episodes)

### Frontend (95% Complete)
- ✅ Homepage with hero slider (5 slides)
- ✅ Trending anime section
- ✅ Latest releases section
- ✅ Anime detail page (cover, description, episodes, comments)
- ✅ Video player page with episode navigation
- ✅ Login/Register with Google OAuth button
- ✅ User profile page
- ✅ Watchlist & Favorites pages
- ✅ Search page with filters (genre, year, status, sort)
- ✅ Pricing/Subscription page
- ✅ Admin Dashboard with 5 tabs:
  - Analytics (stats)
  - Users (with ban/unban)
  - Anime (CRUD)
  - Upload (video upload with progress)
  - Admins (super_admin only)
- ✅ Glassmorphism UI effects
- ✅ Orange accent gradient styling
- ✅ Auth callback handler for Google OAuth
- ✅ Data-testid attributes throughout

### Test Coverage
- Backend: 22/22 tests passed (100%)
- Frontend: All major flows verified (90%)

## Prioritized Backlog

### P0 - Critical (Done)
- ✅ User authentication
- ✅ Anime browsing
- ✅ Video playback
- ✅ Admin management
- ✅ Payment integration

### P1 - High Priority (Partial)
- ✅ Watchlist/Favorites
- ✅ Comments
- ⚠️ Stripe Customer Portal for payment method updates
- ⚠️ Multilingual support (UI strings) - placeholder ready
- ⚠️ Dark/Light mode toggle (currently dark only)

### P2 - Future Features
- AI anime recommendation system
- Live chat/community feature
- Top airing anime sidebar
- PWA support (service worker)
- Push notifications
- Smooth page transitions (Framer Motion)
- Real-time view counts
- User ratings/reviews system
- Anime episode tracking (auto next-episode play)

## Test Credentials
**Admin Account:**
- Email: admin@animestream.com
- Password: Admin@123456
- Role: super_admin

## Next Tasks
1. Implement Stripe Customer Portal for payment method updates
2. Add multilingual support (i18n) with O'zbek/English
3. Add Dark/Light mode toggle
4. Add real-time notifications
5. Implement PWA service worker
6. Add smooth page transitions
7. Build AI recommendation engine

## API Endpoints (55+)
See `/app/memory/test_credentials.md` for complete list

## Frontend Routes
- `/` - Homepage
- `/login` - Login
- `/register` - Register
- `/anime/:id` - Anime detail
- `/watch/:episodeId` - Video player
- `/profile` - User profile
- `/search` - Search & filters
- `/watchlist` - User watchlist
- `/favorites` - User favorites
- `/pricing` - Subscription packages
- `/admin` - Admin dashboard
- `/dashboard` - OAuth callback redirect

## Environment Variables
- MONGO_URL, DB_NAME (Backend)
- JWT_SECRET (Backend)
- ADMIN_EMAIL, ADMIN_PASSWORD (Backend)
- STRIPE_API_KEY (Backend)
- EMERGENT_LLM_KEY (Backend, for storage)
- FRONTEND_URL (Backend)
- REACT_APP_BACKEND_URL (Frontend)
