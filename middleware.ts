import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const clerk = clerkMiddleware();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function clearClerkCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (!/^(__session|__client|__clerk)/.test(cookie.name)) continue;

    response.cookies.set({ name: cookie.name, value: "", path: "/", maxAge: 0 });
    response.cookies.set({
      name: cookie.name,
      value: "",
      path: "/",
      domain: "localhost",
      maxAge: 0,
      secure: true,
      sameSite: "none",
    });
  }
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    return await clerk(request, event);
  } catch (error) {
    const message = errorMessage(error);

    // Browser still has a session from Clerk keyless mode, signed by a different app.
    if (message.includes("jwk-kid-mismatch")) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("__clerk_handshake");
      const response = NextResponse.redirect(url);
      clearClerkCookies(request, response);
      return response;
    }

    // Publishable key is set, but the matching secret key is not in .env.local yet.
    if (message.includes("Missing secretKey")) {
      return NextResponse.next();
    }

    throw error;
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
