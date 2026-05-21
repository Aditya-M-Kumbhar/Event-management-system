# ⚡ EventSphere — AI-Powered Event Management & Ticketing Platform

> Enterprise-grade, production-ready MERN stack application with AI features powered exclusively by Groq.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue) ![AI](https://img.shields.io/badge/AI-Groq%20only-orange) ![Payments](https://img.shields.io/badge/Payments-Razorpay-blue) ![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render-green)

---

## 🏗️ Architecture

```
Frontend (Next.js 14)  →  REST API  →  Auth Middleware  →  Service Layer  →  MongoDB Atlas
                                                                    ↓
                                               AI (Groq) · Razorpay · Cloudinary · Nodemailer
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account
- Groq API key (get free at console.groq.com)
- Razorpay sandbox account
- Cloudinary account

### 1. Clone & Install

```bash
git clone https://github.com/yourname/eventsphere
cd eventsphere

# Backend
cd backend && npm install
cp .env.example .env   # Fill in your values

# Frontend
cd ../frontend && npm install
cp .env.local.example .env.local
```

### 2. Configure Environment

**Backend `.env`** — minimum required:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_32_char_minimum_secret
JWT_REFRESH_SECRET=another_32_char_secret
GROQ_API_KEY=gsk_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_USER=...
SMTP_PASS=...
CLIENT_URL=http://localhost:3000
```

**Frontend `.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev
# → http://localhost:3000
```

---

## 📁 Project Structure

```
eventsphere/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Razorpay, Passport
│   │   ├── models/          # 12 Mongoose schemas
│   │   ├── controllers/     # 14 controller modules
│   │   ├── routes/          # 13 REST API routers
│   │   ├── middleware/       # Auth, RBAC, rate limiting, upload
│   │   ├── services/
│   │   │   ├── ai/          # Groq AI services (6 modules)
│   │   │   ├── email/       # Nodemailer + 5 HTML templates
│   │   │   ├── payment/     # Razorpay service
│   │   │   ├── qr/          # QR code generation
│   │   │   └── storage/     # Cloudinary service
│   │   └── utils/           # Helpers, logger, constants
│   └── server.js
└── frontend/
    └── src/
        ├── app/             # Next.js 14 App Router (pages)
        ├── components/      # 40+ reusable components
        ├── store/           # Redux Toolkit + RTK Query
        ├── hooks/           # 9 custom hooks
        └── lib/             # Axios, Razorpay, Socket.io
```

---

## 🔌 API Endpoints

| Module | Base Path | Methods |
|--------|-----------|---------|
| Auth | `/api/v1/auth` | POST register, login, logout, refresh |
| Events | `/api/v1/events` | Full CRUD + publish, analytics |
| Orders | `/api/v1/orders` | Create, list, refund, CSV export |
| Payments | `/api/v1/payments` | Initiate, verify, webhook, refund |
| Check-in | `/api/v1/checkin` | QR scan, manual, live stats |
| AI | `/api/v1/ai` | Description, search, schedule, chatbot, recommendations |
| Admin | `/api/v1/admin` | Users, events, stats, refunds |

---

## 🤖 AI Features (Groq Only)

All AI features use **Groq API exclusively** with models:
- `llama-3.3-70b-versatile` — Complex tasks (descriptions, recommendations)
- `mixtral-8x7b-32768` — Fast tasks (search, FAQs, chatbot quick replies)

| Feature | Endpoint | Model |
|---------|----------|-------|
| Event Description Generator | `POST /ai/description` | llama-3.3-70b |
| Natural Language Search | `POST /ai/search` | mixtral-8x7b |
| Smart Schedule Builder | `POST /ai/schedule` | llama-3.3-70b |
| AI Chatbot | `POST /ai/chat` | llama-3.3-70b |
| Recommendations | `GET /ai/recommendations` | mixtral-8x7b |
| FAQ Generator | `POST /ai/faqs` | mixtral-8x7b |

---

## 💳 Payment Flow

```
1. User selects tickets → Cart (Redux)
2. POST /orders → Backend creates order record
3. POST /payments/initiate → Razorpay order created
4. Razorpay Checkout modal opens (frontend)
5. User pays → Razorpay calls handler
6. POST /payments/verify → Signature verified
7. Tickets generated + QR codes created
8. Email confirmation sent
9. Socket.io event emitted (live check-in)
```

---

## 🚢 Deployment

### Backend → Render
```bash
# Push to GitHub, connect Render to repo
# Set environment variables in Render dashboard
# Uses render.yaml for config
```

### Frontend → Vercel
```bash
cd frontend
vercel --prod
# Set NEXT_PUBLIC_API_URL in Vercel dashboard
```

---

## 🧪 Testing Key Flows

### Test Auth
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test1234","role":"attendee"}'
```

### Test AI Search
```bash
curl -X POST http://localhost:5000/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query":"free tech workshops in Bangalore this weekend"}'
```

### Test AI Description
```bash
curl -X POST http://localhost:5000/api/v1/ai/description \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"React.js Workshop","bulletPoints":"Hands-on coding\nBeginners welcome\nFree lunch","audience":"Developers","tone":"Casual and fun","category":"Technology"}'
```

---

## 📊 Database Models

| Model | Key Fields |
|-------|-----------|
| User | name, email, role, interests, googleId |
| Event | title, category, ticketTypes[], agenda[], speakers[] |
| Ticket | ticketId, qrCode, isCheckedIn, attendeeInfo |
| Order | orderId, items[], totalAmount, status |
| Payment | razorpayOrderId, razorpayPaymentId, status |
| Review | rating, body, event, user (1 per attendee) |
| Notification | type, isRead, user, link |
| Wishlist | user, event (unique compound) |
| Coupon | code, discountType, validUntil, usedBy[] |
| CheckIn | event, ticket, method, checkedInAt |

---

## ⚙️ Features Checklist

- [x] JWT auth + refresh tokens + Google OAuth
- [x] Role-based access (Admin / Organiser / Attendee)
- [x] Multi-step event creation wizard
- [x] Multi-ticket type checkout
- [x] Razorpay payment integration
- [x] QR code generation per ticket
- [x] Live QR check-in with Socket.io
- [x] AI event description (Groq llama-3.3)
- [x] AI natural language search (Groq mixtral)
- [x] AI smart schedule builder (Groq)
- [x] AI hybrid recommendation engine
- [x] AI chatbot assistant
- [x] Organiser analytics dashboard
- [x] Admin platform dashboard
- [x] Email notifications (5 templates)
- [x] In-app notifications
- [x] Reviews & ratings system
- [x] Coupon/discount system
- [x] Wishlist
- [x] CSV attendee export
- [x] Dark/light mode
- [x] Fully responsive UI
- [x] Rate limiting + Helmet security
- [x] Render + Vercel deployment configs

---

## 🛡️ Security

- Helmet.js HTTP headers
- express-mongo-sanitize (NoSQL injection prevention)
- JWT with httpOnly cookie refresh tokens
- Rate limiting per route category (auth, AI, payments)
- Prompt injection prevention in all AI services
- Input validation via Joi (backend) + Zod (frontend)
- Role-based middleware on all protected routes

---

Built with ❤️ using MERN + Groq AI
