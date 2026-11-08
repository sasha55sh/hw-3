import { Button } from "@/components/ui";

interface GenerateButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onGenerate: () => void;
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
    />
  );
}

export function GenerateButton({ isLoading, disabled, onGenerate }: GenerateButtonProps) {
  return (
    <div className="flex justify-end">
      <Button variant="primary" onClick={onGenerate} disabled={disabled || isLoading} aria-busy={isLoading} className="px-5 py-3">
        {isLoading ? (
          <>
            <Spinner />
            Generating… (~15–30 s)
          </>
        ) : (
          "Generate variants"
        )}
      </Button>
    </div>
  );
}
