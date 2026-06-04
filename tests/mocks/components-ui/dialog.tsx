import React from 'react';
export const Dialog = ({ children, open, onOpenChange, ...props }: any) => (
  <div role="dialog" aria-hidden={!open} {...props}>{children}</div>
);
export const DialogContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogHeader = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogFooter = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogTitle = ({ children, ...props }: any) => <h2 {...props}>{children}</h2>;
export const DialogDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
export default Dialog;
