
interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="border border-red-200 bg-red-50 p-4 rounded-md">
      <p className="text-red-800 font-medium">{error}</p>
      <p className="text-sm text-red-600 mt-2">Please check your file format and try again</p>
    </div>
  );
}
