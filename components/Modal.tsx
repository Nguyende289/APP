

import React from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // Add maxWidth prop for custom widths
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-3xl' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-gray-900 opacity-75" onClick={onClose}></div>
      <div className={`relative w-auto my-6 mx-auto ${maxWidth}`}>
        {/*content*/}
        <div className="relative flex flex-col w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl outline-none focus:outline-none">
          {/*header*/}
          <div className="flex items-start justify-between p-6 border-b border-solid border-gray-200 dark:border-gray-700 rounded-t-3xl">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" id="modal-title">
              {title}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-700 dark:text-gray-300 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <span className="text-gray-700 dark:text-gray-300 h-6 w-6 text-2xl block outline-none focus:outline-none">
                ×
              </span>
            </button>
          </div>
          {/*body*/}
          <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto">
            {children}
          </div>
          {/*footer*/}
          <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 dark:border-gray-700 rounded-b-3xl">
            {footer || (
              <Button variant="secondary" onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;