import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const getBreadcrumbName = (path) => {
    const nameMap = {
      'dashboard': 'Dashboard',
      'signin': 'Sign In',
      'signup': 'Sign Up',
      'map': 'Map',
      'maptest': 'Map Test'
    };
    return nameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;

    return (
      <span key={name} className="breadcrumb-item">
        {isLast ? (
          <span className="breadcrumb-current">{getBreadcrumbName(name)}</span>
        ) : (
          <Link to={routeTo} className="breadcrumb-link">
            {getBreadcrumbName(name)}
          </Link>
        )}
        {!isLast && <span className="breadcrumb-separator">/</span>}
      </span>
    );
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-home">
        🏠 Home
      </Link>
      {breadcrumbs.length > 0 && <span className="breadcrumb-separator">/</span>}
      {breadcrumbs}
    </nav>
  );
};

export default Breadcrumbs; 