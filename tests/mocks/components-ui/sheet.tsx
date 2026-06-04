import React from 'react';
export const Sheet = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SheetContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export default Sheet;
