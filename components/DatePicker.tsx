

import React from 'react';
import InputField from './InputField';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  value: string; // Ensure value is always a string for input type="date"
}

const DatePicker: React.FC<DatePickerProps> = ({ label, id, error, value, ...props }) => {
  return (
    <InputField
      label={label}
      id={id}
      type="date"
      value={value}
      error={error}
      {...props}
    />
  );
};

export default DatePicker;