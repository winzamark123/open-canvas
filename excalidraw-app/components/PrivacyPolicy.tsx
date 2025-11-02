export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16">
        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

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
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="mb-4 text-foreground leading-relaxed">
              Open Canvas ("Company," "we," "us," or "our") is committed to
              protecting the privacy of your personal information. This Privacy
              Policy explains how we collect, use, and disclose information when
              you access or use our website, APIs, software, documentation, and
              other related materials (collectively, the "Service").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              2. Information We Collect
            </h2>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              2.1 Information You Provide:
            </h3>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                <strong>Account Information:</strong> When you create an
                account, we collect your name, email address, password, and
                other information you choose to provide.
              </li>
              <li>
                <strong>Payment Information:</strong> If you subscribe to a paid
                service, we collect payment information, such as your credit
                card number, billing address, and other relevant details. This
                information is processed securely through our third-party
                payment processor.
              </li>
              <li>
                <strong>Communications:</strong> When you contact us for support
                or other inquiries, we collect the information you provide in
                your communications.
              </li>
              <li>
                <strong>User Content:</strong> We collect any data, information,
                or content you submit or upload to the Service ("User Content").
              </li>
            </ul>

            <h3 className="mb-3 mt-6 text-xl font-semibold">
              2.2 Information We Collect Automatically:
            </h3>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                <strong>Usage Data:</strong> We automatically collect
                information about your use of the Service, including your IP
                address, browser type, device information, access times, pages
                viewed, and other interactions with the Service.
              </li>
              <li>
                <strong>Log Data:</strong> Our servers automatically record
                information ("Log Data") created by your use of the Service. Log
                Data may include information such as your IP address, browser
                type, operating system, referring web page, pages visited,
                location, your mobile carrier, device information (including
                device and application IDs), search terms, and cookie
                information.
              </li>
              <li>
                <strong>Cookies and Similar Technologies:</strong> We use
                cookies and similar tracking technologies (e.g., web beacons,
                pixels) to collect information about your interactions with the
                Service. This information helps us personalize your experience,
                analyze usage patterns, and improve the Service. You can manage
                your cookie preferences through your browser settings.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              3. How We Use Your Information
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                <strong>Providing and Improving the Service:</strong> To
                operate, maintain, and improve the Service; to personalize your
                experience; and to develop new features and functionalities.
              </li>
              <li>
                <strong>Customer Support:</strong> To respond to your inquiries
                and provide technical assistance.
              </li>
              <li>
                <strong>Communications:</strong> To send you important updates,
                service announcements, and administrative messages. We may also
                send you marketing communications if you have opted in to
                receive them. You can opt out of marketing communications at any
                time.
              </li>
              <li>
                <strong>Security and Fraud Prevention:</strong> To protect the
                Service, our users, and ourselves from unauthorized access, use,
                or disclosure of information.
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws and regulations.
              </li>
              <li>
                <strong>Analytics and Research:</strong> To analyze trends,
                usage patterns, and user demographics to improve the Service and
                develop new products and services.{" "}
                <strong>
                  We do not use data stored within our storage services for
                  training our AI models.
                </strong>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              4. Data Sharing and Disclosure
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              We may share your information with third parties in the following
              circumstances:
            </p>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                <strong>Service Providers:</strong> We may share your
                information with third-party service providers who assist us in
                providing the Service (e.g., payment processors, hosting
                providers, analytics providers). These providers are
                contractually obligated to protect the confidentiality and
                security of your information.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose your
                information if required to do so by law or in response to a
                valid legal request (e.g., a subpoena or court order).
              </li>
              <li>
                <strong>Business Transactions:</strong> If we are involved in a
                merger, acquisition, or sale of all or a portion of our assets,
                your information may be transferred as part of that transaction.
                We will notify you via email and/or a prominent notice on our
                website of any such change in ownership or uses of your personal
                information, as well as any choices you may have regarding your
                personal information.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share your
                information with other third parties with your consent.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Data Security</h2>
            <p className="mb-4 text-foreground leading-relaxed">
              We take reasonable measures to protect your information from
              unauthorized access, use, or disclosure. This includes utilizing
              industry-standard security measures, such as encryption, access
              controls, and regular security assessments. However, no method of
              transmission over the Internet or electronic storage is 100%
              secure. Therefore, we cannot guarantee absolute security.
            </p>
            <h3 className="mb-3 mt-6 text-xl font-semibold">
              5.1 Data Encryption for Storage Services:
            </h3>
            <p className="mb-4 text-foreground leading-relaxed">
              For data stored within our storage services, we offer encryption
              options that provide you with full control over your encryption
              keys. You have the option to encrypt your data before uploading it
              to our servers, or you can use our provided encryption tools. We
              do not access or use your encrypted data for any purpose other
              than storing and retrieving it at your direction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Your Choices</h2>
            <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground">
              <li>
                <strong>Account Information:</strong> You can access, update,
                and correct your account information by logging into your
                account settings.
              </li>
              <li>
                <strong>Marketing Communications:</strong> You can opt out of
                receiving marketing communications from us by following the
                unsubscribe instructions included in these communications or by
                contacting us at support@opencanvas.studio.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              7. Children's Privacy
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              The Service is not intended for use by children under the age of
              13. We do not knowingly collect personal information from children
              under 13. If you believe we have collected information from a
              child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              8. International Data Transfers
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              Your information may be transferred to and processed in countries
              other than the country in which you reside. These countries may
              have data protection laws that are different from the laws of your
              country. By using the Service, you consent to the transfer of your
              information to these countries. We will take appropriate steps to
              protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">
              9. Changes to this Privacy Policy
            </h2>
            <p className="mb-4 text-foreground leading-relaxed">
              We reserve the right to modify this Privacy Policy at any time. We
              will post any changes to this Privacy Policy on our website and/or
              send you an email notification. Your continued use of the Service
              following the posting of any changes constitutes your acceptance
              of the revised Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
            <p className="mb-4 text-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy,
              please contact us at support@opencanvas.studio.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
