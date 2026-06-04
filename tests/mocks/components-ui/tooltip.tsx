import React from 'react';
export const Tooltip = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const TooltipContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TooltipTrigger = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export default Tooltip;
