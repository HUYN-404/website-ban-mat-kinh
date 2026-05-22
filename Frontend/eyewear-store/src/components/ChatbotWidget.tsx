import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FiMessageCircle, FiMinus, FiSend, FiX } from 'react-icons/fi'

import { sendChatbotMessage, type ChatbotProduct } from '../services/chatbot.service'

type ChatMessage = {
  id: string
  role: 'bot' | 'user'
  text: string
  products?: ChatbotProduct[]
  suggestions?: string[]
}

const starterSuggestions = ['Tư vấn theo khuôn mặt', 'Kính mát đi nắng', 'Kính dưới 2 triệu']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Xin chào, mình là trợ lý tư vấn kính của SeeU. Bạn cần tìm kính theo khuôn mặt, tầm giá hay thương hiệu nào?',
      suggestions: starterSuggestions,
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isOpen, messages])

  const submitMessage = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || isSending) return

    setInput('')
    setIsSending(true)
    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: 'user',
        text: trimmed,
      },
    ])

    try {
      const response = await sendChatbotMessage(trimmed)
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'bot',
          text: response.reply,
          products: response.products,
          suggestions: response.suggestions,
        },
      ])
    } catch (error) {
      console.error('Chatbot error:', error)
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'bot',
          text: 'Hiện mình chưa kết nối được hệ thống tư vấn. Bạn thử lại sau ít phút hoặc vào trang sản phẩm để xem các mẫu đang có nhé.',
          suggestions: starterSuggestions,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitMessage(input)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <section className="mb-4 flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-stone-200 bg-charcoal px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">SeeU Chatbot</p>
              <p className="text-xs text-white/70">Tư vấn kính và gợi ý sản phẩm</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Thu nhỏ chatbot"
            >
              <FiMinus aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-stone-50 px-4 py-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-charcoal text-white'
                      : 'border border-stone-200 bg-white text-stone-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>

                  {!!message.products?.length && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-md border border-stone-200 bg-stone-50 p-3 transition hover:border-gold-500 hover:bg-white"
                        >
                          <span className="block text-sm font-semibold text-charcoal">{product.name}</span>
                          <span className="mt-1 block text-xs text-stone-500">
                            {product.brandName ?? 'SeeU'} · {product.categoryName ?? 'Kính'}
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-gold-600">
                            {formatCurrency(product.price)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {message.role === 'bot' && !!message.suggestions?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void submitMessage(suggestion)}
                          disabled={isSending}
                          className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-700 transition hover:border-gold-500 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 shadow-sm">
                  Đang tìm câu trả lời...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-stone-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập câu hỏi về kính..."
              className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-charcoal"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-charcoal text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              aria-label="Gửi tin nhắn"
            >
              <FiSend aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-white shadow-xl transition hover:bg-stone-800"
        aria-label={isOpen ? 'Đóng chatbot' : 'Mở chatbot'}
      >
        {isOpen ? <FiX className="h-6 w-6" aria-hidden="true" /> : <FiMessageCircle className="h-6 w-6" aria-hidden="true" />}
      </button>
    </div>
  )
}

export default ChatbotWidget
