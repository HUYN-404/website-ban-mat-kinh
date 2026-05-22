import ProductListPage from './ProductListPage'

const AccessoriesPage = () => (
  <ProductListPage
    eyebrow="SeeU Atelier"
    title="Phụ kiện tinh xảo"
    description="Bảo quản kính hoàn hảo với các phụ kiện chế tác thủ công từ da thuộc và tơ tằm cao cấp."
    filter={{ category: 'accessory' }}
  />
)

export default AccessoriesPage

