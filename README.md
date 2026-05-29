# JBE Commerce — Backend API

Express.js + MongoDB REST API powering the JBE Commerce e-commerce platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT (httpOnly cookies) |
| Password security | AES-256-CBC encryption |
| Email | SendGrid |
| Payments | Razorpay |
| Rate limiting | express-rate-limit |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` from the example
```bash
cp .env.example .env
# then fill in your values
```

### 3. Run the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Run tests
```bash
npm test
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `DB_USER` | MongoDB Atlas username | `sjbrs25` |
| `DB_PASSWORD` | MongoDB Atlas password | `Test1234` |
| `DB_CLUSTER` | MongoDB cluster hostname | `atlascluster.iw56sdc.mongodb.net` |
| `SECRET_KEY` | JWT signing secret | `any-random-string` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxx` |
| `SENDER_EMAIL` | From address for emails | `info@example.com` |
| `RAZORPAY_KEY_ID` | Razorpay public key | `rzp_test_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | `xxx` |
| `WEBHOOK_SECRET` | Razorpay webhook secret | `xxx` |
| `ALLOWED_ORIGIN` | Frontend URL for CORS | `https://your-app.netlify.app` |

---

## API Endpoints

### Auth  `/api/auth`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/signup` | No | Register a new user |
| POST | `/login` | No | Login (rate-limited) |
| PATCH | `/forgetpassword` | No | Send OTP to email (rate-limited) |
| PATCH | `/resetPassword/:userId` | No | Reset password with OTP |
| GET | `/logout` | No | Clear JWT cookie |
| POST | `/logout` | No | Clear JWT cookie (Navbar) |

### Products  `/api/product`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | No | Get all products |
| GET | `/categories` | No | Get all category names |
| GET | `/:productId` | No | Get single product |
| POST | `/` | Admin | Create product |
| PATCH | `/:productId` | Admin | Update product |
| DELETE | `/:productId` | Admin | Delete product |

### Cart & Bookings  `/api/booking`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/:productId` | Yes | Initiate Razorpay order |
| POST | `/verify` | Yes | Verify webhook payment |
| GET | `/` | Yes | Get all bookings |

### Reviews  `/api/review`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/:productId` | Yes | Add a review + rating |
| GET | `/:productId` | No | Get paginated reviews |

**Pagination**: `?page=1&limit=10`

### Users  `/api/user`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Admin | Get all users |
| GET | `/:userId` | Yes | Get user by ID |
| POST | `/` | Admin | Create user |
| DELETE | `/:userId` | Admin | Delete user |

---

## Security Features

- **JWT in httpOnly cookies** — tokens are not accessible by JavaScript
- **AES-256-CBC password encryption** — passwords encrypted before storing
- **Rate limiting** — login and forgot-password routes limited to 2 req/2 min per IP
- **XSS sanitization** — user inputs sanitized via `xss` package
- **CORS** — only the configured `ALLOWED_ORIGIN` can call the API with cookies

---

## Deployment (Render)

1. Push to GitHub
2. Create a new Web Service on Render, connect the repo
3. Set all environment variables in Render dashboard
4. Build command: `npm install`
5. Start command: `npm start`

---

## Running Tests Locally

Tests connect to the real MongoDB Atlas database.

```bash
npm test                          # run all tests
npx jest __tests__/auth.test.js   # run specific suite
npx jest --forceExit              # force quit after tests
```
