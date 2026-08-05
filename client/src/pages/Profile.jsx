import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/initials';
import ListPageHeader from '../components/common/ListPageHeader';
import api from '../api/axios';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Alumni Directory opt-in — only offered to students who actually hold a
  // Certificate. Not cached: re-derived from live Certificate records every
  // time this page loads, same rule the Alumni Forum itself uses.
  const [completedCourses, setCompletedCourses] = useState([]);
  const [alumniForm, setAlumniForm] = useState({
    show_in_alumni_directory: false,
    current_role: '',
    current_company: '',
    alumni_bio: '',
  });
  const [alumniError, setAlumniError] = useState('');
  const [alumniSuccess, setAlumniSuccess] = useState('');
  const [savingAlumni, setSavingAlumni] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    setAlumniForm({
      show_in_alumni_directory: Boolean(user.show_in_alumni_directory),
      current_role: user.current_role || '',
      current_company: user.current_company || '',
      alumni_bio: user.alumni_bio || '',
    });
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    api.get('/student/certificates')
      .then((res) => {
        const titles = res.data.certificates
          .map((c) => c.cohort_id?.course_id?.title)
          .filter(Boolean);
        setCompletedCourses([...new Set(titles)]);
      })
      .catch(() => setCompletedCourses([]));
  }, [user]);

  // Local preview for a newly chosen (not-yet-uploaded) photo.
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhotoFile(e.target.files[0] || null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);
    try {
      await updateProfile({ ...profileForm, photo: photoFile });
      setPhotoFile(null);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAlumniChange = (e) => {
    const { name, type, checked, value } = e.target;
    setAlumniForm({ ...alumniForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setAlumniError('');
    setAlumniSuccess('');
    setSavingAlumni(true);
    try {
      await updateProfile(alumniForm);
      setAlumniSuccess('Alumni Directory settings saved.');
    } catch (err) {
      setAlumniError(err.response?.data?.message || 'Failed to save Alumni Directory settings. Please try again.');
    } finally {
      setSavingAlumni(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Password updated successfully.');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  const displayedPhoto = photoPreview || user.photo_url;

  return (
    <div className="admin-dashboard">
      <ListPageHeader title="My Profile" subtitle="View and update your account details." />

      <div className="profile-grid">
        <section className="card profile-card">
          <h2>Profile info</h2>
          {profileError && <p className="form-error">{profileError}</p>}
          {profileSuccess && <p className="form-success">{profileSuccess}</p>}

          <div className="profile-photo-row">
            <span className="profile-photo">
              {displayedPhoto ? (
                <img src={displayedPhoto} alt={user.name} />
              ) : (
                <span className="profile-photo__initials">{getInitials(user.name)}</span>
              )}
            </span>
            <label className={`file-input-label ${photoFile ? 'file-input-label--chosen' : ''}`} title={photoFile?.name}>
              {photoFile ? `📎 ${photoFile.name}` : '📎 Change photo'}
              <input type="file" accept="image/*" className="sr-only-file-input" onChange={handlePhotoChange} />
            </label>
          </div>

          <form className="auth-form profile-form" onSubmit={handleProfileSubmit}>
            <label>
              Full name
              <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} required />
            </label>

            <label>
              Email
              <input type="email" name="email" value={profileForm.email} onChange={handleProfileChange} required />
              <span className="form-hint">This is your login email — changing it updates how you sign in.</span>
            </label>

            <label>
              Phone
              <input type="tel" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            </label>

            <label>
              Role
              <input type="text" value={user.role} disabled />
            </label>

            <button type="submit" className="btn btn--primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        {user.role === 'student' && completedCourses.length > 0 && (
          <section className="card profile-card">
            <h2>Alumni Directory</h2>
            <p className="form-hint">
              Opt in to appear in the searchable Alumni Directory, visible to fellow alumni, instructors and admin.
            </p>
            {alumniError && <p className="form-error">{alumniError}</p>}
            {alumniSuccess && <p className="form-success">{alumniSuccess}</p>}

            <form className="auth-form profile-form" onSubmit={handleAlumniSubmit}>
              <label className="auth-form__checkbox-label">
                <input
                  type="checkbox"
                  name="show_in_alumni_directory"
                  checked={alumniForm.show_in_alumni_directory}
                  onChange={handleAlumniChange}
                />
                <span>Show me in the Alumni Directory</span>
              </label>

              <label>
                Course(s) completed
                <span className="form-hint">Filled in automatically from your certificates.</span>
                <div className="alumni-course-tags">
                  {completedCourses.map((title) => (
                    <span key={title} className="badge">{title}</span>
                  ))}
                </div>
              </label>

              <label>
                Current role / job title
                <input
                  type="text"
                  name="current_role"
                  value={alumniForm.current_role}
                  onChange={handleAlumniChange}
                  placeholder="e.g. Frontend Developer"
                />
              </label>

              <label>
                Current company (optional)
                <input
                  type="text"
                  name="current_company"
                  value={alumniForm.current_company}
                  onChange={handleAlumniChange}
                  placeholder="e.g. Acme Inc."
                />
              </label>

              <label>
                Short bio / what you're up to now (optional)
                <textarea
                  name="alumni_bio"
                  value={alumniForm.alumni_bio}
                  onChange={handleAlumniChange}
                  rows={3}
                  maxLength={600}
                />
              </label>

              <button type="submit" className="btn btn--primary" disabled={savingAlumni}>
                {savingAlumni ? 'Saving...' : 'Save Alumni Directory settings'}
              </button>
            </form>
          </section>
        )}

        <section className="card profile-card">
          <h2>Change password</h2>
          {passwordError && <p className="form-error">{passwordError}</p>}
          {passwordSuccess && <p className="form-success">{passwordSuccess}</p>}

          <form className="auth-form profile-form" onSubmit={handlePasswordSubmit}>
            <label>
              Current password
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>

            <label>
              New password
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </label>

            <button type="submit" className="btn btn--primary" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
