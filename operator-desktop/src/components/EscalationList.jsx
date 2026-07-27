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

    // Ascolta notifiche dal processo main (per affidabilita' in background)
    const cleanupMainProcess = window.electronAPI?.onNewWaitingSession?.((data) => {
      fetchSessions();
      notify(1, data.source === 'direct');
    });

    window.electronAPI?.setBadgeCount?.(0);

    return () => {
      supabase.removeChannel(channel);
      if (typeof cleanupMainProcess === 'function') cleanupMainProcess();
    };
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
        const allDirect = newWaiting.every(s => s.source === 'direct');
        notify(newWaiting.length, allDirect);
      }
      // Sincronizza col processo main per evitare notifiche doppie
      const waitingIds = data.filter(s => s.status === 'waiting').map(s => s.id);
      window.electronAPI?.syncWaitingIds?.(waitingIds);
    }
  };

  const notify = (count, isDirect = false) => {
    const label = isDirect ? 'Nuova chat diretta' : 'Nuova escalation';
    if (window.electronAPI) {
      window.electronAPI.showNotification(
        count === 1 ? label : `${label} (${count})`,
        count === 1
          ? (isDirect ? 'Un cliente sta aspettando un operatore' : 'Luca ha bisogno di aiuto')
          : `${count} clienti in attesa`
      );
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = isDirect ? 800 : 600;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 150);
    } catch {}
  };

  const takeOver = async (session) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    await supabase
      .from('escalated_sessions')
      .update({
        operator_id: user.id,
        operator_name: profile?.name || 'Operatore',
        status: 'operator_joined',
        taken_at: new Date().toISOString(),
      })
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
                  <div className="session-header-left">
                    <span className={`source-badge ${s.source === 'direct' ? 'direct' : 'escalation'}`}>
                      {s.source === 'direct' ? 'Chat diretta' : 'Escalation'}
                    </span>
                    <span className={`status-badge ${s.status}`}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </div>
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
