/**
 * Khung xương (skeleton) hiển thị trong lúc tải danh sách sản phẩm.
 * Dùng cùng tỉ lệ với ProductCard để tránh "nhảy" layout khi dữ liệu về.
 */
const ProductCardSkeleton = () => {
  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm shadow-black/5">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-alabaster">
        <div className="shimmer-sweep h-full w-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-neutral-200" />
        <div className="h-3 w-1/3 rounded-full bg-neutral-100" />
        <div className="h-3 w-full rounded-full bg-neutral-100" />
        <div className="flex items-center justify-between pt-4">
          <div className="h-5 w-24 rounded-full bg-neutral-200" />
          <div className="h-9 w-32 rounded-full bg-neutral-100" />
        </div>
      </div>
    </article>
  )
}

export default ProductCardSkeleton
