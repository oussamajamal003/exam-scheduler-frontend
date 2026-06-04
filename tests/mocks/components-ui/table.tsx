import React from 'react';
export const Table = ({ children, ...props }: any) => <table {...props}>{children}</table>;
export const TableHeader = ({ children, ...props }: any) => <thead {...props}>{children}</thead>;
export const TableBody = ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>;
export const TableRow = ({ children, ...props }: any) => <tr {...props}>{children}</tr>;
export const TableCell = ({ children, ...props }: any) => <td {...props}>{children}</td>;
export const TableHead = ({ children, ...props }: any) => <th {...props}>{children}</th>;
export default Table;
