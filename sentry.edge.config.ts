import * as Sentry from "@sentry/nextjs"
import { baseSentryOptions, isSentryEnabled } from "@/lib/observability/sentry-options"

if (isSentryEnabled()) {
  Sentry.init(baseSentryOptions())
}
