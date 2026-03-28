# FlowMate Backend - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and fill in required values:

```bash
cp .env.example .env
```

Required environment variables you must provide:
- `DATABASE_URL` - PostgreSQL connection string (NeonDB)
- `FLOW_ACCOUNT_ADDRESS` - Your Flow testnet account
- `FLOW_ACCOUNT_PRIVATE_KEY` - Flow account private key
- `MAGIC_API_KEY` - Magic Link API key
- `MAGIC_SECRET_KEY` - Magic Link secret key
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `AI_PROVIDER` - Choose: `claude`, `gemini`, `openai`, `groq`, `ollama`, or `llama`
- `[PROVIDER]_API_KEY` - API key for chosen provider

### 3. Initialize Database

```bash
npx prisma migrate deploy
```

For development with fresh database:

```bash
npx prisma migrate reset
```

### 4. Deploy Smart Contracts

Before starting the backend, deploy smart contracts:

```bash
cd ../smartcontracts
flow project deploy --network testnet
```

Copy the contract addresses and add to `.env`:
- `FLOWMATE_AGENT_CONTRACT`
- `VAULT_MANAGER_CONTRACT`
- `SCHEDULED_TRANSACTIONS_CONTRACT`

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 6. Verify Setup

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "development",
  "uptime": 2.5
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.ts        # Environment variables
│   │   ├── flow.ts       # Flow blockchain integration
│   │   └── logger.ts     # Winston logging setup
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   └── validation.ts # Input validation & sanitization
│   ├── services/         # Business logic services
│   │   ├── ai.service.ts           # AI provider integration
│   │   ├── flow.service.ts         # Blockchain operations
│   │   ├── rule-engine.service.ts  # Rule evaluation
│   │   └── transaction.service.ts  # Transaction handling
│   ├── types/            # TypeScript interfaces
│   │   └── index.ts      # Type definitions
│   └── app.ts            # Express app setup
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Folder Structure Overview

### `/src/config`
- **env.ts**: Centralized environment configuration with type safety
- **flow.ts**: Flow Client Library wrapper for blockchain operations
- **logger.ts**: Winston logger configured for file + console output

### `/src/middleware`
- **auth.ts**: JWT token verification and user identification
- **validation.ts**: Request validation and input sanitization

### `/src/services`
- **ai.service.ts**: Hybrid AI provider (Claude, Gemini, OpenAI, Groq, Ollama, Llama)
- **flow.service.ts**: On-chain operations (register user, transfer vaults, create schedules)
- **rule-engine.service.ts**: Evaluate rules and parse natural language intents
- **transaction.service.ts**: Execute and track transactions

### `/src/types`
- **index.ts**: TypeScript interfaces for User, Vault, Rule, Transaction, etc.

## Available AI Providers

### Claude (Recommended)
```
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```
- Free $5 credits available
- Fastest, most accurate intent parsing

### Groq (Fast)
```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
```
- Free tier available
- Excellent for real-time responses

### Ollama (Local)
```
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```
- Completely free
- Runs locally (no API keys)

### Llama (Alternative Local)
```
AI_PROVIDER=llama
LLAMA_URL=http://localhost:8080
LLAMA_MODEL=llama
```
- Free local execution

### Gemini
```
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-pro
```

### OpenAI
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

## API Endpoints

### Health & Status
- `GET /health` - Server status
- `GET /api/v1` - API info
- `GET /api/v1/status` - System status

### Authentication (To be implemented)
- `POST /api/v1/auth/register` - User registration with Magic Link
- `POST /api/v1/auth/login` - Login via Magic Link
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Chat & Intent (To be implemented)
- `POST /api/v1/chat/message` - Send message to AI agent
- `GET /api/v1/chat/history` - Get chat history

### Rules & Automation (To be implemented)
- `POST /api/v1/rules/create` - Create financial rule
- `GET /api/v1/rules` - List user's rules
- `PUT /api/v1/rules/:id` - Update rule
- `DELETE /api/v1/rules/:id` - Delete rule

### Transactions (To be implemented)
- `POST /api/v1/transactions/send` - Send money
- `GET /api/v1/transactions` - Transaction history
- `GET /api/v1/transactions/:id` - Transaction details

### Vaults (To be implemented)
- `GET /api/v1/vaults` - Get all vaults
- `POST /api/v1/vaults/transfer` - Transfer between vaults

## Security Features

- ✅ Helmet.js for HTTP headers
- ✅ CORS configuration with whitelisted domains
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ JWT authentication
- ✅ Input validation & sanitization
- ✅ Secure password hashing with bcryptjs
- ✅ Environment variable management
- ✅ Comprehensive logging with Winston

## Database

### PostgreSQL (NeonDB)
Get free PostgreSQL at: https://console.neon.tech

Schema includes:
- Users with Flow blockchain integration
- Financial rules (save, send, dca, stake, etc.)
- Multi-vault system (available, savings, emergency, staking)
- Transaction audit trail
- Chat message history
- Notifications system
- WhitelistedRecipients for permission boundaries

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Database Connection Error
- Verify `DATABASE_URL` in `.env`
- Check NeonDB credentials
- Ensure database is reachable

### AI Provider Integration Issues
- Verify API keys are correct
- Check rate limits for chosen provider
- For local providers (Ollama, Llama), ensure service is running

## Development Workflow

```bash
# Watch TypeScript compilation
npm run build

# Run in development with auto-reload
npm run dev

# Database management
npx prisma studio        # GUI database explorer
npx prisma migrate dev   # Create new migration
npx prisma generate      # Generate Prisma Client
```

## Production Deployment

```bash
# Build TypeScript
npm run build

# Set NODE_ENV=production
export NODE_ENV=production

# Start production server
npm start
```

## Resources

- [Flow Blockchain Docs](https://docs.onflow.org)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Guide](https://expressjs.com)
- [JWT Guide](https://jwt.io)
- [Winston Logger](https://github.com/winstonjs/winston)
