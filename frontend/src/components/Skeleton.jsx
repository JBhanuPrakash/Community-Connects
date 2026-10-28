function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      <Skeleton className="h-52 w-full rounded-none" />

      <div className="space-y-3 p-6">

        <div className="flex items-center justify-between">

          <Skeleton className="h-5 w-20" />

          <Skeleton className="h-5 w-14" />

        </div>

        <Skeleton className="h-6 w-3/4" />

        <Skeleton className="h-4 w-full" />

        <Skeleton className="h-4 w-2/3" />

        <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">

          <Skeleton className="h-4 w-1/3" />

          <Skeleton className="h-4 w-1/2" />

        </div>

        <Skeleton className="mt-5 h-12 w-full rounded-xl" />

      </div>

    </div>
  );
}

function SkeletonCardGrid({ count = 6, variant = "event" }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

      {Array.from(
        { length: count },
        (_, index) =>
          variant === "gallery" ? (
            <GalleryCardSkeleton
              key={index}
            />
          ) : (
            <EventCardSkeleton
              key={index}
            />
          ),
      )}

    </div>
  );
}

function GalleryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      <Skeleton className="h-52 w-full rounded-none" />

      <div className="space-y-3 p-5">

        <Skeleton className="h-4 w-1/2" />

        <Skeleton className="h-4 w-2/3" />

      </div>

    </div>
  );
}

function RowItemSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">

      {Array.from(
        { length: rows },
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4"
          >

            <Skeleton className="h-14 w-20 rounded-lg" />

            <div className="flex-1 space-y-2">

              <Skeleton className="h-4 w-1/3" />

              <Skeleton className="h-3 w-1/2" />

            </div>

            <Skeleton className="h-8 w-24 rounded-lg" />

          </div>
        ),
      )}

    </div>
  );
}

export {
  EventCardSkeleton,
  GalleryCardSkeleton,
  RowItemSkeleton,
  Skeleton,
  SkeletonCardGrid,
};