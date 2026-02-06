import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set to 1.0 to capture 100% of transactions for tracing.
    tracesSampleRate: 1.0,
});
