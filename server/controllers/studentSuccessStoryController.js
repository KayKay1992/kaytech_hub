const SuccessStory = require('../models/SuccessStory');
const Certificate = require('../models/Certificate');
const { uploadImage } = require('../utils/upload');

// POST /api/student/success-stories — a student may only share a success
// story once they've actually completed a cohort (holding a Certificate).
const submitStory = async (req, res) => {
  try {
    const { headline, story, course_id } = req.body;
    if (!headline || !story) {
      return res.status(400).json({ message: 'Headline and story are required' });
    }

    const hasCertificate = await Certificate.exists({ student_id: req.user._id });
    if (!hasCertificate) {
      return res.status(403).json({ message: 'Only students who have completed a cohort can submit a success story' });
    }

    let photo_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'success-story-photos');
      photo_url = result.url;
    }

    const successStory = await SuccessStory.create({
      student_id: req.user._id,
      headline,
      story,
      photo_url,
      course_id: course_id || null,
    });

    res.status(201).json({ story: successStory });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit success story', error: err.message });
  }
};

module.exports = { submitStory };
