import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env từ thư mục gốc của Server
const envPath = join(__dirname, '../.env')
dotenv.config({ path: envPath })

const HASH_ROUNDS = 10

// Thông tin user staff mặc định
const staffUser = {
  username: 'staff',
  password: 'staff123', // Password mặc định - nên đổi sau khi đăng nhập
  fullName: 'Nhân viên',
  email: 'staff@seeu.com',
  phone: '0123456789',
  address: null,
  roleName: 'staff', // Tên role
  status: 'active',
}

async function createStaffUser() {
  let connection

  try {
    // Kết nối database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'shop-ban-kinh-mat',
    })

    console.log('✅ Đã kết nối database\n')

    // 1. Kiểm tra và tạo role "staff" nếu chưa có
    console.log('📋 Kiểm tra role "staff"...')
    const [roleRows] = await connection.execute(
      `SELECT role_id FROM roles WHERE role_name = ?`,
      [staffUser.roleName]
    )

    let roleId
    if (roleRows.length === 0) {
      console.log('   → Role "staff" chưa tồn tại, đang tạo...')
      const [roleResult] = await connection.execute(
        `INSERT INTO roles (role_name, description) VALUES (?, ?)`,
        [
          staffUser.roleName,
          'Nhân viên - Quyền truy cập: Quản lý sản phẩm, Quản lý đơn hàng, Quản lý kho hàng, Thống kê',
        ]
      )
      roleId = roleResult.insertId
      console.log(`   ✅ Đã tạo role "staff" với ID: ${roleId}\n`)
    } else {
      roleId = roleRows[0].role_id
      console.log(`   ✅ Role "staff" đã tồn tại với ID: ${roleId}\n`)
    }

    // 2. Kiểm tra user đã tồn tại chưa
    console.log(`👤 Kiểm tra user "${staffUser.username}"...`)
    const [userRows] = await connection.execute(
      `SELECT user_id FROM users WHERE username = ?`,
      [staffUser.username]
    )

    if (userRows.length > 0) {
      console.log(`   ⚠️  User "${staffUser.username}" đã tồn tại với ID: ${userRows[0].user_id}`)
      console.log('   → Bỏ qua việc tạo user mới\n')
      return
    }

    // 3. Hash password
    console.log('🔐 Đang hash password...')
    const hashedPassword = await bcrypt.hash(staffUser.password, HASH_ROUNDS)
    console.log('   ✅ Đã hash password\n')

    // 4. Tạo user
    console.log('👤 Đang tạo user...')
    const [result] = await connection.execute(
      `INSERT INTO users 
        (username, password, full_name, email, phone, address, status, role_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffUser.username,
        hashedPassword,
        staffUser.fullName,
        staffUser.email,
        staffUser.phone,
        staffUser.address,
        staffUser.status,
        roleId,
      ]
    )

    const userId = result.insertId
    console.log(`   ✅ Đã tạo user với ID: ${userId}\n`)

    // 5. Hiển thị thông tin
    console.log('='.repeat(50))
    console.log('✅ HOÀN TẤT! User staff đã được tạo thành công\n')
    console.log('📋 Thông tin đăng nhập:')
    console.log(`   Username: ${staffUser.username}`)
    console.log(`   Password: ${staffUser.password}`)
    console.log(`   Full Name: ${staffUser.fullName}`)
    console.log(`   Email: ${staffUser.email}`)
    console.log(`   Role: ${staffUser.roleName}`)
    console.log(`   Status: ${staffUser.status}`)
    console.log('='.repeat(50))
    console.log('\n⚠️  LƯU Ý: Vui lòng đổi password sau khi đăng nhập!\n')
  } catch (error) {
    console.error('❌ Lỗi:', error.message)
    if (error.code) {
      console.error('   Code:', error.code)
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('✅ Đã đóng kết nối database')
    }
  }
}

// Chạy script
createStaffUser()

