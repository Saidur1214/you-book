import {Suspense} from "react";
import {CheckoutClient} from "./checkout-client";
import {serverClient} from "@/lib/server";
import {redirect} from "next/navigation";

async function CheckoutContent() {
    const supabase = await serverClient();
    const {
        data: {user},
        error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
        redirect("/log-in");
    }

    const userid = user.id;
    const email = user.email;


    return <CheckoutClient userid={userid} email={email}/>;
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-100 items-center justify-center text-slate-400">
                    Loading checkout...
                </div>
            }
        >
            <CheckoutContent/>
        </Suspense>
    );
}
