import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Layers, Users } from 'lucide-react';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import EmptyState from '../../../components/common/EmptyState';
import StatusPill from '../../../components/admin/StatusPill';

const STATUS_TONE = { draft: 'amber', published: 'teal', archived: 'slate' };

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/instructor/courses'),
      api.get('/instructor/cohorts'),
      api.get('/instructor/payouts'),
    ])
      .then(([coursesRes, cohortsRes, payoutsRes]) => {
        setCourses(coursesRes.data.courses);
        setCohorts(cohortsRes.data.cohorts);
        setPayouts(payoutsRes.data.payouts);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your courses'))
      .finally(() => setLoading(false));
  }, []);

  const { cohortCountByCourseId, studentCountByCourseId } = useMemo(() => {
    const cohortCounts = {};
    cohorts.forEach((c) => {
      const id = c.course_id?._id || c.course_id;
      cohortCounts[id] = (cohortCounts[id] || 0) + 1;
    });

    const studentCounts = {};
    payouts.forEach((p) => {
      const id = p.cohort_id?.course_id?._id || p.cohort_id?.course_id;
      if (!id) return;
      studentCounts[id] = (studentCounts[id] || 0) + (p.students_count || 0);
    });

    return { cohortCountByCourseId: cohortCounts, studentCountByCourseId: studentCounts };
  }, [cohorts, payouts]);

  const totalStudents = useMemo(() => payouts.reduce((sum, p) => sum + (p.students_count || 0), 0), [payouts]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader title="My Courses" subtitle="Courses you're assigned to teach via a cohort." />

      <StatCards stats={[
        { label: 'Assigned Courses', value: courses.length },
        { label: 'Total Cohorts', value: cohorts.length },
        { label: 'Total Students', value: totalStudents },
      ]} />

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="payments-empty">Loading your courses...</p>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses assigned yet"
          message="An admin needs to assign you to a course cohort before it shows up here."
        />
      ) : (
        <div className="instructor-course-grid">
          {courses.map((course, i) => {
            const cohortCount = cohortCountByCourseId[course._id] || 0;
            const studentCount = studentCountByCourseId[course._id] || 0;
            return (
              <Reveal as="div" className="course-card" key={course._id} index={i}>
                <div className="course-card__image-wrap">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="course-card__image" />
                  ) : (
                    <div className="course-card__image course-card__image--placeholder" />
                  )}
                  {course.category && <span className="course-card__badge">{course.category}</span>}
                </div>

                <div className="course-card__body">
                  <h3 className="course-card__title">{course.title}</h3>
                  <p className="course-card__description">{course.description}</p>

                  <div className="course-card__meta">
                    <span><Layers size={14} aria-hidden="true" /> {cohortCount} cohort{cohortCount === 1 ? '' : 's'}</span>
                    <span><Users size={14} aria-hidden="true" /> {studentCount} student{studentCount === 1 ? '' : 's'}</span>
                  </div>

                  <div className="course-card__footer">
                    <div className="course-card__footer-left">
                      <div className="course-card__price">
                        <span className="course-card__price-label">Price</span>
                        <span className="course-card__price-value">₦{Number(course.price).toLocaleString()}</span>
                      </div>
                      <StatusPill tone={STATUS_TONE[course.status]}>{course.status}</StatusPill>
                    </div>
                    <Link to={`/instructor/academy/courses/${course._id}`} className="btn btn--primary course-card__cta">
                      Manage <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
