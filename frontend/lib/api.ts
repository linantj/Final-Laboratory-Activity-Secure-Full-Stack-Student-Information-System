export type StudentRecord = Record<string, unknown>;

export type StudentResponse = {
  source: "cloud" | "physical";
  count: number;
  students: StudentRecord[];
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  let body: {
    message?: string;
    errors?: Record<string, string[]>;
  } = {};

  try {
    body = (await response.json()) as typeof body;
  } catch {
    if (response.ok) {
      throw new ApiError("The server returned an invalid response.", 502);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      body.message ?? "The request could not be completed.",
      response.status,
      body.errors,
    );
  }

  return body as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}
