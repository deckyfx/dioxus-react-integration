/**
 * TypeScript definitions for Dioxus IPC Bridge
 *
 * These types provide type-safe access to the Dioxus bridge from React/TypeScript applications.
 */

/**
 * HTTP-like request options for IPC calls
 */
export interface IpcRequestOptions {
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method?: string;

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body (will be JSON-serialized) */
  body?: any;
}

/**
 * IPC response from Rust
 */
export interface IpcResponse<T = any> {
  /** HTTP status code (200, 404, 500, etc.) */
  status: number;

  /** Response headers */
  headers: Record<string, string>;

  /** Response body (JSON) */
  body: T;
}

/**
 * Streaming progress update
 */
export interface StreamingProgress {
  /** Progress percentage (0-100) */
  percent: number;

  /** Optional progress message */
  message?: string;

  /** Current item being processed */
  current?: number;

  /** Total items to process */
  total?: number;

  /** Estimated time remaining in seconds */
  eta?: number;
}

/**
 * Streaming chunk data
 */
export interface StreamingChunk {
  /** Chunk index */
  index: number;

  /** Chunk data (base64-encoded or plain text) */
  data: string;

  /** Total number of chunks */
  total_chunks?: number;
}

/**
 * Streaming task response
 */
export interface StreamingTaskResponse {
  /** Unique task ID for tracking */
  task_id: string;

  /** Status message */
  message: string;
}

/**
 * Core Dioxus Bridge interface
 */
export interface DioxusBridge {
  /**
   * Send an HTTP-like IPC request to Rust
   *
   * @param url - IPC URL (e.g., "ipc://calculator/fibonacci?number=10")
   * @param options - Request options (method, headers, body)
   * @returns Promise resolving to IPC response
   *
   * @example
   * ```typescript
   * const response = await window.dioxusBridge.fetch('ipc://user/123', {
   *   method: 'GET'
   * });
   * console.log(response.body);
   * ```
   */
  fetch<T = any>(url: string, options?: IpcRequestOptions): Promise<IpcResponse<T>>;

  /**
   * Receive events emitted from Rust
   *
   * @param channel - Event channel name
   * @param data - Event data
   */
  rustEmit(channel: string, data: any): void;

  /**
   * Internal callback storage (used by bridge implementation)
   */
  callbacks: Map<number, {
    resolve: (value: IpcResponse) => void;
    reject: (reason: Error) => void;
  }>;

  /**
   * Low-level IPC interface
   */
  ipc: {
    /** Send raw data to Rust */
    send(data: any): void;

    /** Check if IPCBridge is available */
    hasIPCBridge(): boolean;
  };

  /**
   * Low-level send wrapper
   */
  send(data: any): void;

  /**
   * IPCBridge for event handling (if using RxJS-based event system)
   */
  IPCBridge?: any;
}

/**
 * Global window interface extension
 */
declare global {
  interface Window {
    /**
     * Dioxus IPC Bridge instance
     *
     * Available after bridge initialization. Use this to communicate
     * with the Rust backend from your React application.
     *
     * @example
     * ```typescript
     * // Simple GET request
     * const response = await window.dioxusBridge.fetch('ipc://hello/world');
     *
     * // POST request with body
     * const response = await window.dioxusBridge.fetch('ipc://form/submit', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: { name: 'John', email: 'john@example.com' }
     * });
     * ```
     */
    dioxusBridge: DioxusBridge;
  }
}

/**
 * Helper: Type-safe IPC request function
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const user = await ipcRequest<User>('ipc://user/123');
 * console.log(user.name);
 * ```
 */
export async function ipcRequest<T = any>(
  url: string,
  options?: IpcRequestOptions
): Promise<T> {
  const response = await window.dioxusBridge.fetch<T>(url, options);

  if (response.status >= 400) {
    throw new Error(`IPC request failed: ${response.status}`);
  }

  return response.body;
}

/**
 * Helper: Subscribe to streaming task events
 *
 * @param taskId - Task ID from streaming task response
 * @param handlers - Event handlers for progress, chunks, completion, and errors
 *
 * @example
 * ```typescript
 * const response = await ipcRequest<StreamingTaskResponse>('ipc://process/large-file');
 *
 * subscribeToStreamingTask(response.task_id, {
 *   onProgress: (progress) => {
 *     console.log(`Progress: ${progress.percent}%`);
 *   },
 *   onChunk: (chunk) => {
 *     console.log(`Received chunk ${chunk.index}`);
 *   },
 *   onComplete: (result) => {
 *     console.log('Task completed!', result);
 *   },
 *   onError: (error) => {
 *     console.error('Task failed:', error);
 *   }
 * });
 * ```
 */
export function subscribeToStreamingTask(
  taskId: string,
  handlers: {
    onProgress?: (progress: StreamingProgress) => void;
    onChunk?: (chunk: StreamingChunk) => void;
    onComplete?: (result: any) => void;
    onError?: (error: { message: string }) => void;
  }
): void {
  if (!window.dioxusBridge?.IPCBridge) {
    console.warn('IPCBridge not available for event subscriptions');
    return;
  }

  const { IPCBridge } = window.dioxusBridge;

  if (handlers.onProgress) {
    IPCBridge.on(`task:${taskId}:progress`, handlers.onProgress);
  }

  if (handlers.onChunk) {
    IPCBridge.on(`task:${taskId}:chunk`, handlers.onChunk);
  }

  if (handlers.onComplete) {
    IPCBridge.on(`task:${taskId}:complete`, handlers.onComplete);
  }

  if (handlers.onError) {
    IPCBridge.on(`task:${taskId}:error`, handlers.onError);
  }
}

// Types are already exported above, no need to re-export
