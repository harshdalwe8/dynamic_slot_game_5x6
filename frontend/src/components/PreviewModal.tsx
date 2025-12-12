import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Backdrop onClick={handleBackdropClick}>
      <Modal>
        {children}
      </Modal>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1a3e 0%, #16213e 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  width: 100%;
  max-width: 900px;
  height: 90vh;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #ffd700;

  @media (max-width: 768px) {
    max-width: 100%;
    height: 95vh;
    border-radius: 12px;
  }
`;

export default PreviewModal;
