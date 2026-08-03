import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/initials';
import ListPageHeader from '../components/common/ListPageHeader';

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

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
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
