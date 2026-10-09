# Hướng dẫn sử dụng Popup Components

Backend đã có các popup components để thay thế `alert()`, `confirm()`, và `prompt()` của browser.

## 1. Toast Notification (Thay thế `alert()`)

### Cách sử dụng:

```tsx
import { useToast } from '../contexts/ToastContext'

function MyComponent() {
  const { success, error, warning, info } = useToast()

  const handleAction = () => {
    // Thay vì: alert('Thành công!')
    success('Thành công!')
    
    // Hoặc:
    error('Có lỗi xảy ra!')
    warning('Cảnh báo!')
    info('Thông tin')
  }
}
```

### Các loại Toast:
- `success(message, duration?)` - Thành công (màu xanh)
- `error(message, duration?)` - Lỗi (màu đỏ)
- `warning(message, duration?)` - Cảnh báo (màu vàng)
- `info(message, duration?)` - Thông tin (màu xanh dương)

## 2. Confirmation Dialog (Thay thế `confirm()`)

### Cách 1: Sử dụng hook `useConfirm`

```tsx
import { useConfirm } from '../hooks/useConfirm'

function MyComponent() {
  const { confirm, ConfirmDialog } = useConfirm()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa item này?',
      variant: 'danger', // 'danger' | 'warning' | 'info'
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    })

    if (confirmed) {
      // Thực hiện xóa
    }
  }

  return (
    <>
      <button onClick={handleDelete}>Xóa</button>
      <ConfirmDialog />
    </>
  )
}
```

### Cách 2: Sử dụng trực tiếp component

```tsx
import { useState } from 'react'
import { ConfirmationDialog } from '../components/ConfirmationDialog'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Xóa</button>
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          // Thực hiện xóa
          setIsOpen(false)
        }}
        message="Bạn có chắc muốn xóa?"
        variant="danger"
      />
    </>
  )
}
```

## 3. Prompt Dialog (Thay thế `prompt()`)

### Cách 1: Sử dụng hook `usePrompt`

```tsx
import { usePrompt } from '../hooks/usePrompt'

function MyComponent() {
  const { prompt, PromptDialog } = usePrompt()

  const handleUpdateQuantity = async () => {
    const value = await prompt({
      title: 'Cập nhật số lượng',
      message: 'Nhập số lượng mới:',
      label: 'Số lượng',
      type: 'number',
      defaultValue: '1',
      validation: (val) => {
        const num = Number(val)
        if (isNaN(num) || num <= 0) {
          return 'Số lượng phải lớn hơn 0'
        }
        return null
      },
    })

    if (value) {
      // Cập nhật số lượng
    }
  }

  return (
    <>
      <button onClick={handleUpdateQuantity}>Sửa số lượng</button>
      <PromptDialog />
    </>
  )
}
```

### Cách 2: Sử dụng trực tiếp component

```tsx
import { useState } from 'react'
import { PromptDialog } from '../components/PromptDialog'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Nhập giá trị</button>
      <PromptDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={(value) => {
          // Xử lý value
          setIsOpen(false)
        }}
        message="Nhập giá trị mới:"
        type="text"
      />
    </>
  )
}
```

## 4. Image Viewer

```tsx
import { useState } from 'react'
import { ImageViewer } from '../components/ImageViewer'

function ProductImages({ images }: { images: string[] }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <>
      <div>
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            onClick={() => {
              setSelectedIndex(index)
              setIsViewerOpen(true)
            }}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>
      <ImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={images}
        initialIndex={selectedIndex}
      />
    </>
  )
}
```

## Ví dụ: Thay thế code cũ

### Trước (dùng alert/confirm/prompt):

```tsx
const handleDelete = () => {
  if (confirm('Bạn có chắc muốn xóa?')) {
    deleteItem()
    alert('Xóa thành công!')
  }
}

const handleUpdate = () => {
  const newValue = prompt('Nhập giá trị mới:', '1')
  if (newValue) {
    updateValue(newValue)
    alert('Cập nhật thành công!')
  }
}
```

### Sau (dùng popup components):

```tsx
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import { usePrompt } from '../hooks/usePrompt'

function MyComponent() {
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { prompt, PromptDialog } = usePrompt()

  const handleDelete = async () => {
    const confirmed = await confirm({
      message: 'Bạn có chắc muốn xóa?',
      variant: 'danger',
    })
    
    if (confirmed) {
      deleteItem()
      success('Xóa thành công!')
    }
  }

  const handleUpdate = async () => {
    const newValue = await prompt({
      message: 'Nhập giá trị mới:',
      defaultValue: '1',
      type: 'number',
    })
    
    if (newValue) {
      updateValue(newValue)
      success('Cập nhật thành công!')
    }
  }

  return (
    <>
      <button onClick={handleDelete}>Xóa</button>
      <button onClick={handleUpdate}>Cập nhật</button>
      <ConfirmDialog />
      <PromptDialog />
    </>
  )
}
```

## Lưu ý

1. **Toast**: Tự động đóng sau 4 giây (có thể tùy chỉnh)
2. **ConfirmationDialog**: Có 3 variant: `danger`, `warning`, `info`
3. **PromptDialog**: Hỗ trợ validation tùy chỉnh
4. **ImageViewer**: Hỗ trợ keyboard navigation (Arrow keys, Escape)


