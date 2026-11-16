import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

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
                    cookiesToSet.forEach(({name, value}) => {
                        request.cookies.set(name, value);
                    });

                    response = NextResponse.next({
                        request,
                    });

                    cookiesToSet.forEach(({name, value, options}) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    const {
        data: {user},
    } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    const publicRoutes = ["/log-in", "/sign-in", "/api/webhooks"];
    const isPublicPath = publicRoutes.some((route) => path.startsWith(route));

    const checkoutRoute = ["/checkout"];
    const InCheckoutRoute = checkoutRoute.some((route) => path.startsWith(route));

    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/sign-in";
        return NextResponse.redirect(url);
    }

    if (user) {
        const {data: profile} = await supabase.from("profile").select("status").eq("id", user.id).maybeSingle()

        const activeUser = profile?.status === "active"


        if (!activeUser && !InCheckoutRoute) {
            const url = request.nextUrl.clone();
            url.pathname = "/checkout"
            return NextResponse.redirect(url);
        }

        if (activeUser && (isPublicPath || (InCheckoutRoute && !path.startsWith("/checkout/return")))) {
            const url = request.nextUrl.clone();
            url.pathname = "/"
            return NextResponse.redirect(url);
        }

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
