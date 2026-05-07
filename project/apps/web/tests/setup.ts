// Configuração global de testes
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/jgg_test";
process.env.CLERK_WEBHOOK_SECRET = "test_secret";
process.env.DATAJUD_API_KEY = "test_api_key";
process.env.OPENAI_API_KEY = "test_openai_key";
process.env.INTEGRATION_ENCRYPTION_KEY = "test-32-char-encryption-key!!";
