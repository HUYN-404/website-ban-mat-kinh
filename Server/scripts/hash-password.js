import bcrypt from 'bcryptjs'

const password = process.argv[2] || 'password123'

bcrypt.hash(password, 10).then((hash) => {
  console.log('\n=== Password Hash Generator ===')
  console.log(`Password: ${password}`)
  console.log(`Hash: ${hash}\n`)
  console.log('SQL để update:')
  console.log(`UPDATE Users SET password = '${hash}' WHERE username = 'seeu.admin';\n`)
  console.log('Hoặc cho cả 2 users:')
  console.log(`UPDATE Users SET password = '${hash}' WHERE username IN ('seeu.admin', 'seeu.ngocanh');\n`)
})

