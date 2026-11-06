import {Suspense} from "react";
import {CheckoutClient} from "./checkout-client";
import {serverClient} from "@/lib/server";
import {redirect} from "next/navigation";

async function CheckoutContent({searchParams}: { searchParams: Promise<{ order?: string }>; }) {
    const supabase = await serverClient();
    const {
        data: {user},
        error,
    } = await supabase.auth.getUser();

    if ( error || !user || !user.email ) {
        redirect("/log-in");
    }

    const userid = user.id;
    const email = user.email;

    const { order } = await searchParams;
    const orderid = order || crypto.randomUUID();

    return <CheckoutClient orderId={orderid} email={email} userid={userid}/>;
}

export default function CheckoutPage({
                                         searchParams,
                                     }: {
    searchParams: Promise<{ order?: string }>
}) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[400px] items-center justify-center text-slate-400">
                    Loading checkout...
                </div>
            }
        >
            <CheckoutContent searchParams={searchParams}/>
        </Suspense>
    );
}
