import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { STAFF_USER_ID_HEADER } from "@/lib/supabase/request-auth";

const openStaffPaths = ["/staff/bootstrap", "/staff/sign-in"];

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  let pendingCookies: Array<{
    name: string;
    options: Parameters<typeof response.cookies.set>[2];
    value: string;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isOpenStaffPath = openStaffPaths.some((path) => pathname.startsWith(path));

  if (user?.id) {
    requestHeaders.set(STAFF_USER_ID_HEADER, user.id);
  } else {
    requestHeaders.delete(STAFF_USER_ID_HEADER);
  }

  if (!user && pathname.startsWith("/staff") && !isOpenStaffPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/staff/sign-in";
    return NextResponse.redirect(redirectUrl);
  }

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  pendingCookies.forEach(({ name, value, options }) => {
    finalResponse.cookies.set(name, value, options);
  });

  return finalResponse;
}

export const config = {
  matcher: ["/staff", "/staff/:path*"],
};
