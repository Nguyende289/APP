
import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void; // Added onClick prop
}

const Card: React.FC<CardProps> = ({ title, value, description, className = '', icon, onClick }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col justify-between ${className} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200 group' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        {icon && <div className="text-blue-500 dark:text-blue-400">{icon}</div>}
      </div>
      <p className={`text-3xl font-bold text-gray-900 dark:text-white ${onClick ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 decoration-blue-500 underline-offset-4 group-hover:underline' : ''}`}>
        {value}
      </p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
      )}
    </div>
  );
};

export default Card;
