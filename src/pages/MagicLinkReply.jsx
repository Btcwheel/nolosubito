import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getMagicLinkNote, saveResponseToNote } from '@/lib/magicLink';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MagicLinkReply() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const noteData = await getMagicLinkNote(token);
        if (!noteData) {
          setError('Link non valido o scaduto');
          return;
        }
        setNote(noteData);
      } catch (err) {
        setError('Errore nel caricamento della nota');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast({
        title: 'Errore',
        description: 'Scrivi una risposta prima di inviare',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await saveResponseToNote(token, responseText);
      setSubmitted(true);
      toast({
        title: 'Risposta inviata',
        description: 'La tua risposta è stata registrata con successo',
      });
    } catch (err) {
      toast({
        title: 'Errore',
        description: err.message || 'Errore nel salvataggio della risposta',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin size-8 text-electric" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="mx-auto size-12 text-destructive mb-4" />
          <h1 className="font-heading font-bold text-lg mb-2">Link non valido</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Torna alla home
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-green-500 mb-4" />
          <h1 className="font-heading font-bold text-lg mb-2">Risposta inviata!</h1>
          <p className="text-muted-foreground mb-2">Grazie per la tua risposta.</p>
          <p className="text-sm text-muted-foreground mb-6">
            L'operatore vedrà la tua risposta nella pratica e ti contatterà se necessario.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Torna alla home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-2">Rispondi alla richiesta</h1>
          <p className="text-muted-foreground">
            Ciao {note?.pratiche?.cliente_nome}, leggi il messaggio e invia la tua risposta
          </p>
        </div>

        {/* Nota dell'operatore */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Messaggio da {note?.autore_nome}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(note?.created_at), 'd MMM yyyy HH:mm', { locale: it })}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-border/30">
            <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {note?.testo}
            </p>
          </div>
        </div>

        {/* Form risposta */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-border/50">
          <label className="block text-sm font-semibold text-foreground mb-3">
            La tua risposta
          </label>
          <Textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Scrivi qui la tua risposta..."
            className="h-32 resize-none mb-4"
            disabled={submitting}
          />
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting || !responseText.trim()}
              className="flex-1 bg-electric hover:bg-electric/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                'Invia risposta'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              Annulla
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            🔒 Questa pagina è privata e protetta. La tua risposta verrà registrata nella pratica.
          </p>
        </form>
      </div>
    </div>
  );
}
