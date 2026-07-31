import { getInitials } from '../../utils/initials';

// Small initials avatar for table/list rows (Users, Payments, Notifications...).
export default function Avatar({ name, size = 32 }) {
  return (
    <span className="avatar-circle" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {getInitials(name)}
    </span>
  );
}
