import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { getCollection } from '../api/resources'
import type { Product, Category, Brand, Supplier } from '../types/entities'

interface ProductFormProps {
  product?: Product
  onClose: () => void
  onSuccess?: () => void
}

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    stockQuantity: product?.stockQuantity ?? 0,
    status: product?.status ?? ('available' as 'available' | 'unavailable'),
    categoryId: product?.categoryId ?? null as number | null,
    brandId: product?.brandId ?? null as number | null,
    supplierId: product?.supplierId ?? null as number | null,
    materials: product?.materials ?? [],
    highlights: product?.highlights ?? [],
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCollection<Category>('categories'),
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getCollection<Brand>('brands'),
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getCollection<Supplier>('suppliers'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.post('/products', {
        name: data.name,
        description: data.description || null,
        price: data.price,
        stockQuantity: data.stockQuantity,
        status: data.status,
        categoryId: data.categoryId!,
        brandId: data.brandId!,
        supplierId: data.supplierId!,
        materials: data.materials.length > 0 ? data.materials : null,
        highlights: data.highlights.length > 0 ? data.highlights : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.put(`/products/${product!.id}`, {
        name: data.name,
        description: data.description || null,
        price: data.price,
        stockQuantity: data.stockQuantity,
        status: data.status,
        categoryId: data.categoryId!,
        brandId: data.brandId!,
        supplierId: data.supplierId!,
        materials: data.materials.length > 0 ? data.materials : null,
        highlights: data.highlights.length > 0 ? data.highlights : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId || !formData.brandId || !formData.supplierId) {
      // Note: ProductForm được dùng trong Modal, nên không thể dùng Toast trực tiếp
      // Có thể truyền callback từ parent hoặc dùng window.alert tạm thời
      window.alert('Vui lòng chọn đầy đủ danh mục, thương hiệu và nhà cung cấp')
      return
    }
    // Lọc bỏ các item rỗng trong materials và highlights
    const submitData = {
      ...formData,
      materials: formData.materials.filter((m) => m.trim() !== ''),
      highlights: formData.highlights.filter((h) => h.trim() !== ''),
    }
    if (product) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên sản phẩm *</span>
        <input
          type="text"
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isLoading}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mô tả</span>
        <textarea
          className="input"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          disabled={isLoading}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Giá bán (₫) *</span>
          <input
            type="number"
            className="input"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            min={0}
            step={1000}
            required
            disabled={isLoading}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Số lượng tồn kho</span>
          <input
            type="number"
            className="input"
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
            min={0}
            required
            disabled={isLoading}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Trạng thái *</span>
          <select
            className="select"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as typeof formData.status })
            }
            required
            disabled={isLoading}
          >
            <option value="available">Đang bán</option>
            <option value="unavailable">Ngưng bán</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Danh mục *</span>
          <select
            className="select"
            value={formData.categoryId ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })
            }
            required
            disabled={isLoading}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Thương hiệu *</span>
          <select
            className="select"
            value={formData.brandId ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, brandId: e.target.value ? Number(e.target.value) : null })
            }
            required
            disabled={isLoading}
          >
            <option value="">Chọn thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nhà cung cấp *</span>
          <select
            className="select"
            value={formData.supplierId ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, supplierId: e.target.value ? Number(e.target.value) : null })
            }
            required
            disabled={isLoading}
          >
            <option value="">Chọn nhà cung cấp</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Chất liệu</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {formData.materials.map((material, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                value={material}
                onChange={(e) => {
                  const newMaterials = [...formData.materials]
                  newMaterials[index] = e.target.value
                  setFormData({ ...formData, materials: newMaterials })
                }}
                placeholder="Nhập chất liệu..."
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  const newMaterials = formData.materials.filter((_, i) => i !== index)
                  setFormData({ ...formData, materials: newMaterials })
                }}
                disabled={isLoading}
                style={{ minWidth: 36, padding: 8 }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() => setFormData({ ...formData, materials: [...formData.materials, ''] })}
            disabled={isLoading}
            style={{ alignSelf: 'flex-start' }}
          >
            + Thêm chất liệu
          </button>
        </div>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Điểm nổi bật</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {formData.highlights.map((highlight, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                value={highlight}
                onChange={(e) => {
                  const newHighlights = [...formData.highlights]
                  newHighlights[index] = e.target.value
                  setFormData({ ...formData, highlights: newHighlights })
                }}
                placeholder="Nhập điểm nổi bật..."
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  const newHighlights = formData.highlights.filter((_, i) => i !== index)
                  setFormData({ ...formData, highlights: newHighlights })
                }}
                disabled={isLoading}
                style={{ minWidth: 36, padding: 8 }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() => setFormData({ ...formData, highlights: [...formData.highlights, ''] })}
            disabled={isLoading}
            style={{ alignSelf: 'flex-start' }}
          >
            + Thêm điểm nổi bật
          </button>
        </div>
      </label>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="button secondary" onClick={onClose} disabled={isLoading}>
          Hủy
        </button>
        <button type="submit" className="button primary" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : product ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}


