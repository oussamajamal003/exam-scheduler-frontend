import React from 'react';
export const Select = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectTrigger = ({ children, id, ...props }: any) => (
  <button id={id} {...props}>{children}</button>
);
export const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectItem = ({ children, ...props }: any) => (
  <div role="option" {...props}>{children}</div>
);
export const SelectValue = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const SelectLabel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export default Select;
