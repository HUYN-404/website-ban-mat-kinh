import HttpError from '../utils/httpError.js'
import type { Brand, CreateBrandPayload, UpdateBrandPayload } from '../types/brand.js'
import {
  countProductsByBrandId,
  createBrand as createBrandRepository,
  deleteBrand,
  findAllBrands,
  findBrandById,
  findBrandByName,
  updateBrand as updateBrandRepository,
} from '../repositories/brands.repository.js'

// Nghiệp vụ quản lý thương hiệu

const ensureBrandExist = async (brandId: number): Promise<Brand> => {
  const brand = await findBrandById(brandId)
  if (!brand) {
    throw new HttpError(404, 'Thương hiệu không tồn tại.')
  }
  return brand
}

const assertUniqueName = async (name: string, brandId?: number) => {
  const existing = await findBrandByName(name)
  if (existing && existing.id !== brandId) {
    throw new HttpError(409, 'Tên thương hiệu đã tồn tại.')
  }
}

export const listBrands = async (): Promise<Brand[]> => {
  return findAllBrands()
}

export const getBrand = async (brandId: number): Promise<Brand> => {
  return ensureBrandExist(brandId)
}

export const createBrand = async (payload: CreateBrandPayload): Promise<Brand> => {
  await assertUniqueName(payload.name)
  const newBrandId = await createBrandRepository(payload)
  const brand = await findBrandById(newBrandId)
  if (!brand) {
    throw new HttpError(500, 'Không thể lấy thông tin thương hiệu vừa tạo.')
  }
  return brand
}

export const updateBrand = async (
  brandId: number,
  payload: UpdateBrandPayload,
): Promise<Brand> => {
  const brand = await ensureBrandExist(brandId)

  if (payload.name) {
    await assertUniqueName(payload.name, brand.id)
  }

  const updated = await updateBrandRepository(brandId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật thương hiệu.')
  }

  return ensureBrandExist(brandId)
}

export const removeBrand = async (brandId: number): Promise<void> => {
  await ensureBrandExist(brandId)

  const productCount = await countProductsByBrandId(brandId)
  if (productCount > 0) {
    throw new HttpError(409, 'Không thể xóa vì thương hiệu đang được sản phẩm sử dụng.')
  }

  const deleted = await deleteBrand(brandId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa thương hiệu.')
  }
}


