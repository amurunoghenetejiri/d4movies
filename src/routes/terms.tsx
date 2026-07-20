import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — D4TECH Movies" }] }),
  component: () => (
    <LegalPage kicker="Legal" title="Terms of Service" updated="July 2026">
      <p>These terms govern your use of D4TECH Movies. By accessing the platform, you agree to these terms.</p>
      <h2>Use of service</h2>
      <p>You agree to use D4TECH Movies for lawful purposes and to respect the rights of content owners and other users.</p>
      <h2>Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
      <h2>Content</h2>
      <p>All titles, logos, and streaming assets belong to their respective owners. D4TECH aggregates licensed content.</p>
      <h2>Termination</h2>
      <p>We may suspend accounts that violate these terms.</p>
      <h2>Contact</h2>
      <p>Questions? Email legal@d4tech.movies.</p>
    </LegalPage>
  ),
});
