-- FAQ gestite dal CMS, con regole di assegnazione (home, schede veicolo, caratteristiche, modelli).
-- Le prime 30 arrivano dal vecchio sito WordPress (plugin YITH FAQ), importate con wp_id per rendere l'import ripetibile.

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default false,
  wp_id int unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una riga per regola: una FAQ puo' averne piu' di una.
--   home             -> sezione FAQ della home                (target_value null)
--   vehicles         -> tutte le schede veicolo               (target_value null)
--   fuel             -> alimentazione  (es. Electric)
--   category         -> categoria      (es. SUV)
--   make             -> marca          (es. Fiat)
--   segment          -> segmento       (Privati / P.IVA)
--   ready_delivery   -> solo pronta consegna                  (target_value null)
--   model            -> modello preciso, formato "Marca|Modello"
create table if not exists faq_targets (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references faqs(id) on delete cascade,
  target_type text not null check (target_type in ('home','vehicles','fuel','category','make','segment','ready_delivery','model')),
  target_value text,
  created_at timestamptz not null default now()
);

create index if not exists faq_targets_faq_idx on faq_targets (faq_id);
create unique index if not exists faq_targets_unique_idx on faq_targets (faq_id, target_type, coalesce(target_value, ''));

alter table faqs enable row level security;
alter table faq_targets enable row level security;

drop policy if exists "faqs lettura pubblica pubblicate" on faqs;
create policy "faqs lettura pubblica pubblicate"
  on faqs for select
  using (is_published = true or get_user_role() in ('admin','cms'));

drop policy if exists "faqs cms scrittura" on faqs;
create policy "faqs cms scrittura"
  on faqs for all
  using (get_user_role() in ('admin','cms'))
  with check (get_user_role() in ('admin','cms'));

drop policy if exists "faq_targets lettura" on faq_targets;
create policy "faq_targets lettura"
  on faq_targets for select
  using (
    exists (select 1 from faqs f where f.id = faq_id and (f.is_published = true or get_user_role() in ('admin','cms')))
  );

drop policy if exists "faq_targets cms scrittura" on faq_targets;
create policy "faq_targets cms scrittura"
  on faq_targets for all
  using (get_user_role() in ('admin','cms'))
  with check (get_user_role() in ('admin','cms'));

create or replace function faqs_touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists faqs_touch_updated_at on faqs;
create trigger faqs_touch_updated_at before update on faqs
  for each row execute function faqs_touch_updated_at();

