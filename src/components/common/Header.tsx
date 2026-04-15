import React from 'react';
import { Bell, Search, Menu, UserCircle } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors rounded-md" title="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden md:block max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search records, schedules, students..." 
            className="pl-9 pr-4 py-2 w-72 lg:w-96 bg-muted/50 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all focus:bg-background placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full ring-2 ring-background"></span>
        </button>
        
        <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
        
        <button className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">System Admin</span>
          </div>
        </button>
      </div>
    </header>
  );
};
