import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Privacy Policy — IoTFlow",
  description:
    "How IoTFlow collects, uses, stores and protects your data across the web app, mobile app and connected devices.",
};

const LAST_UPDATED = "16 June 2026";
const CONTACT_EMAIL = "support@tertiaryinfotech.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo href="/" size="sm" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            This Privacy Policy explains how Tertiary Infotech Pte Ltd (&ldquo;IoTFlow&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;) collects, uses, discloses and
            safeguards your information when you use the IoTFlow platform — including our website at{" "}
            <span className="font-medium text-foreground">iot.tertiaryinfotech.com</span>, the IoTFlow
            iOS mobile application, and the APIs and connected-device services that power them
            (together, the &ldquo;Service&rdquo;).
          </p>
          <p>
            By using the Service you agree to the collection and use of information in accordance with
            this policy. If you do not agree, please do not use the Service.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <span className="font-medium text-foreground">Account information.</span> Your name,
              email address and password (stored only as a salted hash) when you register or sign in.
            </li>
            <li>
              <span className="font-medium text-foreground">Device &amp; telemetry data.</span> Data
              you choose to send from your IoT devices — device names, types, locations, protocol
              details, sensor readings, metrics and the timestamps of those readings.
            </li>
            <li>
              <span className="font-medium text-foreground">Configuration data.</span> Projects,
              dashboards, alert rules, API keys and other settings you create within the Service.
            </li>
            <li>
              <span className="font-medium text-foreground">Technical data.</span> IP address,
              browser/app version, device model and operating system, and diagnostic logs generated
              when you interact with the Service.
            </li>
          </ul>
          <p>
            We do <span className="font-medium text-foreground">not</span> use your data for
            third-party advertising, and we do not track you across other companies&rsquo; apps or
            websites.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="ml-5 list-disc space-y-2">
            <li>To create and manage your account and authenticate your sessions.</li>
            <li>To operate core features — ingesting telemetry, rendering dashboards, evaluating alert rules and delivering notifications.</li>
            <li>To maintain, secure, troubleshoot and improve the Service.</li>
            <li>To respond to your enquiries and provide customer support.</li>
            <li>To comply with legal obligations and enforce our terms.</li>
          </ul>
        </Section>

        <Section title="3. Legal Bases for Processing">
          <p>
            Where applicable law (such as the GDPR or Singapore&rsquo;s PDPA) requires it, we process
            your information on the bases of performance of our contract with you, your consent, our
            legitimate interests in operating and securing the Service, and compliance with legal
            obligations.
          </p>
        </Section>

        <Section title="4. How We Share Information">
          <p>We do not sell your personal information. We share it only:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              With infrastructure providers (e.g. hosting, database and email delivery) who process
              data solely on our behalf and under confidentiality obligations.
            </li>
            <li>When required by law, legal process or to protect the rights, safety and security of users and the public.</li>
            <li>In connection with a merger, acquisition or sale of assets, subject to this policy.</li>
          </ul>
          <p>
            If you self-host IoTFlow, your data resides on infrastructure that you control, and you
            act as the data controller for it.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your account and configuration data for as long as your account is active.
            Telemetry data is retained according to your plan and configuration. When you delete your
            account, we delete or irreversibly anonymise your personal information within a reasonable
            period, except where retention is required for legal, accounting or security purposes.
          </p>
        </Section>

        <Section title="6. Your Rights &amp; Choices">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Access, correct or update the personal information we hold about you.</li>
            <li>Request deletion of your account and associated personal data.</li>
            <li>Object to or restrict certain processing, and request a copy of your data.</li>
            <li>Withdraw consent where processing is based on consent.</li>
          </ul>
          <p>
            You can manage your account details in the app&rsquo;s Settings. To request deletion or
            exercise any other right, contact us at{" "}
            <a className="font-medium text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="7. Data Security">
          <p>
            We use industry-standard safeguards — encryption in transit (HTTPS/TLS), hashed
            passwords, access controls and scoped API keys — to protect your information. No method of
            transmission or storage is completely secure, so we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="8. Children&rsquo;s Privacy">
          <p>
            The Service is not directed to children under 13 (or the equivalent minimum age in your
            jurisdiction), and we do not knowingly collect their personal information. If you believe a
            child has provided us data, contact us and we will delete it.
          </p>
        </Section>

        <Section title="9. International Transfers">
          <p>
            Your information may be processed and stored in countries other than your own. Where we
            transfer data internationally, we take steps to ensure it receives an adequate level of
            protection consistent with this policy and applicable law.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Material changes will be posted on
            this page with an updated &ldquo;Last updated&rdquo; date. Your continued use of the
            Service after changes take effect constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            If you have questions or requests regarding this Privacy Policy or your data, contact:
          </p>
          <p className="text-foreground">
            Tertiary Infotech Pte Ltd
            <br />
            Email:{" "}
            <a className="font-medium text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} IoTFlow · Tertiary Infotech Pte Ltd</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/#contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
