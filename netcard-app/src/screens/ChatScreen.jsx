import { ArrowLeft, Phone, Video, Paperclip, Send, FileText, Download, X, Image, File } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const INITIAL_MESSAGES = [
  { id: 1, from: 'them', type: 'text', content: 'Hey! Great meeting you at TechConnect today 👋', time: '2:10 PM' },
  { id: 2, from: 'me', type: 'text', content: 'You too Sarah! Really enjoyed our chat about API integrations.', time: '2:12 PM' },
  { id: 3, from: 'them', type: 'text', content: "Absolutely! I'd love to see the pricing deck when you get a chance.", time: '2:13 PM' },
  {
    id: 4, from: 'me', type: 'file',
    fileName: 'API_Pricing_Deck_2025.pdf', fileSize: '2.4 MB', fileType: 'application/pdf',
    time: '2:15 PM',
  },
  { id: 5, from: 'me', type: 'text', content: 'Just sent over the deck! Let me know what you think.', time: '2:15 PM' },
  {
    id: 6, from: 'them', type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80',
    caption: 'Our current stack for reference', time: '2:18 PM',
  },
  { id: 7, from: 'them', type: 'text', content: "That pricing deck looks great, let's hop on a call!", time: '2:20 PM' },
]

function FileAttachment({ fileName, fileSize, fileType, fromMe }) {
  const isImage = fileType?.startsWith('image/')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: fromMe ? 'rgba(255,255,255,0.15)' : 'var(--elevated)',
      borderRadius: 12, padding: '10px 12px', minWidth: 180, maxWidth: 220,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: fromMe ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileText size={18} color={fromMe ? '#fff' : 'var(--indigo)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: fromMe ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
          {fileName}
        </p>
        <p style={{ fontSize: 10, color: fromMe ? 'rgba(255,255,255,0.65)' : 'var(--text-secondary)' }}>{fileSize}</p>
      </div>
      <Download size={14} color={fromMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'} />
    </div>
  )
}

function AttachMenu({ onClose, onSelectFile, onSelectImage }) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
      padding: 8, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 100, minWidth: 160,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      <button
        onClick={() => { onSelectImage(); onClose() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
          borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          fontSize: 13, color: 'var(--text-primary)', textAlign: 'left',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(50,213,131,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image size={16} color="var(--green)" />
        </div>
        Photo / Image
      </button>
      <button
        onClick={() => { onSelectFile(); onClose() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
          borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          fontSize: 13, color: 'var(--text-primary)', textAlign: 'left',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <File size={16} color="var(--indigo)" />
        </div>
        Document / File
      </button>
    </div>
  )
}

/**
 * @component ChatScreen
 * @description Real-time messaging interface for 1:1 direct conversations.
 * Supports text, images, and file attachments with auto-scrolling and typing simulation.
 */
export default function ChatScreen({ navigate, contact }) {
  const c = contact || {
    initials: 'SR', grad: 'grad-purple',
    name: 'Sarah Raines', role: 'Product Manager · Stripe',
    isOnline: true,
  }

  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [text, setText] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now(), ...msg }])
  }

  const sendText = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    addMessage({ from: 'me', type: 'text', content: trimmed, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
    setText('')
    // Simulate reply after 1.5s
    setTimeout(() => {
      addMessage({ from: 'them', type: 'text', content: "Got it! I'll follow up shortly 👍", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
    }, 1500)
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    // Simulate upload delay
    setTimeout(() => {
      if (type === 'image') {
        const url = URL.createObjectURL(file)
        addMessage({ from: 'me', type: 'image', imageUrl: url, caption: file.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
      } else {
        addMessage({
          from: 'me', type: 'file',
          fileName: file.name,
          fileSize: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
          fileType: file.type,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }
      setIsUploading(false)
    }, 800)
    e.target.value = ''
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'image')} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'file')} />

      {/* Status bar */}
      <div className="status-bar" style={{ flexShrink: 0 }}>
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
            <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
            <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
            <rect x="9" y="0" width="3" height="12" rx="1" opacity="0.8"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <button className="icon-btn" onClick={() => navigate('chatList')}>
          <ArrowLeft size={20} />
        </button>
        {/* Contact info */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div className={`avatar ${c.grad}`} style={{ width: 36, height: 36, fontSize: 11, color: c.textDark ? '#0B0B0E' : '#fff' }}>
            {c.initials}
          </div>
          {c.isOnline && (
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
          <div style={{ fontSize: 11, color: c.isOnline ? 'var(--green)' : 'var(--text-tertiary)' }}>
            {c.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <button className="icon-btn" onClick={() => window.open(`tel:${c.phone || '+14155552671'}`, '_self')}>
          <Phone size={18} />
        </button>
        <button className="icon-btn">
          <Video size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }} onClick={() => setShowAttach(false)}>
        {messages.map((msg, i) => {
          const fromMe = msg.from === 'me'
          const showTime = i === 0 || messages[i-1].time !== msg.time || messages[i-1].from !== msg.from
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: fromMe ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              {/* Bubble */}
              <div style={{ maxWidth: '78%' }}>
                {msg.type === 'text' && (
                  <div style={{
                    background: fromMe ? 'var(--indigo)' : 'var(--card)',
                    borderRadius: fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    border: fromMe ? 'none' : '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: 13, color: fromMe ? '#fff' : 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                      {msg.content}
                    </p>
                  </div>
                )}
                {msg.type === 'image' && (
                  <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={msg.imageUrl} alt={msg.caption} style={{ display: 'block', width: '100%', maxWidth: 220, height: 140, objectFit: 'cover' }} />
                    {msg.caption && (
                      <div style={{ background: fromMe ? 'var(--indigo)' : 'var(--card)', padding: '6px 12px' }}>
                        <p style={{ fontSize: 11, color: fromMe ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', margin: 0 }}>{msg.caption}</p>
                      </div>
                    )}
                  </div>
                )}
                {msg.type === 'file' && (
                  <div style={{ borderRadius: '18px', overflow: 'hidden', background: fromMe ? 'var(--indigo)' : 'var(--card)', border: fromMe ? 'none' : '1px solid var(--border)', padding: 12 }}>
                    <FileAttachment {...msg} fromMe={fromMe} />
                  </div>
                )}
              </div>
              {/* Timestamp */}
              {showTime && (
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, marginLeft: fromMe ? 0 : 4, marginRight: fromMe ? 4 : 0 }}>
                  {msg.time}
                </span>
              )}
            </div>
          )
        })}
        {isUploading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <div style={{ background: 'var(--card)', borderRadius: 18, padding: '10px 16px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Uploading…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: '10px 12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', position: 'relative' }}>
        {showAttach && (
          <AttachMenu
            onClose={() => setShowAttach(false)}
            onSelectImage={() => imageInputRef.current?.click()}
            onSelectFile={() => fileInputRef.current?.click()}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {/* Attach */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowAttach(v => !v) }}
            style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: showAttach ? 'var(--indigo)' : 'var(--card)',
              border: '1px solid var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            {showAttach
              ? <X size={16} color="#fff" />
              : <Paperclip size={16} color="var(--text-secondary)" />
            }
          </button>

          {/* Text input */}
          <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
              placeholder="Write a message..."
              rows={1}
              style={{
                width: '100%', background: 'none', border: 'none', outline: 'none',
                resize: 'none', fontSize: 13, color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)', lineHeight: 1.4, overflow: 'hidden',
              }}
            />
          </div>

          {/* Send */}
          <button
            onClick={sendText}
            disabled={!text.trim()}
            style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: text.trim() ? 'var(--indigo)' : 'var(--elevated)',
              border: 'none', cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Send size={15} color={text.trim() ? '#fff' : 'var(--text-tertiary)'} style={{ transform: 'translateX(1px)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
