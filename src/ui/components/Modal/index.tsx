import React, {MouseEventHandler, ReactElement, ReactNode} from 'react';
import ReactDOM from 'react-dom';
import './modal.scss';

let modalRoot: HTMLDivElement | null;

export type ModalProps = {
  onClose?: MouseEventHandler;
  className?: string;
  children?: ReactNode | ReactNode[];
}

export default function Modal(props: ModalProps): ReactElement {
  const { className = '', onClose, children } = props;

  modalRoot = document.querySelector('#modal');

  if (!modalRoot) return <></>;

  return ReactDOM.createPortal(
    <div
      className="modal__overlay"
      onClick={onClose}
    >
      <div className={`modal__wrapper ${className}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    modalRoot,
  );
}

