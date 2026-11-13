"use client";

import {Checkout, CheckoutElement, WhopElements} from "@whop/elements-react";
import {loadWhop} from "@whop/elements";

export function CheckoutClient({ userid, email }: { userid: string, email:string }) {
    return (
        <main style={{maxWidth: 1070, margin: "0 auto", padding: 20, width: "90%"}}>
            <WhopElements elements={loadWhop()} environment="sandbox">
                <Checkout
                    plan="plan_E7y5DV413eUzB" // your Whop plan ID
                    metadata={{userid}}
                    returnUrl={`${process.env.NEXT_PUBLIC_DEVELOPMENT_APP_URL}/checkout/return`}
                    onComplete={(completion) => {
                        if (completion.result === "payment") {
                            // Analytics / ad pixels only. Do NOT fulfill here.
                            console.log("Checkout completed", completion.paymentId); //what is a payment id claude? how does it look like?
                        }
                    }}
                >
                    <CheckoutElement buyerEmail={email} lockBuyerEmail={true}/>
                </Checkout>
            </WhopElements>
        </main>
    );
}
