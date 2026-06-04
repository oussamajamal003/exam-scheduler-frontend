import React from 'react';
export const ToastProvider = ({ children }: any) => <div>{children}</div>;
export const useToast = () => ({
  toast: (msg: any) => {},
  success: (msg: any) => {},
  error: (msg: any) => {},
});
export default ToastProvider;
