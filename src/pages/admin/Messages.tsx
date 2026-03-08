import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { MessageSquare, Send, ArrowLeft, Users, ChevronRight, Lightbulb } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.client.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadConversations() {
    try {
      const data = await api.get<{ conversations: any[] }>('/messages/conversations')
      setConversations(data.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(clientId: number) {
    try {
      const data = await api.get<{ conversation: any; messages: any[] }>(`/messages/conversations/${clientId}`)
      setMessages(data.messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      await api.post(`/messages/conversations/${selectedConversation.client.id}/messages`, {
        content: newMessage,
      })
      setNewMessage('')
      loadMessages(selectedConversation.client.id)
      loadConversations()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const unreadCount = conversations.reduce((sum, c) => sum + (c.conversation.unreadCountCompany || 0), 0)

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Client Messaging</h1>
            </div>
            <p className="text-indigo-100 max-w-xl">
              Communicate directly with your clients through the in-app messaging system. 
              Keep all conversations organized and respond promptly to maintain great relationships.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Users className="h-5 w-5" />
              <span className="text-sm font-bold">{conversations.length} conversations</span>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-pink-500/40 backdrop-blur-sm rounded-xl">
                <span className="text-sm font-bold">{unreadCount} unread</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[calc(100vh-320px)] min-h-[450px] flex flex-col sm:flex-row overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 lg:w-80 border-r border-slate-100 flex-col`}>
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">No conversations yet</h3>
                <p className="text-sm text-slate-500">Conversations with clients will appear here</p>
              </div>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.conversation.id}
                  onClick={() => setSelectedConversation(convo)}
                  className={`w-full p-4 text-left hover:bg-slate-50 border-b border-slate-100 transition-all ${
                    selectedConversation?.conversation.id === convo.conversation.id
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                      : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-11 w-11 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold">
                        {convo.clientUser?.firstName?.[0]}{convo.clientUser?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {convo.clientUser?.firstName} {convo.clientUser?.lastName}
                        </p>
                        {convo.conversation.unreadCountCompany > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                            {convo.conversation.unreadCountCompany}
                          </span>
                        )}
                      </div>
                      {convo.lastMessage && (
                        <p className="text-sm text-slate-500 truncate">
                          {convo.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`${selectedConversation ? 'flex' : 'hidden sm:flex'} flex-1 flex-col`}>
          {selectedConversation ? (
            <>
              <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="sm:hidden mr-3 p-1 hover:bg-slate-200 rounded"
                  >
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                  </button>
                  <div className="h-10 w-10 sm:h-11 sm:w-11 bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-bold text-sm sm:text-base">
                      {selectedConversation.clientUser?.firstName?.[0]}
                      {selectedConversation.clientUser?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {selectedConversation.clientUser?.firstName} {selectedConversation.clientUser?.lastName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{selectedConversation.clientUser?.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {messages.map((msg) => (
                  <div
                    key={msg.message.id}
                    className={`flex ${msg.message.senderType === 'company' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 ${
                        msg.message.senderType === 'company'
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-slate-900 shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.message.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.message.senderType === 'company' ? 'text-teal-200' : 'text-slate-400'
                      }`}>
                        {format(new Date(msg.message.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-500 font-medium">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Lightbulb className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Messaging Best Practices</h3>
            <p className="text-slate-400 text-sm mb-4">
              Build stronger client relationships with effective communication.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-indigo-400" />
                <span><strong>Respond promptly:</strong> Quick replies build trust and show professionalism</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-indigo-400" />
                <span><strong>Keep it professional:</strong> Friendly but business-appropriate tone works best</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-indigo-400" />
                <span><strong>Confirm details:</strong> Use messages to verify appointments and special requests</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-indigo-400" />
                <span><strong>All in one place:</strong> Message history is saved and searchable for easy reference</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
