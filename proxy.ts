import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });

                    response = NextResponse.next({
                        request,
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    // const { data: { user } } = await supabase.auth.getUser();
    // const path = request.nextUrl.pathname;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const path = request.nextUrl.pathname;

    // Note: Add any route here that should NOT require login
    const publicRoutes = ["/log-in", "/sign-in"];
    const isPublicPath = publicRoutes.some((route) => path.startsWith(route));

    // Block unauthenticated access to ALL private routes
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/log-in";
        return NextResponse.redirect(url);
    }

    // Prevent logged-in users from accessing login/signup screens
    if (user && isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Images/assets (.svg, .png, .jpg, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};