import Reveal from '../components/common/Reveal';

export default function TermsOfService() {
  return (
    <section className="section legal-page">
      <Reveal as="div" className="prose">
        <h1>Terms of Service</h1>
        <p className="legal-page__date">Effective Date: August 3, 2026</p>

        <p>
          By using KayTech Hub's website, courses, services, mentorship programs, or workspace, you agree to
          these terms.
        </p>

        <h2>1. Who We Are</h2>
        <p>
          KayTech Hub is a tech academy and innovation hub based in Port Harcourt, Nigeria, offering technical
          courses, business services (web development, consultation, branding, marketing, AI integration),
          mentorship programs, and co-working space access.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You're responsible for keeping your login credentials confidential.</li>
          <li>Student and Instructor accounts are created via invite codes issued by KayTech Hub admin, not open self-registration.</li>
          <li>You must provide accurate information when registering, applying, or reserving any service.</li>
        </ul>

        <h2>3. Courses &amp; Enrollment</h2>
        <ul>
          <li>Course registration through our website is an expression of interest, not confirmed enrollment — our team will follow up to confirm your spot and arrange payment.</li>
          <li>All payments (courses, scholarships, mentorship, services, workspace) are currently made offline via bank transfer or cash — KayTech Hub does not process online payments through this platform at this time.</li>
          <li>Course fees, once paid, are non-refundable once a cohort has commenced. If KayTech Hub cancels a cohort before it begins, a full refund will be issued.</li>
          <li>Certificates are issued upon successful completion of a cohort, at KayTech Hub's discretion based on attendance and assignment completion.</li>
        </ul>

        <h2>4. Scholarships</h2>
        <p>
          Scholarship applications are reviewed at KayTech Hub's sole discretion. Submission of an application
          does not guarantee approval.
        </p>

        <h2>5. Services &amp; Mentorship</h2>
        <ul>
          <li>Business service requests (web development, consultation, branding, marketing, AI integration) are quoted and agreed individually with each client — pricing shown on the site is a starting reference only, not a fixed quote.</li>
          <li>Mentorship program pricing is set by KayTech Hub and may change between cohorts/intakes.</li>
        </ul>

        <h2>6. Workspace / Co-working Space</h2>
        <ul>
          <li>Workspace access requires a valid form of ID and emergency contact information for safety and security purposes.</li>
          <li>
            Access is granted for the duration of your paid plan (daily, weekly, monthly, or yearly) and may be
            revoked for misuse of the space. House rules include: maintaining a quiet, respectful working
            environment; no smoking or illegal substances on the premises; keeping shared areas clean; and
            following any instructions given by KayTech Hub staff on-site.
          </li>
        </ul>

        <h2>7. User Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Submit false information in any application, registration, or request</li>
          <li>Use the platform for any unlawful purpose</li>
          <li>Attempt to access accounts, data, or areas of the platform you're not authorized to access</li>
          <li>Submit testimonials, success stories, or content that is false, defamatory, or misleading</li>
        </ul>

        <h2>8. Content Ownership</h2>
        <ul>
          <li>Course materials, curriculum, and platform content belong to KayTech Hub and may not be redistributed without permission.</li>
          <li>Content you submit (testimonials, success stories, assignment work) remains yours, but by submitting a testimonial or success story for publication, you grant KayTech Hub permission to display it publicly on the platform.</li>
        </ul>

        <h2>9. Limitation of Liability</h2>
        <p>
          KayTech Hub provides its courses, services, and facilities in good faith but does not guarantee
          specific career outcomes, business results, or income from any course, mentorship program, or
          service.
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these terms as the platform evolves. Continued use of KayTech Hub after changes means
          you accept the updated terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

        <h2>12. Contact Us</h2>
        <p>Questions about these terms: support@kaytechhub.com / [Phone number to be added].</p>
      </Reveal>
    </section>
  );
}
