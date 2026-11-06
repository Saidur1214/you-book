export default async function CheckoutReturn({
    searchParams,
}: {
    searchParams: Promise<{ payment?: string; status?: string; order?: string; email?: string, userid?: string}>;
}) {
    const { payment, status, order } = await searchParams;

    if (status === "succeeded") {
        return (
            <section>
                <h1>Thanks for your order</h1>
                <p>Payment {payment} is complete. A receipt is on its way to your email.</p>
                <a href="/dashboard">Go to dashboard</a>
            </section>
        );
    }

    if (status === "failed" || status === "canceled") {
        return (
            <section>
                <h1>Your payment did not go through</h1>
                <p>No money was taken. You can try again with another payment method.</p>
                <a href={`/checkout?order=${order ?? ""}`}>Back to checkout</a>
            </section>
        );
    }

    return (
        <section>
            <h1>Confirming your payment</h1>
            <p>Your payment is still processing. We'll email you once it's confirmed.</p>
        </section>
    );
}