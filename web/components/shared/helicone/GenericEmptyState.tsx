import React, { ReactNode } from "react";
import { H2, P } from "@/components/ui/typography";

interface GenericEmptyStateProps {
  /**
   * The title displayed at the top of the empty state
   */
  title: string;

  /**
   * The description text that appears under the title
   */
  description: string;

  /**
   * The icon component to display at the top
   */
  icon: ReactNode;

  /**
   * Action elements to display (buttons, links, etc)
   * These will be rendered in a row
   */
  actions?: ReactNode;

  /**
   * Additional content to render after the actions
   */
  children?: ReactNode;

  /**
   * Optional custom class names
   */
  className?: string;
}

/**
 * A generic empty state component that can be used across different features
 */
const GenericEmptyState: React.FC<GenericEmptyStateProps> = ({
  title,
  description,
  icon,
  actions,
  children,
}) => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background dark:bg-sidebar-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-accent">
          {icon}
        </div>

        <div className="flex flex-col gap-2">
          <H2>{title}</H2>
          <P className="max-w-2xl text-muted-foreground">{description}</P>
        </div>

        {actions && <div className="flex flex-row gap-3">{actions}</div>}

        {children}
      </div>
    </div>
  );
};

export default GenericEmptyState;
