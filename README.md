# EventSphere — Enterprise Folder Structure
## AI-Powered Event Management & Ticketing Platform (MERN Stack)

---

## ROOT STRUCTURE

```
eventsphere/
├── backend/                    # Node.js + Express API server
├── frontend/                   # Next.js application
├── shared/                     # Shared types, constants, utilities
├── .github/                    # GitHub Actions CI/CD workflows
├── docker-compose.yml          # Local dev orchestration
├── .env.example                # Root env template
└── README.md
```

---

## BACKEND (Node.js + Express + MongoDB)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                        # MongoDB Atlas connection
│   │   ├── cloudinary.js               # Cloudinary SDK config
│   │   ├── razorpay.js                 # Razorpay SDK config
│   │   ├── nodemailer.js               # Nodemailer transporter
│   │   ├── redis.js                    # Redis client (optional caching)
│   │   └── env.js                      # Environment variable validator
│   │
│   ├── models/
│   │   ├── User.model.js               # User schema (Mongoose)
│   │   ├── Event.model.js              # Event schema
│   │   ├── Ticket.model.js             # Ticket schema
│   │   ├── Order.model.js              # Order schema
│   │   ├── Payment.model.js            # Payment schema
│   │   ├── Review.model.js             # Review & rating schema
│   │   ├── Notification.model.js       # Notification schema
│   │   ├── Wishlist.model.js           # Wishlist schema
│   │   ├── Coupon.model.js             # Discount coupon schema
│   │   ├── Session.model.js            # Event session schema
│   │   ├── CheckIn.model.js            # QR check-in record schema
│   │   └── RefreshToken.model.js       # JWT refresh token schema
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   ├── auth.controller.js      # Register, login, logout
│   │   │   ├── oauth.controller.js     # Google OAuth handler
│   │   │   └── password.controller.js  # Forgot/reset password
│   │   ├── user/
│   │   │   ├── user.controller.js      # Profile CRUD
│   │   │   └── avatar.controller.js    # Profile image upload
│   │   ├── event/
│   │   │   ├── event.controller.js     # Create, read, update, delete
│   │   │   ├── eventDraft.controller.js# Draft management
│   │   │   └── eventAnalytics.controller.js
│   │   ├── ticket/
│   │   │   ├── ticket.controller.js    # Ticket types CRUD
│   │   │   └── ticketAvailability.controller.js
│   │   ├── order/
│   │   │   ├── order.controller.js     # Order creation & management
│   │   │   └── orderExport.controller.js # CSV export
│   │   ├── payment/
│   │   │   ├── razorpay.controller.js  # Payment initiation
│   │   │   └── webhook.controller.js   # Razorpay webhook handler
│   │   ├── checkin/
│   │   │   └── checkin.controller.js   # QR scan & manual check-in
│   │   ├── review/
│   │   │   └── review.controller.js    # Reviews & ratings
│   │   ├── notification/
│   │   │   └── notification.controller.js
│   │   ├── wishlist/
│   │   │   └── wishlist.controller.js
│   │   ├── coupon/
│   │   │   └── coupon.controller.js
│   │   ├── admin/
│   │   │   ├── admin.controller.js     # User/event moderation
│   │   │   └── adminAnalytics.controller.js
│   │   └── ai/
│   │       ├── description.controller.js
│   │       ├── recommendation.controller.js
│   │       ├── search.controller.js
│   │       ├── scheduler.controller.js
│   │       └── chatbot.controller.js
│   │
│   ├── routes/
│   │   ├── index.js                    # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── event.routes.js
│   │   ├── ticket.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── checkin.routes.js
│   │   ├── review.routes.js
│   │   ├── notification.routes.js
│   │   ├── wishlist.routes.js
│   │   ├── coupon.routes.js
│   │   ├── admin.routes.js
│   │   └── ai.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT verification
│   │   ├── role.middleware.js          # Role-based access (RBAC)
│   │   ├── validate.middleware.js      # Joi/Zod request validation
│   │   ├── upload.middleware.js        # Multer file upload config
│   │   ├── rateLimiter.middleware.js   # Express rate limiter
│   │   ├── cache.middleware.js         # Response caching
│   │   ├── errorHandler.middleware.js  # Global error handler
│   │   └── logger.middleware.js        # Morgan + Winston logger
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── groq.service.js         # Groq SDK client & base caller
│   │   │   ├── recommendation.service.js # Hybrid recommendation engine
│   │   │   ├── scheduler.service.js    # Smart agenda builder
│   │   │   ├── eventDescription.service.js # AI description generator
│   │   │   ├── chatbot.service.js      # AI chatbot logic
│   │   │   ├── search.service.js       # NL → MongoDB filter converter
│   │   │   └── embeddings.service.js   # Text similarity (optional)
│   │   ├── email/
│   │   │   ├── email.service.js        # Nodemailer wrapper
│   │   │   └── templates/
│   │   │       ├── ticketConfirmation.html
│   │   │       ├── eventReminder.html
│   │   │       ├── passwordReset.html
│   │   │       ├── refundStatus.html
│   │   │       └── feedbackRequest.html
│   │   ├── payment/
│   │   │   ├── razorpay.service.js     # Payment order creation
│   │   │   └── payout.service.js       # Organiser payout simulation
│   │   ├── qr/
│   │   │   └── qr.service.js           # QR code generation (qrcode lib)
│   │   ├── storage/
│   │   │   └── cloudinary.service.js  # Image upload/delete
│   │   └── notification/
│   │       └── notification.service.js # In-app notification creator
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── event.validator.js
│   │   ├── ticket.validator.js
│   │   ├── order.validator.js
│   │   ├── review.validator.js
│   │   └── ai.validator.js             # Prompt injection prevention
│   │
│   ├── utils/
│   │   ├── apiResponse.js              # Standardized API response helper
│   │   ├── asyncHandler.js             # Async try/catch wrapper
│   │   ├── generateToken.js            # JWT signing & refresh
│   │   ├── pagination.js               # Cursor/page pagination helper
│   │   ├── csvExport.js                # CSV generation utility
│   │   ├── slugify.js                  # URL slug generator
│   │   └── constants.js               # App-wide constants
│   │
│   └── app.js                          # Express app setup (Helmet, CORS, body-parser)
│
├── server.js                           # Entry point
├── .env                                # Environment variables
├── .env.example                        # Template
├── package.json
├── package-lock.json
└── render.yaml                         # Render deployment config
```

---

## FRONTEND (Next.js + Tailwind CSS)

```
frontend/
├── public/
│   ├── images/                         # Static images
│   ├── icons/                          # App icons
│   └── fonts/                          # Custom fonts (if self-hosted)
│
├── src/
│   ├── app/                            # Next.js 14 App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.jsx
│   │   │   ├── register/page.jsx
│   │   │   ├── forgot-password/page.jsx
│   │   │   └── reset-password/[token]/page.jsx
│   │   ├── (main)/
│   │   │   ├── layout.jsx              # Main layout with Navbar/Footer
│   │   │   ├── page.jsx                # Landing page
│   │   │   ├── events/
│   │   │   │   ├── page.jsx            # Event discovery / browse
│   │   │   │   └── [slug]/page.jsx     # Event detail page
│   │   │   ├── checkout/
│   │   │   │   ├── page.jsx            # Checkout page
│   │   │   │   ├── success/page.jsx    # Payment success
│   │   │   │   └── cancel/page.jsx     # Payment cancelled
│   │   │   ├── my-tickets/page.jsx     # Attendee ticket history
│   │   │   ├── wishlist/page.jsx       # Saved events
│   │   │   └── profile/page.jsx        # User profile settings
│   │   ├── organiser/
│   │   │   ├── layout.jsx              # Organiser sidebar layout
│   │   │   ├── dashboard/page.jsx      # Revenue & analytics
│   │   │   ├── events/
│   │   │   │   ├── page.jsx            # Event list
│   │   │   │   ├── create/page.jsx     # Create event wizard
│   │   │   │   └── [id]/edit/page.jsx  # Edit event
│   │   │   ├── checkin/
│   │   │   │   └── [eventId]/page.jsx  # QR check-in dashboard
│   │   │   └── attendees/
│   │   │       └── [eventId]/page.jsx  # Attendee management
│   │   ├── admin/
│   │   │   ├── layout.jsx              # Admin layout
│   │   │   ├── dashboard/page.jsx      # Platform stats
│   │   │   ├── users/page.jsx          # User management
│   │   │   ├── events/page.jsx         # Event moderation
│   │   │   └── reports/page.jsx        # Reports & analytics
│   │   ├── api/                        # Next.js API routes (proxies only)
│   │   │   └── auth/[...nextauth]/route.js  # NextAuth adapter
│   │   ├── layout.jsx                  # Root layout
│   │   ├── loading.jsx                 # Global suspense fallback
│   │   ├── error.jsx                   # Error boundary
│   │   └── not-found.jsx               # 404 page
│   │
│   ├── components/
│   │   ├── ui/                         # Base design system
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MobileNav.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── GoogleOAuthButton.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── events/
│   │   │   ├── EventCard.jsx           # Grid card
│   │   │   ├── EventCarousel.jsx       # Featured events
│   │   │   ├── EventFilters.jsx        # Filter sidebar
│   │   │   ├── EventSearch.jsx         # AI-powered search bar
│   │   │   ├── EventBanner.jsx         # Detail page banner
│   │   │   ├── AgendaSection.jsx       # Agenda timeline
│   │   │   ├── SpeakerCard.jsx
│   │   │   ├── VenueMap.jsx            # Google Maps embed
│   │   │   ├── FAQAccordion.jsx
│   │   │   └── TicketSelector.jsx      # Ticket type picker
│   │   ├── organiser/
│   │   │   ├── EventForm/
│   │   │   │   ├── BasicInfoStep.jsx
│   │   │   │   ├── TicketsStep.jsx
│   │   │   │   ├── AgendaStep.jsx
│   │   │   │   ├── SpeakersStep.jsx
│   │   │   │   └── PublishStep.jsx
│   │   │   ├── AIDescriptionGenerator.jsx
│   │   │   ├── SmartScheduleBuilder.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   ├── TicketSalesChart.jsx
│   │   │   ├── AttendeeTable.jsx
│   │   │   └── CheckInDashboard.jsx
│   │   ├── tickets/
│   │   │   ├── TicketCard.jsx          # Ticket display with QR
│   │   │   ├── QRCodeDisplay.jsx       # QR code component
│   │   │   └── DownloadTicketButton.jsx
│   │   ├── checkout/
│   │   │   ├── OrderSummary.jsx
│   │   │   ├── CouponInput.jsx
│   │   │   ├── TaxCalculator.jsx
│   │   │   └── PaymentButton.jsx       # Razorpay trigger
│   │   ├── reviews/
│   │   │   ├── ReviewCard.jsx
│   │   │   ├── RatingStar.jsx
│   │   │   └── ReviewForm.jsx
│   │   ├── ai/
│   │   │   ├── ChatbotWidget.jsx       # Floating chatbot
│   │   │   └── AISearchInput.jsx       # Natural language search
│   │   ├── admin/
│   │   │   ├── UserTable.jsx
│   │   │   ├── EventModeration.jsx
│   │   │   └── PlatformStats.jsx
│   │   └── notifications/
│   │       ├── NotificationBell.jsx
│   │       └── NotificationList.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js                  # Auth state hook
│   │   ├── useEvents.js                # Event CRUD hooks
│   │   ├── useTickets.js               # Ticket hook
│   │   ├── useCart.js                  # Cart state
│   │   ├── useCheckIn.js               # Check-in logic
│   │   ├── useNotifications.js         # In-app notifications
│   │   ├── useAI.js                    # AI feature hooks
│   │   ├── useDebounce.js              # Input debounce
│   │   └── useLocalStorage.js         # Local storage hook
│   │
│   ├── store/                          # Redux Toolkit
│   │   ├── index.js                    # Store configuration
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── eventSlice.js
│   │   │   ├── cartSlice.js
│   │   │   ├── notificationSlice.js
│   │   │   └── uiSlice.js              # Dark mode, sidebar state
│   │   └── api/
│   │       ├── authApi.js              # RTK Query auth endpoints
│   │       ├── eventApi.js
│   │       ├── ticketApi.js
│   │       ├── orderApi.js
│   │       ├── paymentApi.js
│   │       └── aiApi.js
│   │
│   ├── lib/
│   │   ├── axios.js                    # Axios instance with interceptors
│   │   ├── razorpay.js                 # Razorpay checkout loader
│   │   └── socket.js                   # Socket.io client (check-in live)
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── formatCurrency.js
│   │   ├── validateForms.js            # Zod schemas
│   │   └── constants.js
│   │
│   └── styles/
│       ├── globals.css                 # Tailwind base + CSS variables
│       └── animations.css              # Framer Motion + custom CSS
│
├── next.config.js                      # Next.js config (image domains, etc.)
├── tailwind.config.js                  # Tailwind theme extension
├── postcss.config.js
├── .env.local                          # Frontend environment variables
├── .env.local.example
├── vercel.json                         # Vercel deployment config
└── package.json
```

---

## SHARED (Shared Utilities)

```
shared/
├── constants/
│   ├── roles.js                        # USER_ROLES enum
│   ├── eventCategories.js              # Event category list
│   ├── ticketTypes.js                  # Ticket type enum
│   └── paymentStatus.js                # Payment status enum
├── types/
│   └── index.d.ts                      # TypeScript interfaces (optional)
└── validators/
    └── shared.validator.js             # Zod schemas usable on both sides
```

---

## CI/CD & DEPLOYMENT

```
.github/
└── workflows/
    ├── backend.yml                     # Test + deploy backend to Render
    └── frontend.yml                    # Test + deploy frontend to Vercel

docker-compose.yml                      # MongoDB + Redis + backend dev setup
```

---

## ENVIRONMENT VARIABLES

### Backend (.env)
```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Groq AI
GROQ_API_KEY=

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@eventsphere.com

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## API VERSIONING

All backend routes are prefixed:
```
/api/v1/auth
/api/v1/users
/api/v1/events
/api/v1/tickets
/api/v1/orders
/api/v1/payments
/api/v1/checkin
/api/v1/reviews
/api/v1/notifications
/api/v1/wishlist
/api/v1/coupons
/api/v1/admin
/api/v1/ai
```

---

## NEXT STEPS

**STEP 2**: Backend initialization (Express app, DB connection, middleware setup)
**STEP 3**: Frontend initialization (Next.js, Tailwind, Redux, Axios)
**STEP 4**: Authentication backend (JWT, bcrypt, refresh tokens, Google OAuth)
**STEP 5**: Authentication frontend (login/register forms, protected routes)
**STEP 6**: Database schemas (all 12 Mongoose models)
