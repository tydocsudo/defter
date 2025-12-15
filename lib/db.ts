// Database helper functions for Cloudflare D1
export interface Database {
  prepare(query: string): {
    bind(...values: any[]): {
      run(): Promise<{ success: boolean; meta: any }>
      all<T = any>(): Promise<{ results: T[]; success: boolean }>
      first<T = any>(column?: string): Promise<T | null>
    }
  }
}

export function getDb(): Database {
  // In development, we'll use a mock. In production, this will be bound to D1
  if (typeof window !== "undefined") {
    throw new Error("Database can only be accessed server-side")
  }

  // @ts-ignore - This will be provided by Cloudflare Workers
  return globalThis.DB as Database
}
