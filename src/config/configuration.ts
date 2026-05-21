export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/google/callback',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  providers: {
    payment: process.env.PAYMENT_PROVIDER || 'stripe_mock',
    ai: process.env.AI_PROVIDER || 'mock',
    recommendation: process.env.RECOMMENDATION_ENGINE || 'sqlite',
  },
});
