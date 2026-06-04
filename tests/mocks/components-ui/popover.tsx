import React from 'react';
export const Popover = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const PopoverTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const PopoverContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export default Popover;
