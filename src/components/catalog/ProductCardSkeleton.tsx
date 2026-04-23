export function ProductCardSkeleton() {
  return (
    <div className="product-card h-full animate-pulse">
      <div className="h-[260px] bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="flex gap-2 pt-2">
          <div className="h-11 bg-muted rounded-2xl flex-1" />
          <div className="h-11 w-11 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
