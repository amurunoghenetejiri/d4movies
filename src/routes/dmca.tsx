import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/dmca")({
  head: () => ({ meta: [{ title: "DMCA Policy — D4TECH Movies" }] }),
  component: () => (
    <LegalPage kicker="Legal" title="DMCA Policy" updated="July 2026">
      <p>D4TECH Movies respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA).</p>
      <h2>Notice of infringement</h2>
      <p>To submit a notice, email dmca@d4tech.movies with a description of the copyrighted work, its location on our service, your contact information and a good-faith statement.</p>
      <h2>Counter-notice</h2>
      <p>If you believe content was removed by mistake, you may submit a counter-notice with the required information.</p>
      <h2>Repeat infringers</h2>
      <p>Accounts with repeated infringements will be terminated.</p>
    </LegalPage>
  ),
});
