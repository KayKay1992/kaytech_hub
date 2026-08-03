import Reveal from '../components/common/Reveal';

export default function PrivacyPolicy() {
  return (
    <section className="section legal-page">
      <Reveal as="div" className="prose">
        <h1>Privacy Policy</h1>
        <p className="legal-page__date">Effective Date: August 3, 2026</p>

        <p>
          KayTech Hub ("we," "us," "our") operates this platform to provide tech education, business services,
          mentorship, and co-working space access in Port Harcourt, Nigeria. This policy explains what personal
          data we collect, why, and how we handle it, in line with the Nigeria Data Protection Act (NDPA) 2023
          and the guidance of the Nigeria Data Protection Commission (NDPC).
        </p>

        <h2>1. What We Collect</h2>
        <p>Depending on how you interact with KayTech Hub, we may collect:</p>
        <ul>
          <li><strong>Account information:</strong> name, email, phone number, password (stored securely, never in plain text), profile photo</li>
          <li><strong>Course &amp; scholarship data:</strong> enrollment records, assignment submissions, grades, attendance, scholarship application details and supporting documents</li>
          <li><strong>Service &amp; mentorship data:</strong> company name, project details, occupation/experience level, reasons for interest, messages you send us</li>
          <li><strong>Workspace membership data:</strong> address, valid ID type and number, emergency contact name and phone number — collected because members are physically on-site and this is needed for access and safety purposes</li>
          <li><strong>Payment records:</strong> amounts paid, payment method, dates — we do not process payments through the platform; all payments are made offline (bank transfer or cash) and records are kept for accounting purposes only</li>
          <li><strong>Job applications:</strong> name, contact details, resume/CV, cover note</li>
          <li><strong>Testimonials &amp; success stories:</strong> name, role/organization, photo, your submitted content (only published publicly with your consent, after we review it)</li>
          <li><strong>Technical data:</strong> basic usage information necessary to operate the site (e.g. login sessions)</li>
        </ul>

        <h2>2. Why We Collect It</h2>
        <p>We only collect data for clear, specific purposes:</p>
        <ul>
          <li>To create and manage your account and role-based access</li>
          <li>To process enrollments, track academic progress, and issue certificates</li>
          <li>To review and respond to scholarship applications, service requests, mentorship registrations, workspace reservations, and job applications</li>
          <li>To verify your identity and ensure safety for in-person workspace access</li>
          <li>To keep accurate financial records of payments made to us</li>
          <li>To send you important updates (enrollment status, assignment deadlines, event announcements) via email or in-app notifications</li>
          <li>To improve KayTech Hub based on genuine business need — we do not sell your data or use it for unrelated advertising</li>
        </ul>

        <h2>3. How We Store Your Data</h2>
        <ul>
          <li>Account and platform data is stored in a secured MongoDB Atlas database.</li>
          <li>Uploaded documents (certificates, scholarship documents, resumes, images) are stored on Cloudflare R2.</li>
          <li>We take reasonable technical measures (password hashing, access controls) to protect your data, but no system is 100% secure, and we cannot guarantee absolute security.</li>
        </ul>

        <h2>4. Who Can See Your Data</h2>
        <ul>
          <li>Internally: only relevant KayTech Hub staff/admin can access your data, based on what's necessary for their role (e.g. an instructor sees their own students' progress, not other cohorts').</li>
          <li>We do not sell or rent your personal data to third parties.</li>
          <li>We may disclose data if required by law or a valid legal request from a Nigerian authority.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>Under the NDPA 2023, you have the right to:</p>
        <ul>
          <li>Know what personal data we hold about you</li>
          <li>Request a copy of your data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data (subject to legal/record-keeping requirements, e.g. we may need to retain certain financial records)</li>
          <li>Withdraw consent for optional data uses (e.g. featuring your testimonial publicly)</li>
        </ul>
        <p>To exercise any of these rights, contact us at support@kaytechhub.com.</p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active or as needed to fulfill the purposes above,
          and as required by Nigerian law for financial/education records. You can request deletion of your
          account at any time, subject to the above.
        </p>

        <h2>7. Children's Data</h2>
        <p>
          KayTech Hub's courses and programs are intended for individuals 16 years and older. Applicants under
          18 may be asked to provide parental/guardian consent before enrollment. We do not knowingly collect
          data from children below this age without appropriate consent.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>We may update this policy as KayTech Hub grows. We'll update the "Effective Date" above when changes are made.</p>

        <h2>9. Contact Us</h2>
        <p>Questions about this policy or your data: support@kaytechhub.com / [Phone number to be added].</p>
      </Reveal>
    </section>
  );
}
