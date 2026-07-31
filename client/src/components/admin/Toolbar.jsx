import { Search } from 'lucide-react';

// Shared search + filter bar for admin list pages — light background
// (reuses the existing filter-bar pattern), never the dark public-form
// style. Pass `search`/`onSearchChange` for the search box, and any
// filter dropdowns as children.
export default function Toolbar({ search, onSearchChange, searchPlaceholder = 'Search...', children }) {
  return (
    <div className="user-filters admin-toolbar">
      {onSearchChange && (
        <div className="admin-toolbar__search">
          <Search size={16} className="admin-toolbar__search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {children}
    </div>
  );
}
