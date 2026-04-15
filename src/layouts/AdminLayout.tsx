import React from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { Outlet } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground selection:bg-primary/20">
      <Sidebar />
      <div className="relative flex flex-col flex-1 overflow-x-hidden border-l border-border bg-muted/10 shadow-inner">
        <Header />
        <main className="w-full grow p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};