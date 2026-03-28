backend/
├── src/
│   ├── config/                    # Configuration
│   │   ├── env.ts                # Environment variables (20+ typed)
│   │   ├── flow.ts               # Flow blockchain integration (FCL wrapper)
│   │   └── logger.ts             # Winston logging setup
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts              # JWT authentication & verification
│   │   └── validation.ts        # Input validation & sanitization
│   ├── services/                # Business logic services
│   │   ├── ai.service.ts        # Hybrid AI (Claude, Gemini, OpenAI, Groq, Ollama, Llama)
│   │   ├── flow.service.ts      # Blockchain operations
│   │   ├── rule-engine.service.ts # Rule evaluation & intent parsing
│   │   └── transaction.service.ts # Transaction execution & tracking
│   ├── types/                   # TypeScript interfaces
│   │   └── index.ts            # All type definitions
│   └── app.ts                   # Express app with middleware & routes
├── prisma/
│   ├── schema.prisma            # Database schema (9 tables, all relationships)
│   └── migrations/
│       └── init/migration.sql   # PostgreSQL DDL
├── package.json                 # Dependencies (all AI providers included)
├── tsconfig.json               # Strict TypeScript config
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── SETUP.md                   # Setup guide with folder structure
└── README.md                  # Development guide

Total: ~1500 lines of code
- Config: 150 lines
- Middleware: 100 lines
- Services: 700 lines (including all 6 AI providers)
- Types: 50 lines
- App runtime: 100 lines
- Database schema: 300 lines

All structured for production, fully typed, maximum security
