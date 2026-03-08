import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, 
  Send,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: number
  content: string
  senderId: number
  senderType: string
  createdAt: string
  isRead: boolean
}

interface Conversation {
  id: number
  companyName: string
  lastMessageAt: string
  unreadCount: number
}

export default function ClientMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    try {
      const res = await api.get('/client/conversations')
      const convos = res.conversations || []
      setConversations(convos)
      if (convos.length > 0 && !selectedConversation) {
        setSelectedConversation(convos[0].id)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(conversationId: number) {
    try {
      const res = await api.get(`/client/conversations/${conversationId}/messages`)
      setMessages(res.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      await api.post(`/client/conversations/${selectedConversation}/messages`, {
        content: newMessage.trim()
      })
      setNewMessage('')
      await loadMessages(selectedConversation)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Chat with your cleaning company</p>
        </div>
        <div className="bg-white shadow-sm p-16 text-center">
          <div className="h-16 w-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No messages yet</h3>
          <p className="text-slate-500">Messages from your cleaning company will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Messages</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Chat with your cleaning company</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-300px)] min-h-[400px]">
        <div className="lg:col-span-1 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversations</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConversation(convo.id)}
                className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedConversation === convo.id ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{convo.companyName}</span>
                  {convo.unreadCount > 0 && (
                    <span className="bg-teal-600 text-white text-xs font-bold px-2 py-1">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {convo.lastMessageAt 
                    ? format(new Date(convo.lastMessageAt), 'MMM d, h:mm a')
                    : 'No messages'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                No messages in this conversation
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderType === 'client'
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-9 w-9 flex items-center justify-center flex-shrink-0 ${
                        isOwn ? 'bg-teal-600' : 'bg-slate-200'
                      }`}>
                        <User className={`h-4 w-4 ${isOwn ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <div className={`px-4 py-3 ${
                          isOwn 
                            ? 'bg-teal-600 text-white' 
                            : 'bg-white text-slate-900 shadow-sm'
                        }`}>
                          {message.content}
                        </div>
                        <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {format(new Date(message.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="h-12 w-12 bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
