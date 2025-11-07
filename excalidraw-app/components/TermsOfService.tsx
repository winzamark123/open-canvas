import { useEffect } from "react";
import { Link } from "react-router-dom";

export function TermsOfService() {
  useEffect(() => {
    // Enable scrolling for this page
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    // Cleanup: restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    };
  }, []);
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16">
        <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>

        <p className="mb-8 text-muted-foreground">
          <strong>Last Updated:</strong>{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Definitions</h2>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                <strong>"Agreement"</strong> refers to these Terms of Service.
              </li>
              <li>
                <strong>"Company," "we," "us," or "our"</strong> refers to Open
                Canvas, the provider of the Service.
              </li>
              <li>
                <strong>"Content"</strong> refers to any drawings, images, text,
                audio, video, code, or other materials created, uploaded, or
                accessible through the Service.
              </li>
              <li>
                <strong>"Service"</strong> refers to the AI-powered whiteboard
                application provided by Open Canvas, including our website, APIs,
                software, documentation, and any related tools or functionalities.
              </li>
              <li>
                <strong>"User," "you," or "your"</strong> refers to the
                individual or entity accessing or using the Service.
              </li>
              <li>
                <strong>"User Content"</strong> refers to any data, information,
                drawings, or content that you submit, upload, create, or store
                through the Service.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              2. Acceptance of Terms
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              By accessing or using the Service, you agree to comply with and be
              bound by these Terms of Service. If you are using the Service on
              behalf of an organization, you represent and warrant that you have
              the authority to bind that organization to these Terms. If you do
              not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. Changes to Terms</h2>
            <p className="mb-4 text-foreground leading-relaxed">
              Open Canvas reserves the right to modify or revise these Terms at
              any time. We will provide notice of any material changes by posting
              the revised Terms on our website and/or by sending you an email.
              Your continued use of the Service after the effective date of any
              changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Use of the Service</h2>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              4.1 Access to the Service
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              Subject to these Terms and payment of any applicable fees, Company
              grants you a non-exclusive, non-transferable, revocable, limited
              right to access and use the Service solely for your own internal
              business or personal purposes.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              4.2 User Accounts
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You may be required to create a user account to access the Service.
              You are solely responsible for maintaining the security and
              confidentiality of your account credentials. You agree to notify us
              immediately of any unauthorized use of your account.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              4.3 Acceptable Use
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You agree to use the Service only for lawful and ethical purposes
              and in accordance with these Terms. You are responsible for all
              activity that occurs under your account.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              4.4 Prohibited Activities
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You shall not:
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                Violate any applicable laws, regulations, or third-party rights.
              </li>
              <li>
                Use the Service to create, generate, or distribute illegal,
                harmful, or offensive content, including but not limited to hate
                speech, spam, malware, or content that infringes intellectual
                property rights.
              </li>
              <li>
                Attempt to reverse engineer, decompile, or disassemble the
                Service.
              </li>
              <li>
                Access or attempt to access the Service through any unauthorized
                means, including by scraping, automated scripts, or bots.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service.
              </li>
              <li>Circumvent any security measures implemented by Company.</li>
              <li>
                Exceed usage limits as defined in your subscription plan or as
                otherwise communicated by Company.
              </li>
              <li>
                Use the Service to develop competing products or services.
              </li>
              <li>
                Resell or redistribute the Service or any output generated by the
                Service without our express written consent.
              </li>
              <li>
                Use the Service in a manner that could damage, disable,
                overburden, or impair the Service.
              </li>
            </ul>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              4.5 Resource Usage
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You agree not to use the Service in a way that consumes excessive
              resources or negatively impacts the performance of the Service for
              other users. Company reserves the right to monitor and limit your
              resource usage to ensure the stability and availability of the
              Service.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">4.6 Compliance</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You are solely responsible for ensuring that your use of the Service
              complies with all applicable laws and regulations, including data
              protection and privacy laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Inactivity Policy</h2>

            <h3 className="mb-3 mt-6 text-xl font-semibold">5.1 Account Inactivity</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              If your account remains inactive for a period of 12 months, we may
              suspend or terminate your account and delete any associated data. We
              will provide reasonable notice before taking such action.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">5.2 Data Retention</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              We may retain data associated with your account for a reasonable
              period after termination or inactivity for legal, business, or
              operational purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Fees and Payments</h2>

            <h3 className="mb-3 mt-6 text-xl font-semibold">6.1 Subscription Fees</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              The use of the Service may require payment of fees as described on
              our pricing page. Fees are subject to change. We will provide
              reasonable notice of any fee changes.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">6.2 Billing</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You agree to provide accurate and up-to-date billing information.
              Payments are processed through a secure third-party payment processor.
              You are responsible for all fees and charges associated with your
              account, including any applicable taxes.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">6.3 Refunds</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              Except as required by law, all fees are non-refundable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              7. Intellectual Property
            </h2>

            <h3 className="mb-3 mt-6 text-xl font-semibold">7.1 Ownership</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              All intellectual property rights in and to the Service, including but
              not limited to copyrights, trademarks, and trade secrets, are owned
              by Company or its licensors. You acknowledge that the Service and its
              underlying technology are protected by intellectual property laws.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">7.2 License Grant</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              Subject to these Terms, Company grants you a limited,
              non-exclusive, non-transferable, revocable license to use the output
              generated by the Service solely for your own internal business or
              personal purposes. You shall not sublicense, resell, or redistribute
              the output.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">7.3 User Content</h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You retain ownership of any User Content that you submit to the
              Service. By submitting User Content, you grant Company a
              non-exclusive, royalty-free, worldwide license to use, reproduce,
              modify, and distribute your User Content solely for the purpose of
              providing and improving the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Privacy Policy</h2>
            <p className="mb-4 text-foreground leading-relaxed">
              Your use of the Service is also governed by our{" "}
              <Link
                to="/legal/privacy"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your personal
              information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              9. Service Level Agreements (SLAs)
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              While we strive to maintain high availability and performance of the
              Service, we do not guarantee any specific service levels. Any SLAs
              will be separately agreed upon in writing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Termination</h2>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              10.1 Termination by Company
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              Company may terminate or suspend your access to the Service at any
              time, with or without cause, and with or without notice. We may
              terminate your access immediately if you breach these Terms or
              engage in any activity that we deem harmful to the Service or other
              users.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              10.2 Termination by You
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              You may terminate your use of the Service at any time by closing
              your account.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              10.3 Effect of Termination
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              Upon termination of your access to the Service, your right to use the
              Service will immediately cease. You will no longer have access to
              your account or any data associated with it. We are not obligated to
              retain your data after termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              11. Disclaimer of Warranties
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT
              NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
              A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. COMPANY DOES NOT WARRANT
              THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              12. Limitation of Liability
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
              COMPANY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
              REVENUES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE
              SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
              NEGLIGENCE), OR ANY OTHER LEGAL THEORY, EVEN IF COMPANY HAS BEEN
              ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL
              COMPANY'S AGGREGATE LIABILITY EXCEED THE TOTAL AMOUNT PAID BY YOU
              FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">13. Contact Us</h2>
            <p className="mb-4 text-foreground leading-relaxed">
              If you have any questions or concerns about these Terms of Service,
              please contact us at{" "}
              <a
                href="mailto:hello@cerateam.com"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                hello@cerateam.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