-- ── Import dal vecchio sito ─────────────────────────────────────────────────
-- Bozza: le domande sulla "preassegnazione" (prodotto non piu' venduto).

insert into faqs (question, answer, sort_order, is_published, wp_id) values
  ($faq$Quali documenti occorrono per noleggiare un'auto a lungo termine?$faq$, $faq$I documenti che occorrono sono:

Società di Capitali (Spa, Srl, Srls, Sapa), Società Cooperative (Scarl), Consorzi, Fondazioni

• Bilancio d’esercizio + nota integrativa (modello IV direttiva UE a sezioni)

• Ricevuta deposito bilancio d’esercizio

• Modulo privacy con timbro della società, data e firma del legale rappresentante

• Carta d’identità del legale rappresentante (con foto visibile e firma leggibile)

• Visura aggiornata (al massimo di 5 mesi prima)

Società di Persone (Snc, Sas, Ss)

• Modello Unico della società con ricevuta di presentazione

• Modulo privacy con timbro della società, data e firma del legale rappresentante

• Carta d’identità del legale rappresentante (con foto visibile e firma leggibile)

• Visura aggiornata (al massimo di 5 mesi prima) o attribuzione P.IVA

Ditta individuale / Libero Professionista

• Modello Unico con ricevuta di presentazione

• Modulo privacy con timbro, data e firma

• Carta d’identità (con foto visibile e firma leggibile)

• Visura aggiornata (o attribuzione partita iva per i casi di non iscrizione in CCIAA)

Privati

• CUD

• Modulo privacy con data e firma

• Carta d’identità (con foto visibile e firma leggibile)

• Ultime 2 buste paga

• Telefono fisso (una copia di fattura relativa ad una utenza: luce/gas/telefono/acqua)

• Deve essere assunto da almeno 6 mesi

• Se pensionato o amministratore di azienda al posto del CUD e delle buste paga è possibile allegare Unico$faq$, 120, true, 2035987),
  ($faq$Chi può guidare l'autovettura a noleggio?$faq$, $faq$Con il noleggio a lungo termine il veicolo noleggiato può essere guidato da: il cliente, i suoi familiari e chiunque abbia un’autorizzazione scritta da chi ha firmato il contratto di noleggio.
Il conducente dovrà sempre avere con sè la patente valida e in regola con la normativa in vigore.$faq$, 130, true, 2035993),
  ($faq$Chi può noleggiare un veicolo a lungo termine?$faq$, $faq$Il noleggio a lungo termine può essere effettuato da:

• Privato dipendente

• Ditta individuale

• Società di Persone (SAS, SNC)

• Società di capitali

• SRLS

• SRL

• SPA

• Cooperative a responsabilità limitata

• Professionisti

• Associazioni no Profit

Il noleggio a lungo termine NON è consentito a:

• Protestati

• Segnalati in CRIF

• Falliti

• Aziende con partecipazioni pubbliche

• Pubblica Amministrazione

Possono noleggiare le auto mediante valutazione e fideiussione di un soggetto terzo (che percepisce reddito dimostrabile) anche:

• Disoccupati

• Lavoratori a tempo determinato

Possono noleggiare le auto mediante eventuali depositi cauzionali o anticipo:

• Aziende neo costituite$faq$, 50, true, 2036070),
  ($faq$Se decido di passare al noleggio auto a lungo termine cosa ne faccio della mia auto?$faq$, $faq$Grazie alla nostra esperienza nel settore ed ai nostri rapporti di partnership siamo in grado di aiutare il cliente anche nella vendita della propria auto usata.$faq$, 140, true, 2036071),
  ($faq$Quali sono i tempi di consegna dell'auto noleggiata?$faq$, $faq$I tempi di consegna variano in relazione alla marca e al modello dell’auto.
Il tempo di attesa è lo stesso dell’acquisto di un auto nuova da ordinare in concessionaria, salvo per le vetture in stock dove riusciamo a effettuare la consegna anche in 30 giorni.$faq$, 40, true, 2036073),
  ($faq$Posso scaricare il canone di noleggio?$faq$, $faq$Sì, il noleggio a lungo termine prevede dei notevoli vantaggi fiscali per diverse categorie professionali e a seconda della tipologia d’uso del veicolo. Aziende, imprese e professionisti possono godere della deducibilità del canone e della detraibilità dell’IVA ottimizzando i propri costi e risparmiando sulla spesa dell’auto.$faq$, 70, true, 2036074),
  ($faq$É possibile recedere dal contratto di noleggio?$faq$, $faq$Si può recedere dal contratto di noleggio quasi sempre con penali, in base alla società di noleggio, ad eccezione della Leasys con la formula Be-Free della durata di 48 mesi per i privati che prevede il recesso senza penali dal 13° mese.
Per le aziende esiste il Be-Free Pro sempre con durata di 48 mesi. In questo caso il recesso è previsto dal 25° mese in poi.$faq$, 60, true, 2036075),
  ($faq$É presente un veicolo sostitutivo? In quali casi?$faq$, $faq$Il veicolo sostitutivo è un servizio optional previsto in due casi:

• veicolo sostitutivo in pre-assegnazione, nell’attesa di ricevere l’auto noleggiata a lungo termine richiesta

• veicolo sostitutivo per un massimo di 30 giorni, in caso di furto/incendio/guasto tecnico/incidente, dopodiché il cliente che vuole ordinare un altro veicolo, può richiederlo in pre-renting o pre-assegnazione, con canone diverso da quello standard.$faq$, 30, true, 2036076),
  ($faq$Posso circolare all'estero?$faq$, $faq$Sì, è possibile circolare con la propria auto a noleggio in tutti gli Stati che aderiscono alla Carta verde, un documento rilasciato dalla compagnia assicurativa che contiene l’elenco dei Paesi in cui il veicolo può circolare sotto la copertura assicurativa RCA, che copre eventuali danni verso terzi e verso cose causati dal conducente del veicolo.

Non è necessario avere la carta verde per circolare in: Francia. Germania. Olanda, Malta, Serbia, Austria, Belgio, Cipro, Bulgaria, Croazia, Danimarca, Svezia, Finlandia, Norvegia, Islanda, Regno Unito, Irlanda, Spagna, Svizzera, Repubblica Slovacca, Lituania, Lettonia, Lussemburgo, Portogallo, Polonia e Ungheria.

È invece necessario che la sigla dello stato estero in cui ci si deve recare sia presente nella Carta Verde e che non sia sbarrata per i seguenti Paesi: Albania, Iran, Israele, Macedonia, Marocco, Tunisia, Turchia, Ucraina, Israele, Bosnia Erzegovina, Bielorussia e Montenegro.

In caso contrario, con sigla del Paese sbarrata, la circolazione non è consentita, poiché il veicolo risulterà privo della copertura assicurativa obbligatoria relativa alla responsabilità civile.$faq$, 150, true, 2036077),
  ($faq$Per quanto tempo posso noleggiare un veicolo?$faq$, $faq$Il noleggio a lungo termine prevede il noleggio di un’autovettura per una durata minima di 12 mesi e massima di 60 mesi. Il cliente non è obbligato a stabilire una periodicità precisa, quindi può chiederla, ad esempio, per 13 mesi come per 38 mesi o 47 o 29.$faq$, 20, true, 2036081),
  ($faq$Cosa succede se percorro un chilometraggio diverso da quello pattuito?$faq$, $faq$In fase di contratto viene stabilito un importo che varia a seconda del tipo di autovettura scelta. I km in eccedenza al momento della consegna del veicolo saranno addebitati (ogni modello ha un proprio prezzo) mentre quelli inferiori saranno rimborsati.$faq$, 10, true, 2036083),
  ($faq$Cosa succede se il veicolo in preassegnazione necessita di manutenzione?$faq$, $faq$Bisogna contattare la rispettiva società di noleggio per organizzare la sostituzione del veicolo.$faq$, 160, false, 2036084),
  ($faq$Cosa fare nel caso in cui il veicolo in preassegnazione si fermi in panne?$faq$, $faq$È necessario contattare il soccorso stradale della rispettiva società di noleggio utilizzando il Numero Verde a bordo del veicolo. Il fornitore avrà cura di fornire un veicolo in sostituzione.$faq$, 170, false, 2036085),
  ($faq$Cosa fare nel caso in cui si riceva una multa sul veicolo in preassegnazione$faq$, $faq$Il fornitore del veicolo in preassegnazione comunicherà alle autorità competenti
i dati rilevati dalla patente al momento della consegna del mezzo: si dovrà quindi procedere al pagamento diretto o al ricorso presso le predette autorità.$faq$, 180, false, 2036086),
  ($faq$I chilometri percorsi con il veicolo in preassegnazione si aggiungono al conteggio dei chilometri complessivi stabiliti nel contratto del noleggio a lungo termine?$faq$, $faq$No, non vengono conteggiati in alcun modo.$faq$, 190, false, 2036087),
  ($faq$La preassegnazione prevede un massimale chilometrico, con addebito dell’eventuale eccedenza?$faq$, $faq$No, non è previsto nessun massimale.$faq$, 200, false, 2036088),
  ($faq$Quando va restituito il veicolo in preassegnazione?$faq$, $faq$Il veicolo in preassegnazione va restituito contestualmente al ritiro del nuovo veicolo, altrimenti la fatturazione del veicolo in preassegnazione proseguirà sino al momento della sua effettiva restituzione.$faq$, 210, false, 2036089),
  ($faq$Dove devo recarmi per gli interventi di manutenzione/riparazione?$faq$, $faq$Gli interventi di manutenzione ordinaria e straordinaria dovranno essere effettuati esclusivamente presso una delle officine convenzionate con la rispettiva società di noleggio presenti su tutto il territorio italiano, previo appuntamento.$faq$, 220, true, 2036090),
  ($faq$È previsto un servizio soccorso stradale?$faq$, $faq$È previsto un servizio di assistenza e soccorso stradale h24 in caso di incidente o guasto che non consenta la mobilità del veicolo.
Per usufruirne basta contattare il numero verde della rispettiva società di noleggio comunicando il luogo di fermo e i dati del veicolo. Sarà organizzato il traino con carro attrezzi per trasportare il veicolo nel centro assistenza convenzionato più vicino.$faq$, 100, true, 2036091),
  ($faq$Cosa succede in caso di furto dell'auto?$faq$, $faq$In caso di furto dell’auto, incendio o atti vandalici, è necessario sporgere denuncia presso le Autorità competenti entro 24 ore dall’evento.$faq$, 230, true, 2036092),
  ($faq$Cosa succede in caso di mancato ritrovamento dell'auto?$faq$, $faq$Se dopo 30 giorni l’auto non viene ritrovata, il contratto di noleggio si chiude ed è possibile riaprirne uno nuovo. Nel tempo che intercorre tra il furto dell’auto e l’arrivo della nuova auto siamo in grado di affidarti un’auto sostitutiva in modo che tu non subisca il disagio del furto.$faq$, 240, true, 2036093),
  ($faq$Cosa succede in caso di ritrovamento dell'auto?$faq$, $faq$Ritrovamento dell’auto: in caso di ritrovamento dell’auto è necessario informare tempestivamente la rispettiva società di noleggio e inoltrare la documentazione rilasciata dalle Autorità (verbale di restituzione con specifica dei danni riscontrati al momento del rinvenimento o indicazione di eventuali “danni occulti”).$faq$, 250, true, 2036094),
  ($faq$Cosa succede in caso di multa?$faq$, $faq$In caso di multa la società di noleggio comunicherà le generalità del locatario all’ente emittente del verbale, che provvederà a ri-notificare il verbale all’utilizzatore, in questo caso il locatario.$faq$, 260, true, 2036095),
  ($faq$Come mi comporto in caso di incidente?$faq$, $faq$In caso di incidente va compilato il modulo CID e si può tranquillamente chiamare il numero verde di assistenza h24 della rispettiva società di noleggio per eventuale richiesta di assistenza.
Se si ha il veicolo non marciante, sarà tempestivamente inviato il carro attrezzi (servizio già compreso nel canone di noleggio) che provvederà a portarlo nell’officina più vicina per ripararlo, a pagare i danni ai terzi in caso di colpa del conducente e applicherà le franchigie o penali se previste, idem per la riparazione del proprio veicolo (la polizza Kasko è sempre prevista) come per l’assicurazione RC Responsabilità Civile.
Se il contratto contempla penali, le addebiterà il mese successivo in fattura insieme al canone.$faq$, 110, true, 2036096),
  ($faq$Cosa fare in caso di scadenza del servizio RCA?$faq$, $faq$Sarà la rispettiva società di noleggio ad occuparsi, a ogni scadenza, di effettuare il rinnovo e l’inoltro immediato del nuovo certificato assicurativo e della Carta Verde.
Voi non dovrete sostenere alcun costo.$faq$, 270, true, 2036097),
  ($faq$Cosa fare in caso di smarrimento o furto del certificato assicurativo?$faq$, $faq$Bisogna sporgere denuncia alle Autorità Giudiziarie e inviare la richiesta di duplicato per furto o smarrimento dei documenti assicurativi, unitamente a copia della denuncia, alla rispettiva società di noleggio.$faq$, 280, true, 2036098),
  ($faq$Quando è possibile usufruire del veicolo sostitutivo?$faq$, $faq$In caso di guasto, incidente o furto del veicolo noleggiato.
È, inoltre, previsto, solo se il periodo di fermo del veicolo è superiore alle 24 ore e se il servizio del veicolo sostitutivo è previsto nel contratto di noleggio.
Non è mai previsto in questi casi:

• per eventi e casi diversi da quelli sopra specificati;

• fuori dal territorio nazionale;

• in caso di smarrimento della Carta di Circolazione, delle chiavi, delle targhe o per sequestro del veicolo da parte delle Autorità Giudiziarie in seguito a mancata revisione periodica e/o a violazioni al Codice della Strada.$faq$, 290, true, 2036099),
  ($faq$Dove va restituito il veicolo sostitutivo?$faq$, $faq$Presso qualunque stazione di noleggio della rispettiva società di noleggio, su tutto il territorio nazionale. I furgoni vanno, invece, restituiti esclusivamente nella stessa stazione del fornitore del noleggio.

Bisogna farsi rilasciare dalla stazione di noleggio il documento di avvenuta restituzione del veicolo (controfirmato dal personale della stazione di noleggio) con indicazione del livello del carburante e delle condizioni del veicolo all’atto della consegna e del ritiro.$faq$, 300, true, 2036100),
  ($faq$Come funziona la restituzione del veicolo dopo la scadenza del contratto di noleggio?$faq$, $faq$Allo scadere del contratto di noleggio, qualora si decidesse di restituire il veicolo alla rispettiva società di noleggio, il cliente dovrà riconsegnarlo nelle stesse condizioni in cui è stato ricevuto, salvo il normale stato di usura. Eventuali altri danni saranno addebitati al cliente.

Inoltre il cliente dovrà occuparsi di: eliminare gli optional di sua proprietà, lavare il veicolo (interno ed esterno), verificare la presenza di tutti i documenti di bordo, segnalare al perito eventuali sinistri non precedentemente denunciati il giorno della riconsegna del veicolo.$faq$, 90, true, 2036101),
  ($faq$Posso acquistare l'auto al termine del contratto di noleggio?$faq$, $faq$Sì, al termine del contratto, la rispettiva società di noleggio potrebbe consentire ai suoi clienti la possibilità di acquistare gli autoveicoli utilizzati a un prezzo conveniente.$faq$, 80, true, 2036102)
on conflict (wp_id) do nothing;

-- Assegnazione iniziale: 8 in home e 8 sulle schede veicolo (sulla scheda ne compaiono al massimo 6, in base a sort_order).
insert into faq_targets (faq_id, target_type)
select f.id, v.t from (values
  (2036070, 'home'),
  (2036081, 'home'),
  (2036073, 'home'),
  (2036074, 'home'),
  (2036075, 'home'),
  (2036083, 'home'),
  (2036076, 'home'),
  (2036102, 'home'),
  (2036083, 'vehicles'),
  (2036081, 'vehicles'),
  (2036076, 'vehicles'),
  (2036073, 'vehicles'),
  (2036101, 'vehicles'),
  (2036102, 'vehicles'),
  (2036091, 'vehicles'),
  (2036096, 'vehicles')
) as v(wp_id, t)
join faqs f on f.wp_id = v.wp_id
on conflict do nothing;
