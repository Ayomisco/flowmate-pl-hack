# FlowMate Backend

Express.js + TypeScript backend for FlowMate autonomous financial operating system.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.ts       # Environment variables (typed)
│   │   ├── flow.ts      # Flow blockchain integration
│   │   └── logger.ts    # Winston logger setup
│   ├── middleware/      # Express middleware
│   │   ├── cors.ts      # CORS configuration
│   │   ├── errorHandler.ts # Global error handling
│   │   └── rateLimiter.ts  # Rate limiting
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── app.ts           # Main Express app
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Environment template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md            # This file
```

## Setup

### 1. Install Node.js dependencies

```bash
npm install
```

### 2. Configure environment

```bash
# Copy environment template
cp .env.example .env

# Update .env with your values:
# - DATABASE_URL (NeonDB PostgreSQL)
# - FLOW_ACCOUNT_ADDRESS & FLOW_ACCOUNT_PRIVATE_KEY
# - MAGIC_API_KEY & MAGIC_SECRET_KEY
# - AI_PROVIDER & corresponding API key
# - JWT_SECRET
```

### 3. Initialize database

```bash
# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### 5. Verify setup

```bash
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"...","environment":"development"}
```

## Available Scripts

- `npm run dev` - Start development server with watch
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run db:migrate` - Create/run migrations
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run prisma:studio` - Open Prisma Studio (visual DB editor)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest

## API Routes (To be implemented)

### Authentication
- POST `/api/v1/auth/signup` - Register with Magic Link
- POST `/api/v1/auth/login` - Login with Magic Link
- POST `/api/v1/auth/logout` - Logout

### Chat & AI
- POST `/api/v1/chat` - Send message to AI agent
- GET `/api/v1/chat/history` - Get conversation history

### Rules & Automation
- GET `/api/v1/rules` - List all rules
- POST `/api/v1/rules` - Create new rule
- PUT `/api/v1/rules/:id` - Update rule
- DELETE `/api/v1/rules/:id` - Delete rule

### Transactions
- GET `/api/v1/transactions` - List transactions
- GET `/api/v1/transactions/:id` - Get transaction details
- POST `/api/v1/transactions/send` - Execute transfer

### Vaults
- GET `/api/v1/vaults` - List user vaults
- GET `/api/v1/vaults/:type` - Get specific vault
- POST `/api/v1/vaults/:type/transfer` - Transfer between vaults

## Environment Variables

See `.env.example` for complete list. Key variables:

```
# Database
DATABASE_URL=postgresql://...

# Flow Blockchain
FLOW_ACCOUNT_ADDRESS=0x...
FLOW_ACCOUNT_PRIVATE_KEY=...

# Magic Link Auth
MAGIC_API_KEY=...
MAGIC_SECRET_KEY=...

# AI Provider (choose one)
AI_PROVIDER=groq  # or: claude, gemini, openai, ollama
GROQ_API_KEY=...
```

## Security

- ✅ Helmet for HTTP headers
- ✅ CORS configured for frontend URLs
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Input validation
- ✅ JWT authentication
- ✅ Environment-based secrets

## Logging

Logs written to `logs/app.log` (Winston)
- Console output in development
- File + Console in production

## Database Schema

13 tables with proper relationships:
- User, Rule, ScheduledTransaction
- Transaction, Vault, Goal
- ChatMessage, Notification
- WhitelistedRecipient, ExecutionRecord

All with indexes and foreign keys (CASCADE delete).

## Testing

```bash
npm run test
```

Uses Vitest for fast unit tests.

## Deployment

1. Build: `npm run build`
2. Deploy to your hosting (Vercel, Railway, Render, etc)
3. Set production environment variables
4. Run: `npm start`

## Troubleshooting

**npm not found:**
- Install Node.js: https://nodejs.org

**Database connection error:**
- Verify DATABASE_URL in .env
- Check NeonDB is running

**Type errors:**
- Run `npm run build` to compile TypeScript

## Contributing

Follow TypeScript strict mode. See tsconfig.json.
