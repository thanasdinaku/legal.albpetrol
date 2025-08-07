/**
 * API Optimization utilities to reduce rate limiting issues
 */

// Debounce function to limit API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function to limit API call frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request queue to manage concurrent API calls
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 3; // Limit concurrent requests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    const nextRequest = this.queue.shift();
    if (nextRequest) {
      nextRequest();
    }
  }
}

export const requestQueue = new RequestQueue();

// Enhanced fetch with rate limiting protection
export async function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return requestQueue.add(async () => {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      // Rate limited - wait and retry
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetch(url, options);
    }
    
    return response;
  });
}

// Cache for frequently accessed data
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();