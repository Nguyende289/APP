

import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  );
};

export default Layout;