import { cn } from "@/lib/utils";

type PageSpinnerProps = {
  label?: string;
  className?: string;
};

export function PageSpinner({ label = "Loading", className }: PageSpinnerProps) {
  return (
    <div className={cn("flex min-h-[280px] w-full items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-8 py-10 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-muted/60" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin shadow-[0_0_30px_rgba(15,23,42,0.18)]" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        </div>
        <div className="text-center">
          <p className="font-heading text-sm font-medium tracking-[0.22em] uppercase text-foreground/90">
            {label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Preparing your workspace</p>
        </div>
      </div>
    </div>
  );
}
