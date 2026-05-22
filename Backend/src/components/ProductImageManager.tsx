import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import apiClient from '../api/client'
import { API_BASE_URL, API_V2_BASE_URL, USE_API_V2_CATALOG, resolveFileUrl } from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { ProductImage } from '../types/entities'

interface ProductImageManagerProps {
  productId: number
}

export function ProductImageManager({ productId }: ProductImageManagerProps) {
  const queryClient = useQueryClient()
  const { success, error: showError, warning } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const MAX_FILES = 8

  // Lấy danh sách ảnh của sản phẩm
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ProductImage[] }>(
        `/products/${productId}/images`,
      )
      return response.data.data
    },
  })

  // Mutation xóa ảnh
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await apiClient.delete(`/products/${productId}/images/${imageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
    },
  })

  // Xử lý upload nhiều ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Kiểm tra số lượng file
    if (files.length > MAX_FILES) {
      warning(`Chỉ có thể upload tối đa ${MAX_FILES} ảnh mỗi lần. Bạn đã chọn ${files.length} ảnh.`)
      e.target.value = ''
      return
    }

    // Kiểm tra loại file và kích thước
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
    const invalidFiles: string[] = []
    const tooLargeFiles: string[] = []

    files.forEach((file) => {
      const fileType = file.type.toLowerCase()
      if (!allowedImageTypes.includes(fileType)) {
        invalidFiles.push(file.name)
      }
      if (file.size > 5 * 1024 * 1024) {
        tooLargeFiles.push(file.name)
      }
    })

    if (invalidFiles.length > 0) {
      showError(`Các file sau không phải là ảnh hợp lệ: ${invalidFiles.join(', ')}. Chỉ chấp nhận: jpeg, jpg, png, gif, webp, avif`)
      e.target.value = ''
      return
    }

    if (tooLargeFiles.length > 0) {
      showError(`Các file sau vượt quá 5MB: ${tooLargeFiles.join(', ')}`)
      e.target.value = ''
      return
    }

    setUploading(true)
    setUploadProgress({})

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    // Upload từng file một
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileKey = `${file.name}-${i}`

      try {
        setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }))

        // Bước 1: Upload file lên server
        const formData = new FormData()
        formData.append('image', file)

        const uploadBase = USE_API_V2_CATALOG ? API_V2_BASE_URL : API_BASE_URL
        const uploadResponse = await fetch(`${uploadBase}/upload`, {
          method: 'POST',
          body: formData,
        })

        setUploadProgress((prev) => ({ ...prev, [fileKey]: 50 }))

        if (!uploadResponse.ok) {
          let errorMessage = `Upload thất bại (${uploadResponse.status}: ${uploadResponse.statusText})`
          try {
            const errorData = await uploadResponse.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // Nếu không parse được JSON, dùng status text
          }
          throw new Error(errorMessage)
        }

        const uploadData = await uploadResponse.json()
        const imageUrl = uploadData.data?.imageUrl

        if (!imageUrl) {
          throw new Error('Server không trả về đường dẫn ảnh')
        }

        setUploadProgress((prev) => ({ ...prev, [fileKey]: 75 }))

        // Bước 2: Lưu URL vào database
        await apiClient.post(`/products/${productId}/images`, {
          productId,
          imageUrl,
        })

        setUploadProgress((prev) => ({ ...prev, [fileKey]: 100 }))
        successCount++
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Upload thất bại'
        errors.push(`${file.name}: ${errorMessage}`)
        failCount++
        setUploadProgress((prev) => ({ ...prev, [fileKey]: -1 })) // -1 để đánh dấu lỗi
      }
    }

    // Refresh danh sách ảnh
    queryClient.invalidateQueries({ queryKey: ['product-images', productId] })

    // Hiển thị kết quả
    if (successCount > 0 && failCount === 0) {
      success(`Upload thành công ${successCount} ảnh!`)
    } else if (successCount > 0 && failCount > 0) {
      warning(`Upload thành công ${successCount} ảnh. Có ${failCount} ảnh lỗi: ${errors.join(', ')}`)
    } else {
      showError(`Upload thất bại tất cả ${failCount} ảnh: ${errors.join(', ')}`)
    }

    setUploading(false)
    setUploadProgress({})
    // Reset input
    e.target.value = ''
  }

  const handleDelete = async (imageId: number) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa ảnh này?',
      variant: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    })
    if (confirmed) {
      deleteMutation.mutate(imageId)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Ảnh sản phẩm</h3>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <Upload size={16} />
          {uploading ? 'Đang upload...' : `Thêm ảnh (tối đa ${MAX_FILES})`}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Hiển thị progress upload nếu đang upload */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>
            Đang upload ảnh...
          </div>
          {Object.entries(uploadProgress).map(([fileKey, progress]) => (
            <div key={fileKey} style={{ marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {fileKey.split('-').slice(0, -1).join('-')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {progress === -1 ? '❌ Lỗi' : progress === 100 ? '✅ Hoàn thành' : `${progress}%`}
                </span>
              </div>
              {progress >= 0 && progress < 100 && (
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--border)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tải...
        </div>
      ) : images.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            border: '2px dashed var(--border)',
            borderRadius: '8px',
            color: 'var(--muted)',
          }}
        >
          <ImageIcon size={48} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p>Chưa có ảnh nào. Hãy thêm ảnh cho sản phẩm.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 16,
          }}
        >
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <img
                src={resolveFileUrl(image.imageUrl)}
                alt={`Product image ${image.id}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  // Fallback nếu ảnh không load được
                  ;(e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/150?text=Image+Error'
                }}
              />
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                disabled={deleteMutation.isPending}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'
                }}
                title="Xóa ảnh"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  )
}


