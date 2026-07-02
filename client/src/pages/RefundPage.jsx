export default function RefundPage() {
  const sections = [
    {
      title: "Overview",
      body: "TrustBridge is a platform that connects newcomers with verified local service providers and community guides. This Refund & Cancellation Policy applies to all subscription plans and booking transactions made through the platform.",
    },
    {
      title: "Subscription Plans (Service Providers)",
      body: "Service provider subscriptions (Basic, Growth, Premium) are billed monthly. Subscriptions can be cancelled at any time; however, no refund will be issued for the current billing period. Your listing will remain active until the end of the paid period. In the event of a technical error or duplicate charge, a full refund will be issued within 5–7 business days.",
    },
    {
      title: "Service Bookings (Newcomers)",
      body: "Booking cancellations made more than 24 hours before the scheduled appointment are eligible for a full refund. Cancellations made within 24 hours of the scheduled appointment may be subject to a cancellation fee as specified by the individual service provider. Refunds for eligible cancellations will be processed to the original payment method within 5–7 business days.",
    },
    {
      title: "Non-Refundable Items",
      body: "The following are non-refundable: completed services, document verification fees, platform convenience fees, and subscriptions cancelled after the billing cycle has started.",
    },
    {
      title: "Dispute Resolution",
      body: "If you believe you have been incorrectly charged or are entitled to a refund not covered by this policy, please contact our support team at trustbridge.platform@gmail.com with your transaction ID and a description of the issue. We will review and respond within 3–5 business days.",
    },
    {
      title: "Fraudulent Transactions",
      body: "If you notice an unauthorised or fraudulent charge, contact us immediately at trustbridge.platform@gmail.com. We will investigate and process refunds for confirmed fraudulent transactions promptly.",
    },
    {
      title: "Contact for Refund Requests",
      body: "Email: trustbridge.platform@gmail.com · Owner: Nasani Ragamala · Business Location: Hanamkonda, Telangana, India · Support Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST",
    },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "32px 0" }}>
        <div className="wrap">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Refund &amp; Cancellation Policy</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Last updated: June 2026 · Owner: Nasani Ragamala</p>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 56, maxWidth: 760 }}>
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "32px 36px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75, marginBottom: 32 }}>
            TrustBridge ("we", "our", "us") is owned and operated by{" "}
            <strong style={{ color: "#0f172a" }}>Nasani Ragamala</strong>.
            This policy outlines the terms and conditions for refunds and cancellations on our platform.
          </p>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>{i + 1}. {s.title}</h2>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
