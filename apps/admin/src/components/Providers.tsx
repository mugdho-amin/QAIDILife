import type { ReactNode } from "react";
import { RefineProvider } from "@/components/RefineProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <RefineProvider>
        {children}
      </RefineProvider>
    </ThemeProvider>
  );
}
