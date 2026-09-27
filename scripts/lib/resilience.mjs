const defaultSleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async (
  operation,
  {
    attempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 2_000,
    shouldRetry = () => true,
    sleep = defaultSleep,
  } = {},
) => {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('retry attempts must be >= 1');
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error, attempt)) throw error;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }
  throw lastError;
};

export class CircuitBreaker {
  constructor({
    failureThreshold = 3,
    resetTimeoutMs = 30_000,
    now = () => Date.now(),
  } = {}) {
    if (!Number.isInteger(failureThreshold) || failureThreshold < 1) {
      throw new Error('failureThreshold must be >= 1');
    }
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.now = now;
    this.failures = 0;
    this.openedAt = null;
    this.state = 'closed';
  }

  status() {
    if (
      this.state === 'open' &&
      this.openedAt !== null &&
      this.now() - this.openedAt >= this.resetTimeoutMs
    ) {
      this.state = 'half-open';
    }
    return {
      state: this.state,
      failures: this.failures,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
    };
  }

  beforeRequest() {
    const status = this.status();
    if (status.state === 'open') {
      const error = new Error('Circuit breaker is open');
      error.code = 'CIRCUIT_OPEN';
      throw error;
    }
  }

  success() {
    this.failures = 0;
    this.openedAt = null;
    this.state = 'closed';
  }

  failure() {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = this.now();
    }
  }

  async execute(operation) {
    this.beforeRequest();
    try {
      const value = await operation();
      this.success();
      return value;
    } catch (error) {
      this.failure();
      throw error;
    }
  }
}

export const fetchWithTimeout = async (
  fetchImpl,
  url,
  options = {},
  timeoutMs = 30_000,
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {...options, signal: controller.signal});
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeout = new Error(`Request timed out after ${timeoutMs}ms`);
      timeout.code = 'TIMEOUT';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
