"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className="w-full">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className, activeTab, setActiveTab }: TabsListProps & { activeTab?: string; setActiveTab?: (value: string) => void }) {
  return (
    <div className={cn("flex gap-1 border-b mb-4", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, children, className, activeTab, setActiveTab }: TabsTriggerProps & { activeTab?: string; setActiveTab?: (value: string) => void }) {
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab?.(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors relative",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </button>
  );
}

export function TabsContent({ value, children, className, activeTab }: TabsContentProps & { activeTab?: string }) {
  if (activeTab !== value) return null;

  return <div className={cn("mt-4", className)}>{children}</div>;
}
