/**
 * AppShell Component
 * Main application shell providing the split-view layout
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  className?: string;
}

/**
 * Main application shell with responsive sidebar layout
 * 
 * Desktop (>1024px): Fixed sidebar + main content area
 * Tablet (640-1024px): Collapsible sidebar + main content
 * Mobile (<640px): Hidden sidebar, bottom navigation
 */
export function AppShell({
  sidebar,
  mainContent,
  className,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  // Handle responsive behavior
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={cn(
        "flex h-screen w-full overflow-hidden bg-background",
        className
      )}
    >
      {/* Sidebar - Hidden on mobile by default */}
      <aside
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out",
          "bg-sidebar border-r border-sidebar-border",
          "flex flex-col",
          // Desktop: fixed width
          "lg:w-[280px] lg:static",
          // Mobile/Tablet: slide over
          isSidebarOpen
            ? "w-[280px] translate-x-0"
            : "w-0 -translate-x-full lg:w-[280px] lg:translate-x-0",
          // Mobile overlay
          !isMobile && !isSidebarOpen && "lg:hidden"
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {mainContent}
      </main>
    </div>
  );
}

/**
 * Mobile sidebar toggle button
 * Place this in the header for mobile navigation
 */
export function SidebarToggle({
  isOpen,
  onToggle,
  className,
}: {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "p-2 rounded-md hover:bg-accent transition-colors",
        "lg:hidden", // Only show on mobile/tablet
        className
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isOpen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}
