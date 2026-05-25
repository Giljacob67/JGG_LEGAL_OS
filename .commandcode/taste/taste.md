# Communication
- Communicate in Portuguese (Brazilian) for all interactions. Confidence: 0.90
- Prefer direct action over extensive planning when user signals "prossiga" or similar. Confidence: 0.85

# Security
- Prioritize security fixes: CORS hardening, env file protection, timing-safe comparisons, input validation with Zod. Confidence: 0.90
- Never commit .env files to git; use .env.example templates instead. Confidence: 0.95
- Use timingSafeEqual for API key comparisons to prevent timing attacks. Confidence: 0.90

# Code Quality
- Replace console.log/error with structured JSON logging for server-side code. Confidence: 0.80
- Create reusable middleware (withAuth, withErrorHandler) to reduce code duplication in route handlers. Confidence: 0.75
- Add security headers (HSTS, X-Frame-Options, X-Content-Type-Options) to all web applications. Confidence: 0.85

# Tech Stack
- Use Next.js App Router with TypeScript for frontend applications. Confidence: 0.90
- Use FastAPI with Pydantic settings for Python backend services. Confidence: 0.85
- Use Redis for distributed rate limiting instead of in-memory Maps. Confidence: 0.80
- Use Zod for runtime validation of all API inputs. Confidence: 0.85

# Workflow
- Fix critical security issues before code style or refactoring tasks. Confidence: 0.90
- Batch related changes and execute in parallel when possible. Confidence: 0.75
