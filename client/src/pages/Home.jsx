import Hero from '../components/home/Hero';
import CoursesOverview from '../components/home/CoursesOverview';
import ScholarshipBanner from '../components/home/ScholarshipBanner';
import MentorshipPreview from '../components/home/MentorshipPreview';
import ServicesPreview from '../components/home/ServicesPreview';
import StudentSuccessStories from '../components/home/StudentSuccessStories';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';

export default function Home() {
  return (
    <>
      <Hero />
      <CoursesOverview />
      <ScholarshipBanner />
      <MentorshipPreview />
      <ServicesPreview />
      <StudentSuccessStories />
      <Testimonials />
      <CallToAction />
    </>
  );
}
