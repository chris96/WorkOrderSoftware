import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const openStaffPaths = ["/staff/bootstrap", "/staff/sign-in"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({
            request,
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

  if (!user && pathname.startsWith("/staff") && !isOpenStaffPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/staff/sign-in";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/staff", "/staff/:path*"],
};
