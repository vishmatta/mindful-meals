import React from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-background-primary rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-medium/20 flex-shrink-0">
          <h2 className="text-xl font-bold text-text-primary font-heading">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:bg-background-secondary"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        {footer && (
            <div className="flex justify-end p-4 border-t border-neutral-medium/20 flex-shrink-0">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};
