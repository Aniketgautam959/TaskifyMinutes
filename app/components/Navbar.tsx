import React from 'react';
import { AppTab } from '../types';
import { UserButton } from "@clerk/nextjs";
import { Plus } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onNewCapture: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onNewCapture }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] px-3 pt-3 sm:px-4 sm:pt-4 md:px-8 md:pt-6 pointer-events-none transition-all duration-300">
      <div className="max-w-[1440px] mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 bg-card/95 backdrop-blur-xl py-2 px-2.5 sm:px-3 md:flex md:justify-between md:gap-4 md:py-3 md:px-6 rounded-2xl border border-border pointer-events-auto shadow-sm">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2 md:gap-2.5">
          <div className="w-8 h-8 shrink-0 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-sm tracking-tight text-foreground leading-none">TaskifyMinutes</span>
            <span className="text-[11px] text-muted-foreground mt-0.5 hidden lg:block">Turn meetings into momentum.</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-4 md:order-3">
          <ThemeToggle />
          <button
            onClick={onNewCapture}
            className="p-2 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center gap-2"
            aria-label="New meeting"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">New Meeting</span>
          </button>
          <div className="hidden md:block h-8 w-px bg-border mx-1" />
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8 md:w-9 md:h-9 border border-border rounded-xl",
              }
            }}
          />
        </div>

        {/* Tabs: full width under brand+controls on mobile, centered between on desktop */}
        <nav className="relative col-span-2 flex w-full items-center rounded-xl border border-border bg-muted/50 p-1 md:col-span-1 md:order-2 md:mx-auto md:w-[240px] md:max-w-[280px] md:shrink-0">
          <div
            className={`
              absolute top-1 bottom-1 left-1 w-[calc(50%-4px)]
              bg-primary rounded-lg shadow-sm
              transition-transform duration-300 ease-[cubic-bezier(0.2,0,0.2,1)]
              ${activeTab === 'Tasks' ? 'translate-x-full' : 'translate-x-0'}
            `}
          />

          {(['Meetings', 'Tasks'] as AppTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                relative z-10 flex-1 min-w-0 px-2 py-1.5 text-center text-xs sm:text-sm font-medium whitespace-nowrap
                transition-colors duration-200
                ${activeTab === tab ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
