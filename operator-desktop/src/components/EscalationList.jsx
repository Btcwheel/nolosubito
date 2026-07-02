import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { logout } from '../services/supabase';
import ChatView from './ChatView';

const STATUS_LABELS = {
  waiting: 'In attesa',
  operator_joined: 'In corso',
  resolved: 'Risolte',
  contact_left: 'Recapito lasciato',
};

export default function EscalationList({ user }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [filter, setFilter] = useState('active');
  const audioRef = useRef(null);
  const notifiedRef = useRef(new Set());

  const filtered = sessions.filter(s => {
    if (filter === 'active') return s.status === 'waiting' || s.status === 'operator_joined';
    if (filter === 'resolved') return s.status === 'resolved' || s.status === 'contact_left';
    return true;
  });

  const waitingCount = sessions.filter(s => s.status === 'waiting').length;

  useEffect(() => {
    fetchSessions();
    const channel = supabase
      .channel('escalation_panel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'escalated_sessions',
      }, () => fetchSessions())
      .subscribe();

    // Badge inizialmente a zero finche' non carichiamo
    window.electronAPI?.setBadgeCount?.(0);

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    window.electronAPI?.setBadgeCount?.(waitingCount);
  }, [waitingCount]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('escalated_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setSessions(data);
      const newWaiting = data.filter(s => s.status === 'waiting' && !notifiedRef.current.has(s.id));
      if (newWaiting.length > 0) {
        newWaiting.forEach(s => notifiedRef.current.add(s.id));
        notify(newWaiting.length);
      }
    }
  };

  const notify = (count) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification(
        'Nuova chat in attesa',
        count === 1 ? 'Un cliente sta aspettando un operatore' : `${count} clienti in attesa`
      );
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = 600;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 150);
    } catch {}
  };

  const takeOver = async (session) => {
    await supabase
      .from('escalated_sessions')
      .update({ operator_id: user.id, status: 'operator_joined', taken_at: new Date().toISOString() })
      .eq('id', session.id);
    setActiveSessionId(session.id);
  };

  const closeSession = async (sessionId) => {
    await supabase
      .from('escalated_sessions')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', sessionId);
    setActiveSessionId(null);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="app-layout">
      <header>
        <div>
          <h1>Nolosubito Operator</h1>
          <span className="header-status">
            <span className="dot online" /> Connesso
          </span>
        </div>
        <div className="header-right">
          <span className="user-name">{user.email}</span>
          <button onClick={logout} className="btn-logout">Esci</button>
        </div>
      </header>

      {activeSession ? (
        <ChatView
          session={activeSession}
          user={user}
          onClose={() => closeSession(activeSession.id)}
        />
      ) : (
        <div className="main-content">
          <div className="tabs">
            <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
              Attive {waitingCount > 0 && <span className="badge">{waitingCount}</span>}
            </button>
            <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>
              Chiuse
            </button>
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              Tutte
            </button>
          </div>

          <div className="session-list">
            {filtered.map(s => (
              <div key={s.id} className={`session-card ${s.status}`}>
                <div className="session-header">
                  <span className={`status-badge ${s.status}`}>
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                  <span className="session-time">
                    {new Date(s.created_at).toLocaleString('it-IT')}
                  </span>
                </div>
                <p className="session-question">{s.user_question}</p>
                {s.contact_name && <p className="session-contact">📞 {s.contact_name}</p>}
                {s.status === 'waiting' && (
                  <button onClick={() => takeOver(s)} className="btn-takeover">
                    Prendi in carico
                  </button>
                )}
                {s.status === 'operator_joined' && (
                  <button onClick={() => setActiveSessionId(s.id)} className="btn-open">
                    Apri chat
                  </button>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className="empty-state">Nessuna chat da mostrare</p>}
          </div>
        </div>
      )}
    </div>
  );
}
