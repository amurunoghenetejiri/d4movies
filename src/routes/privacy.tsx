import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — D4TECH Movies" }] }),
  component: () => (
    <LegalPage kicker="Legal" title="Privacy Policy" updated="July 2026">
      <p>Your privacy matters at D4TECH Movies. This policy describes what we collect, how we use it, and the controls you have.</p>
      <h2>Information we collect</h2>
      <p>Account information you provide, usage data such as playback progress, device information, and diagnostic logs used to improve service quality.</p>
      <h2>How we use information</h2>
      <p>To personalize recommendations, secure your account, deliver playback across devices, and improve our platform.</p>
      <h2>Sharing</h2>
      <p>We do not sell personal information. We share only with service providers strictly necessary to operate D4TECH Movies.</p>
      <h2>Your controls</h2>
      <p>Access, download, or delete your data at any time from your Settings page.</p>
      <h2>Contact</h2>
      <p>Questions? Email privacy@d4tech.movies.</p>
    </LegalPage>
  ),
});
