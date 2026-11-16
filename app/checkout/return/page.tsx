export default async function CheckoutReturn({
                                                 searchParams,
                                             }: {
    searchParams: Promise<{ payment?: string; status?: string; email?: string, userid?: string }>;
}) {
    const {payment, status, userid, email} = await searchParams;

    if (status === "succeeded") {
        console.log("succeed from return page")
        return (
            <section>
                <h1>Thanks for your order</h1>
                <p>Payment {payment} is complete. A receipt is on its way to your email.</p>
                <a href="/dashboard">Go to dashboard</a>
            </section>
        );
    }

    if (status === "failed" || status === "canceled") {
        console.log("failed from return page")
        return (
            <section>
                <h1>Your payment did not go through</h1>
                <p>No money was taken. You can try again with another payment method.
                    Email: {email} UserId: {userid}</p>
                <a href="/checkout">Back to checkout</a>
            </section>
        );
    }

    console.log("From return page")
    return (
        <section>
            <h1>Confirming your payment</h1>
            <p>Your payment is still processing. We&apos;ll email you once it&apos;s confirmed.</p>
        </section>
    );
}