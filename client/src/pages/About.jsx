import SEO from '../components/common/SEO';
import AcademyStory from '../components/about/AcademyStory';
import VisionMission from '../components/about/VisionMission';
import FounderProfile from '../components/about/FounderProfile';
import WhyChooseKayTech from '../components/about/WhyChooseKayTech';

export default function About() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about KayTech Hub's story, mission, and the team building a practical tech academy and innovation hub in Port Harcourt."
      />
      <AcademyStory />
      <VisionMission />
      <FounderProfile />
      <WhyChooseKayTech />
    </>
  );
}
