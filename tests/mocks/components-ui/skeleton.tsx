import React from 'react';
export const Skeleton = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TableSkeletonRows = ({ rows = 3 }: any) => (
  <div>{Array.from({ length: rows }).map((_, i) => <div key={i}>skeleton</div>)}</div>
);
export default Skeleton;
