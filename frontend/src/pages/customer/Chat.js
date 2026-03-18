import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

export default function CustomerChat() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const endRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('joinRoom', user?.id);
    socketRef.current.on('receiveMessage', (data) => {
      if (data.customerId === user?.id) fetchMessages(data.ticketId);
    });
    fetchTickets();
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchTickets = async () => {
    try { const res = await api.get('/support/tickets/my'); setTickets(res.data.tickets); }
    catch { toast.error('Failed to load tickets'); }
  };

  const fetchMessages = async (ticketId) => {
    try { const res = await api.get(`/support/tickets/${ticketId}/messages`); setMessages(res.data.messages); }
    catch { toast.error('Failed to load messages'); }
  };

  const handleSelectTicket = (ticket) => { setSelectedTicket(ticket); fetchMessages(ticket.ticketId); };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return toast.error('Enter a subject');
    setCreatingTicket(true);
    try {
      const res = await api.post('/support/tickets', { subject: newSubject });
      setNewSubject('');
      fetchTickets();
      handleSelectTicket(res.data.ticket);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreatingTicket(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await api.post(`/support/tickets/${selectedTicket.ticketId}/messages`, { message: input.trim() });
      setInput('');
      fetchMessages(selectedTicket.ticketId);
      socketRef.current?.emit('sendMessage', { ticketId: selectedTicket.ticketId, customerId: user?.id });
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const statusBadge = s => s === 'OPEN' ? 'badge-warning' : s === 'IN_PROGRESS' ? 'badge-info' : 'badge-success';

  return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content">
        <div className="page-header"><h2>Chat Support</h2><p>Raise a ticket and chat with our support team</p></div>
        <div style={cs.container}>
          {/* Sidebar */}
          <div style={cs.side}>
            <div style={cs.sideHead}>My Tickets</div>
            <form onSubmit={handleCreateTicket} style={{ padding: '12px 14px', borderBottom: '1px solid #dde3f0' }}>
              <input type="text" placeholder="New ticket subject..." value={newSubject} onChange={e => setNewSubject(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde3f0', borderRadius: '6px', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={creatingTicket}>{creatingTicket ? '...' : '+ New Ticket'}</button>
            </form>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {tickets.length === 0 ? <div style={{ padding: '20px', color: '#7a8099', fontSize: '13px', textAlign: 'center' }}>No tickets yet</div> : tickets.map(t => (
                <div key={t.ticketId} onClick={() => handleSelectTicket(t)}
                  style={{ ...cs.ticketItem, background: selectedTicket?.ticketId === t.ticketId ? '#e8eefa' : 'transparent' }}>
                  <div style={{ fontWeight: '500', fontSize: '13px', color: '#1a1f2e', marginBottom: '4px' }}>{t.subject}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#7a8099' }}>{t.ticketId}</span>
                    <span className={`badge ${statusBadge(t.status)}`} style={{ fontSize: '10px' }}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main chat */}
          <div style={cs.main}>
            {!selectedTicket ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8099', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '32px' }}>💬</div>
                <p>Select a ticket or create a new one</p>
              </div>
            ) : (
              <>
                <div style={cs.mainHead}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{selectedTicket.subject}</div>
                    <div style={{ fontSize: '12px', color: '#7a8099' }}>{selectedTicket.ticketId}</div>
                  </div>
                  <span className={`badge ${statusBadge(selectedTicket.status)}`}>{selectedTicket.status}</span>
                </div>
                <div style={cs.messages}>
                  {messages.length === 0 && <div style={{ textAlign: 'center', color: '#7a8099', fontSize: '14px', padding: '32px' }}>No messages yet. Send a message below.</div>}
                  {messages.map(msg => {
                    const fromAdmin = msg.senderType === 'ADMIN';
                    return (
                      <div key={msg.messageId} style={{ display: 'flex', justifyContent: fromAdmin ? 'flex-start' : 'flex-end', marginBottom: '12px' }}>
                        {fromAdmin && <div style={cs.adminAvatar}>MB</div>}
                        <div style={{ maxWidth: '65%', padding: '10px 14px', borderRadius: fromAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: fromAdmin ? '#f4f6fb' : '#1e4db7', color: fromAdmin ? '#1a1f2e' : 'white', fontSize: '14px', lineHeight: '1.5' }}>
                          {msg.message}
                          <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        {!fromAdmin && <div style={cs.userAvatar}>{user?.name?.charAt(0)}</div>}
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <form onSubmit={handleSend} style={cs.inputArea}>
                  <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={cs.input} disabled={sending || selectedTicket.status === 'RESOLVED'} />
                  <button type="submit" className="btn btn-primary" disabled={sending || !input.trim() || selectedTicket.status === 'RESOLVED'}>{sending ? '...' : 'Send'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const cs = {
  container: { display: 'flex', background: 'white', borderRadius: '10px', border: '1px solid #dde3f0', height: '580px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,31,61,0.08)' },
  side: { width: '280px', borderRight: '1px solid #dde3f0', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideHead: { padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #dde3f0' },
  ticketItem: { padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f2f8', transition: 'background 0.15s' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  mainHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #dde3f0', background: '#fafbfe' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' },
  inputArea: { display: 'flex', gap: '10px', padding: '14px 20px', borderTop: '1px solid #dde3f0' },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #dde3f0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  adminAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#0f1f3d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#1e4db7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0, marginLeft: '8px', alignSelf: 'flex-end' }
};
