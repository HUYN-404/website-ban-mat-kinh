import { useEffect, useMemo, useState } from 'react'

import { FILE_BASE_URL } from '../api/client'
import {
  createTryOnSession,
  listCatalogProducts,
  renderTryOnSession,
  uploadTryOnFaceImage,
  type TryOnSession,
} from '../services/tryon.service'

const TryOnPage = () => {
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [session, setSession] = useState<TryOnSession | null>(null)
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCatalogProducts()
      .then((items) => {
        setProducts(items)
        if (items.length > 0) {
          setSelectedProductId(items[0].id)
        }
      })
      .catch(() => setError('Không tải được danh sách sản phẩm thử kính.'))
  }, [])

  const previewFaceUrl = useMemo(() => {
    if (!faceFile) return null
    return URL.createObjectURL(faceFile)
  }, [faceFile])

  const resultImageUrl = useMemo(() => {
    if (!session?.resultImageUrl) return null
    if (session.resultImageUrl.startsWith('/')) {
      return `${FILE_BASE_URL}${session.resultImageUrl}`
    }
    return session.resultImageUrl
  }, [session])

  const handleStartTryOn = async () => {
    if (!faceFile || !selectedProductId) {
      setError('Vui lòng chọn ảnh khuôn mặt và mẫu kính trước khi thử.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const createdSession = await createTryOnSession()
      const uploadedSession = await uploadTryOnFaceImage(createdSession.id, faceFile)
      const renderedSession = await renderTryOnSession(uploadedSession.id, selectedProductId)
      setSession(renderedSession)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể ghép ảnh thử kính.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="mb-10 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
          Virtual Try-On
        </p>
        <h1 className="text-3xl font-semibold text-charcoal">Thử kính online bằng ảnh khuôn mặt</h1>
        <p className="max-w-3xl text-sm text-neutral-600">
          Tải ảnh chân dung rõ mặt, chọn mẫu kính, hệ thống sẽ tự ghép để bạn xem nhanh trước khi
          mua.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal">1) Ảnh khuôn mặt</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFaceFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-charcoal">2) Chọn mẫu kính</label>
            <select
              value={selectedProductId ?? ''}
              onChange={(event) => setSelectedProductId(Number(event.target.value))}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  #{product.id} - {product.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleStartTryOn}
            disabled={loading}
            className="rounded-full bg-charcoal px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : 'Bắt đầu thử kính'}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="grid gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Ảnh gốc
            </h2>
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white">
              {previewFaceUrl ? (
                <img src={previewFaceUrl} alt="Face preview" className="max-h-72 rounded-xl object-contain" />
              ) : (
                <span className="text-sm text-neutral-500">Chưa có ảnh</span>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Ảnh đã ghép kính
            </h2>
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white">
              {resultImageUrl ? (
                <img src={resultImageUrl} alt="Try-on result" className="max-h-72 rounded-xl object-contain" />
              ) : (
                <span className="text-sm text-neutral-500">Kết quả sẽ hiển thị sau khi xử lý</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TryOnPage
