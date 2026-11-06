import { NextRequest, NextResponse } from "next/server";

const sessionCookie = "student_session";
const sessionDurationSeconds = 8 * 60 * 60;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionDurationSeconds,
  };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function handleRequest(
  request: NextRequest,
  { params }: RouteContext,
  method: "GET" | "POST",
) {
  const { path } = await params;
  const route = path.join("/");
  const allowedRoutes: Record<string, string[]> = {
    "auth/register": ["POST"],
    "auth/login": ["POST"],
    "auth/user": ["GET"],
    "auth/logout": ["POST"],
    students: ["GET"],
  };

  if (!allowedRoutes[route]?.includes(method)) {
    return errorResponse("Not found.", 404);
  }

  const isAuthenticationRequest =
    route === "auth/login" || route === "auth/register";
  const token = request.cookies.get(sessionCookie)?.value;

  if (!isAuthenticationRequest && !token) {
    return errorResponse("Unauthenticated.", 401);
  }

  const baseUrl = process.env.LARAVEL_API_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    const response = errorResponse("The Laravel API URL is not configured.", 503);

    if (route === "auth/logout") {
      response.cookies.set(sessionCookie, "", {
        ...cookieOptions(),
        maxAge: 0,
      });
    }

    return response;
  }

  const upstreamUrl = new URL(`${baseUrl}/api/${route}`);

  if (route === "students") {
    const source = request.nextUrl.searchParams.get("source");

    if (source !== "cloud" && source !== "physical") {
      return errorResponse("Select a valid database source.", 422);
    }

    upstreamUrl.searchParams.set("source", source);
  }

  let upstream: Response;

  try {
    upstream = await fetch(upstreamUrl, {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(method === "POST" ? { body: await request.text() } : {}),
    });
  } catch {
    const response = errorResponse("The Laravel API could not be reached.", 502);

    if (route === "auth/logout") {
      response.cookies.set(sessionCookie, "", {
        ...cookieOptions(),
        maxAge: 0,
      });
    }

    return response;
  }

  const responseBody = await upstream.text();

  if (isAuthenticationRequest && upstream.ok) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(responseBody) as unknown;
    } catch {
      return errorResponse("The Laravel API returned an invalid response.", 502);
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return errorResponse("The Laravel API returned an invalid response.", 502);
    }

    const payload = parsed as Record<string, unknown>;
    const tokenValue = payload.token;

    if (typeof tokenValue !== "string" || tokenValue.length === 0) {
      return errorResponse("The Laravel API returned an invalid response.", 502);
    }

    delete payload.token;
    const safeResponse = NextResponse.json(payload, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
    safeResponse.cookies.set(sessionCookie, tokenValue, cookieOptions());

    return safeResponse;
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers,
  });

  if (route === "auth/logout" || (!isAuthenticationRequest && upstream.status === 401)) {
    response.cookies.set(sessionCookie, "", { ...cookieOptions(), maxAge: 0 });
  }

  return response;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context, "POST");
}
