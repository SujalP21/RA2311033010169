import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`mobile-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1>📬 Notifications</h1>
          <p>Campus Notification Hub</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <span className="nav-icon">📋</span>
            All Notifications
          </NavLink>

          <NavLink
            to="/priority"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <span className="nav-icon">⭐</span>
            Priority Inbox
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          Campus Notification Microservice
        </div>
      </aside>
    </>
  );
}
