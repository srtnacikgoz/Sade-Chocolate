import { createPortal } from 'react-dom';
import { ReactNode } from 'react';

interface ModalPortalProps {
  children: ReactNode;
  isOpen: boolean;
}

export const ModalPortal = ({ children, isOpen }: ModalPortalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <>{children}</>,
    document.body
  );
};
