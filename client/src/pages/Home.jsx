import SEO from '../components/common/SEO';
import Hero from '../components/home/Hero';
import CoursesOverview from '../components/home/CoursesOverview';
import ScholarshipBanner from '../components/home/ScholarshipBanner';
import MentorshipPreview from '../components/home/MentorshipPreview';
import ServicesPreview from '../components/home/ServicesPreview';
import SpacePreview from '../components/home/SpacePreview';
import StudentSuccessStories from '../components/home/StudentSuccessStories';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';

export default function Home() {
  return (
    <>
      <SEO
        titleOverride="KayTech Hub | Tech Academy & Innovation Hub — Port Harcourt"
        description="Practical, job-ready tech courses, business mentorship, and a co-working space in Port Harcourt — with AI skills built into every course."
      />
      <Hero />
      <CoursesOverview />
      <ScholarshipBanner />
      <MentorshipPreview />
      <ServicesPreview />
      <SpacePreview />
      <StudentSuccessStories />
      <Testimonials />
      <CallToAction />
    </>
  );
}
