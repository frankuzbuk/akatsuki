# 🎌 ANIZET - Anime Streaming Platform

Modern anime streaming platforma React, FastAPI va MongoDB asosida qurilgan.

## ✨ Asosiy Xususiyatlar

- 🎬 Anime va epizodlar boshqaruvi
- 🔐 JWT + Google OAuth autentifikatsiya
- 💳 Stripe to'lov tizimi (Premium obuna)
- 📤 Cloudflare R2 video hosting
- 👥 Foydalanuvchi boshqaruvi va ban tizimi
- 🎨 Admin panel (dizayn boshqaruvi)
- 🌍 Multilingual (O'zbek/Ingliz)
- 📱 PWA va mobile-friendly

## 🚀 Tezkor Boshlash

### 1. Talablar
- Python 3.11+
- Node.js 18+
- MongoDB 6+
- Yarn

### 2. Backend Sozlash
```bash
cd backend
cp .env.example .env  # .env faylni yarating va o'z qiymatlarini kiriting
pip install -r requirements.txt
python seed_data.py  # Demo ma'lumotlarni yuklash (ixtiyoriy)
uvicorn server:app --host 0.0.0.0 --port 8001
```

### 3. Frontend Sozlash
```bash
cd frontend
cp .env.example .env  # .env faylni yarating
yarn install
yarn start
```

### 4. Brauzerda oching
```
http://localhost:3000
```

## 🔑 Admin Kredensiyalar

**Asosiy admin:**
- Email: `admin@animestream.com`
- Password: `Admin@123456`

**Qo'shimcha admin:**
- Email: `frankpubgm777@gmail.com`
- Password: `Olimjon777`

## 📦 Texnologiyalar

### Backend
- FastAPI (Python)
- MongoDB (Motor async)
- JWT Authentication
- Bcrypt password hashing
- Boto3 (Cloudflare R2)
- Stripe SDK

### Frontend
- React 19
- React Router 7
- Tailwind CSS
- Radix UI
- Lucide Icons
- Axios

### Integratsiyalar
- Cloudflare R2 (video storage)
- Stripe (to'lov)
- Google OAuth (Emergent)
- Jikan API (MyAnimeList)
- AniList GraphQL API

## 🌐 Production Deployment

### MongoDB Atlas (Tavsiya qilinadi)
1. https://www.mongodb.com/cloud/atlas
2. M0 cluster yarating (bepul)
3. Connection string oling
4. `.env` ga qo'shing

### Vercel (Frontend)
1. https://vercel.com
2. GitHub repository ulang
3. Root directory: `frontend`
4. Environment variables qo'shing

### Railway (Backend)
1. https://railway.app
2. GitHub repository ulang
3. Root directory: `backend`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Environment variables qo'shing

## 📁 Loyiha Tuzilishi

```
anizet/
├── backend/
│   ├── server.py          # FastAPI app
│   ├── seed_data.py       # Demo data
│   ├── requirements.txt
│   └── .env.example       # Env template
├── frontend/
│   ├── src/
│   │   ├── pages/         # Sahifalar
│   │   ├── components/    # UI komponentlar
│   │   ├── context/       # State management
│   │   ├── lib/           # API utilities
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🆘 Yordam

Muammo bo'lsa, GitHub Issues'da yozing!

## 📄 Litsenziya

MIT License - O'zingiz uchun ishlatishingiz mumkin.

---

**Anizet Team** 🎬 | Made with ❤️ for anime lovers
