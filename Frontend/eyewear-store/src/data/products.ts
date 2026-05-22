export type ProductGender = 'men' | 'women' | 'unisex'
export type ProductCategory = 'eyewear' | 'accessory'

export interface Product {
  id: string
  name: string
  price: number
  gender: ProductGender
  category: ProductCategory
  brand: string
  colorway: string
  materials: string[]
  description: string
  highlights: string[]
  images: string[]
  stockQuantity?: number // Số lượng tồn kho (optional để tương thích với dữ liệu cũ)
}

export const products: Product[] = [
  {
    id: 'seeu-aurum-01',
    name: 'SeeU Aurum 01',
    price: 3890000,
    gender: 'women',
    category: 'eyewear',
    brand: 'SeeU Atelier',
    colorway: 'Vanilla Gold',
    materials: ['Titanium cao cấp', 'Mắt kính chống UV400', 'Ốc vít Nhật Bản'],
    description:
      'Thiết kế gọng mắt mèo thanh lịch với phần mạ vàng champagne sang trọng, mang lại vẻ đẹp tinh tế cho mọi phong cách.',
    highlights: [
      'Gọng titanium siêu nhẹ và bền bỉ',
      'Tông màu vàng champagne độc quyền',
      'Phần chân kính ôm sát tạo cảm giác thoải mái',
    ],
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-classic-02',
    name: 'SeeU Classic 02',
    price: 3290000,
    gender: 'men',
    category: 'eyewear',
    brand: 'SeeU Signature',
    colorway: 'Black Onyx',
    materials: ['Acetate Ý cao cấp', 'Bản lề thép không gỉ', 'Tròng chống tia xanh'],
    description:
      'Gọng vuông cổ điển với sắc đen huyền bí, phù hợp cho phong thái lịch lãm của quý ông hiện đại.',
    highlights: [
      'Kiểu dáng vuông góc cạnh nam tính',
      'Đệm mũi điều chỉnh ôm sát khuôn mặt',
      'Tròng kính chống ánh sáng xanh hỗ trợ làm việc',
    ],
    images: [
      'https://images.unsplash.com/photo-1470115636492-6d2b56f9146e?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-atelier-03',
    name: 'SeeU Atelier 03',
    price: 4590000,
    gender: 'women',
    category: 'eyewear',
    brand: 'SeeU Atelier',
    colorway: 'Pearl Rose',
    materials: ['Titanium siêu nhẹ', 'Đệm mũi silicone', 'Tròng phủ AR chống chói'],
    description:
      'Gọng tròn nữ tính với gam hồng phấn và chi tiết kim loại ánh hồng, tạo dấu ấn khác biệt cho phong cách thời thượng.',
    highlights: [
      'Đường nét mảnh mai ôm sát khuôn mặt Á Đông',
      'Tròng kính phủ AR giảm chói trong mọi điều kiện ánh sáng',
      'Thiết kế handmade chế tác tại Nhật',
    ],
    images: [
      'https://images.unsplash.com/photo-1511288598301-985adf607c4b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-heritage-04',
    name: 'SeeU Heritage 04',
    price: 3790000,
    gender: 'men',
    category: 'eyewear',
    brand: 'SeeU Heritage',
    colorway: 'Vintage Havana',
    materials: ['Acetate Nhật Bản', 'Bản lề 5 trục cao cấp', 'Tròng đổi màu thông minh'],
    description:
      'Gọng browline lấy cảm hứng từ phong cách thập niên 60, kết hợp sắc nâu Havana và kim loại vàng đồng.',
    highlights: [
      'Phiên bản giới hạn 300 chiếc',
      'Đổi màu theo cường độ ánh sáng môi trường',
      'Phần gọng trên acetate vân gỗ độc bản',
    ],
    images: [
      'https://images.unsplash.com/photo-1508296695146-257a81406036?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-luxe-05',
    name: 'SeeU Luxe 05',
    price: 4990000,
    gender: 'unisex',
    category: 'eyewear',
    brand: 'SeeU Luxe',
    colorway: 'Matte Champagne',
    materials: ['Thép không gỉ tráng vàng 18K', 'Đệm mũi 3D', 'Tròng ZEISS UV400'],
    description:
      'Thiết kế aviator thanh mảnh được tráng vàng 18K mờ, tái hiện vẻ đẹp cổ điển của những năm 80 với cảm giác đeo nhẹ nhàng.',
    highlights: [
      'Trọng lượng chỉ 18 gram',
      'Chân kính điều chỉnh theo góc khuôn mặt',
      'Phù hợp cho nhiều dáng mặt khác nhau',
    ],
    images: [
      'https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-solaire-06',
    name: 'SeeU Solaire 06',
    price: 2890000,
    gender: 'women',
    category: 'eyewear',
    brand: 'SeeU Soleil',
    colorway: 'Honey Amber',
    materials: ['Acetate sinh học', 'Tròng polarized', 'Bản lề thép mạ vàng'],
    description:
      'Gọng mắt mèo dáng oversize với tông hổ phách ấm áp, là lựa chọn hoàn hảo khi di chuyển và du lịch.',
    highlights: [
      'Tròng polarized giảm chói 99%',
      'Gọng acetate sinh học thân thiện môi trường',
      'Form ôm vừa vặn khuôn mặt nữ châu Á',
    ],
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511288598301-985adf607c4b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-voyage-07',
    name: 'SeeU Voyage 07',
    price: 3490000,
    gender: 'men',
    category: 'eyewear',
    brand: 'SeeU Voyage',
    colorway: 'Deep Navy',
    materials: ['Acetate Ý', 'Bản lề 7 trục', 'Tròng chống trầy HD'],
    description:
      'Gọng chữ nhật bo tròn cùng sắc xanh navy sang trọng, thích hợp cho phong cách business casual.',
    highlights: [
      'Thiết kế thanh lịch dễ phối đồ',
      'Tròng HD chống trầy xước cao',
      'Kết hợp lớp phủ chống bám bụi, bẩn',
    ],
    images: [
      'https://images.unsplash.com/photo-1517704742585-6d3c1ec9e812?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-accessory-01',
    name: 'Hộp da cao cấp SeeU',
    price: 890000,
    gender: 'unisex',
    category: 'accessory',
    brand: 'SeeU Atelier',
    colorway: 'Ivory Sand',
    materials: ['Da Ý thuộc thảo mộc', 'Khóa nam châm ẩn', 'Lót nhung mềm'],
    description:
      'Hộp đựng kính làm từ da thuộc thủ công, giúp bảo vệ và nâng tầm trải nghiệm lưu trữ kính mắt.',
    highlights: [
      'Đường may thủ công tỉ mỉ',
      'Khóa nam châm ẩn chắc chắn',
      'Kích thước phù hợp mọi dáng kính',
    ],
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-accessory-02',
    name: 'Dây đeo kính Golden Silk',
    price: 590000,
    gender: 'unisex',
    category: 'accessory',
    brand: 'SeeU Signature',
    colorway: 'Golden Silk',
    materials: ['Tơ tằm nhuộm thủ công', 'Khóa thép mạ vàng', 'Đầu silicon mềm'],
    description:
      'Dây đeo kính làm từ lụa tơ tằm dệt dọc, mang lại dấu ấn tinh tế cho mọi phong cách.',
    highlights: [
      'Được nhuộm màu tự nhiên tại Hội An',
      'Thiết kế unisex phù hợp mọi giới tính',
      'Khóa mạ vàng chống oxi hóa',
    ],
    images: [
      'https://images.unsplash.com/photo-1563003725-2028cc037164?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1600&q=80',
    ],
  },
  {
    id: 'seeu-atelier-08',
    name: 'SeeU Atelier 08',
    price: 4290000,
    gender: 'women',
    category: 'eyewear',
    brand: 'SeeU Atelier',
    colorway: 'Ivory Pearl',
    materials: ['Titanium phủ gốm', 'Tròng đổi màu PhotoFusion', 'Đệm mũi khảm ngọc trai nhân tạo'],
    description:
      'Gọng đa giác mềm mại với sắc trắng ngà độc đáo, kết hợp tròng đổi màu thông minh cho lối sống năng động.',
    highlights: [
      'Kỹ thuật phủ gốm chống trầy xước',
      'Tròng PhotoFusion đổi màu chỉ sau 15 giây',
      'Thiết kế độc quyền từ SeeU Design Lab',
    ],
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511288598301-985adf607c4b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=80',
    ],
  },
]

export const getProductById = (productId: string): Product | undefined =>
  products.find((product) => product.id === productId)

