// Lớp Error dùng để trả lỗi HTTP có status code rõ ràng
class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

export default HttpError

