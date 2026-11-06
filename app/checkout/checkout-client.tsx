"use client";

import {Checkout, CheckoutElement, WhopElements} from "@whop/elements-react";
import {loadWhop} from "@whop/elements";

export function CheckoutClient({
                                   orderId,
                                   email,
                                   userid
                               }: {
    orderId: string,
    email: string,
    userid: string
}) {
    return (
        <main style={{maxWidth: 480, margin: "0 auto", padding: 24}}>
            <WhopElements elements={loadWhop()} environment="sandbox">
                <Checkout
                    plan="plan_E7y5DV413eUzB" // your Whop plan ID
                    metadata={{order_id: orderId, userid}}
                    returnUrl={`${process.env.NEXT_PUBLIC_DEVELOPMENT_APP_URL}/checkout/return?order=${orderId}`}
                    onComplete={(completion) => {
                        if (completion.result === "payment") {
                            // Analytics / ad pixels only. Do NOT fulfill here.
                            console.log("Checkout completed", completion.paymentId);
                        }
                    }}
                >
                    <CheckoutElement buyerEmail={email} lockBuyerEmail={true}/>
                </Checkout>
            </WhopElements>
        </main>
    );
}
