# CLAUDE.md — WishTogether

Leggi questo file integralmente prima di scrivere qualsiasi codice. È la fonte di verità del progetto.

---

## 1. Master Plan

### Problema
Le coppie perdono continuamente idee su cosa fare insieme: ristoranti sentiti per caso, film consigliati dagli amici, posti da visitare visti su Instagram. Non c'è un posto unico e condiviso dove raccoglierle.

### Soluzione
Un'app mobile condivisa tra due persone dove entrambi possono aggiungere desideri organizzati per categoria, commentarli e segnarli come completati.

### Utente Target
Coppie che vivono insieme o si vedono spesso, che vogliono organizzare il tempo libero senza usare note sparse o chat disorganizzate.

### MVP Scope
- Autenticazione di due utenti e collegamento tramite codice invito
- Lista desideri condivisa con 5 categorie: Posti, Ristoranti, Film/Serie, Videogiochi, Eventi
- Aggiunta desideri manuale
- Commenti/chat su ogni singolo desiderio in realtime
- Cancellazione commenti propri con long press
- Segna come fatto ✓ con animazione
- Archivio storico desideri completati
- Notifica push quando il partner aggiunge un nuovo desiderio

### Fuori Scope (MVP)
- Più di due utenti per lista
- Swipe/match
- Condivisione social
- Sotto-liste o tag personalizzati
- Ricerca integrata (TMDB, Google Places)

### Success Metric
L'app funziona se entrambi gli utenti riescono ad aggiungere un desiderio, commentarlo e segnarlo come completato in una sessione di test reale.

---

## 2. Stack Tecnico

- **Frontend:** React Native con Expo
- **Backend/DB:** Supabase (auth, database, realtime, storage)
- **Notifiche:** Expo Notifications

---

## 3. Implementation Plan

### Tabelle Supabase
- `users` — id, email, display_name, avatar_url, partner_id, couple_id, invite_code, push_token
- `wishes` — id, couple_id, category, title, description, image_url, source_url, created_by, is_done, done_at, created_at
- `comments` — id, wish_id, user_id, text, created_at

### Fase 1 — Setup & Auth ✅
- [x] Inizializzare progetto Expo
- [x] Configurare Supabase: tabelle, RLS policies
- [x] Schermata registrazione e login (email/password)
- [x] Generazione codice invito per collegare i due account
- [x] Schermata accettazione invito e collegamento coppia

### Fase 2 — Core Feature ✅
- [x] Home con lista desideri filtrata per categoria (tab bar)
- [x] Aggiunta desiderio manuale (titolo, categoria, note, immagine opzionale)
- [x] Dettaglio desiderio con commenti in realtime (Supabase realtime)
- [x] Cancellazione commenti propri con long press
- [x] Segna come fatto ✓ con animazione spring
- [x] Schermata archivio (desideri completati)
- [x] Notifica push al partner quando viene aggiunto un nuovo desiderio

### Fase 3 — Polish
- [ ] Splash screen e icona app
- [ ] Empty states per ogni categoria
- [ ] Gestione errori e stati di caricamento
- [ ] Animazioni leggere (aggiunta item, completamento)
- [ ] Test su dispositivo fisico (iOS e Android)

---

## 4. Design Guidelines

### Mood
Caldo, moderno, intimo. Non un'app aziendale — deve sembrare personale e piacevole da usare la sera sul divano.

### Colori
Valori reali da `constants/theme.ts`:
- **Primary:** #7C5CFC
- **Secondary:** #FF6B9D
- **Background:** #EEEAF8
- **Surface (card):** #FFFFFF
- **Surface2:** #F3F0FF
- **Text primario:** #1A1A2E
- **Text secondario:** #8892A4
- **Success:** #10B981
- **Error:** #EF4444
- **Border:** #EDE8FF

### Tipografia
Valori reali da `constants/theme.ts`:
- Titoli: 26px bold
- Sottotitoli: 17px semibold
- Body: 15px regular
- Caption: 13px regular, colore secondario

### Icone
- Libreria: `@expo/vector-icons` (Ionicons), outline di default, filled per stato attivo

### Categorie
| Categoria | Icona | Colore |
|---|---|---|
| Posti da visitare | `map-outline` | #6C63FF |
| Ristoranti | `restaurant-outline` | #F59E0B |
| Film/Serie | `film-outline` | #EF4444 |
| Videogiochi | `game-controller-outline` | #10B981 |
| Eventi | `calendar-outline` | #3B82F6 |

### Spacing & Layout
Valori reali da `constants/theme.ts`:
- `xs`: 4px, `sm`: 8px, `md`: 16px, `lg`: 24px, `xl`: 32px
- Border radius: `card` 20px, `button` 50px (pill), `full` 9999px
- Il campo note nella creazione desiderio usa `borderRadius: 16` (meno stondato del pill)
- Ombra: `shadowOpacity: 0.08` max

### Nav bar (bottom tabs)
- `height`: 92px
- `paddingTop`: 10px, `paddingBottom`: 24px
- Nessuna riga di separazione sopra la category tab bar in home

### FAB
- Posizione: `absolute`, `bottom: 20`, `right: 20`
- Dimensioni: 58×58px, `borderRadius: 29`

### Componenti chiave
- **WishCard:** immagine (se presente) in alto, titolo, categoria pill, icona ✓ se completato
- **CategoryTab:** tab bar orizzontale scrollabile in cima alla home, senza bordo inferiore
- **CommentBubble:** stile chat, allineato a destra se mio (bg primary+18, testo primary), sinistra se del partner (bg surface2). Long press sui propri commenti → Alert di eliminazione
- **FAB:** `position: absolute` in basso a destra, colore primary

---

## 5. User Journeys

### Journey 1 — Primo accesso e collegamento coppia
1. Registrazione → email + password + nome visualizzato
2. Login → si entra nell'app
3. Home → **gate screen** a schermo intero: card con icona, spiegazione e pulsante "Inizia a collegarti"
4. Tap sul pulsante → si apre il bottom sheet **LinkPartnerSheet**
5. Due opzioni nel sheet:
   - **Il tuo codice invito**: genera/mostra un codice a 6 caratteri da condividere col partner
   - **Inserisci il codice del partner**: inserisce il codice ricevuto e preme "Collega"
6. Al collegamento riuscito → Alert di conferma "Coppia collegata!" → entrambi i dispositivi passano automaticamente alla home completa (via Supabase Realtime)

> Il gate screen blocca completamente l'accesso all'app finché i due account non sono collegati. Non è possibile aggiungere desideri senza un partner.

### Journey 2 — Aggiunta desiderio manuale
1. Home → tap su FAB (+) in basso a destra, posizionato `absolute` equidistante da bordo e nav bar
2. Si apre la modal "Nuovo desiderio" dal basso
3. Form in sequenza: selezione categoria (pill), titolo (obbligatorio), note (opzionale, meno stondato), immagine da galleria (opzionale)
4. Tap "Salva desiderio" → il desiderio appare in cima alla lista senza refresh; notifica push inviata al partner

### Journey 3 — Dettaglio desiderio e commenti
1. Home o Archivio → tap su una WishCard → navigazione a `app/wish/[id].tsx`
2. Schermata dettaglio:
   - Header: ← back | categoria pill | ⋯ menu
   - Immagine 16:9 (se presente)
   - Titolo, descrizione, meta (creator · data)
   - Sezione commenti in realtime
3. Footer: TextInput + pulsante invio
4. Invio commento → appare in realtime su entrambi i dispositivi
5. Long press su un proprio commento → Alert "Elimina commento" → eliminazione in realtime
6. Menu ⋯ → Alert con opzioni:
   - **Segna come completato ✓** (solo se non già fatto) → animazione spring checkmark → torna alla home
   - **Elimina desiderio** → Alert conferma → eliminazione → torna alla home

### Journey 4 — Archivio
1. Tab "Archivio" in basso → lista dei desideri con `is_done: true`
2. Tap su una card → stessa schermata dettaglio `app/wish/[id].tsx`
3. Menu ⋯ mostra solo "Elimina desiderio" (già completato)

### Journey 5 — Gestione profilo
1. Home → tap sull'avatar in alto a destra
2. Alert con nome e email dell'utente e due opzioni:
   - **Scollega partner** (se collegati) → conferma → entrambi i dispositivi tornano al gate screen automaticamente (Realtime)
   - **Log out** → disconnessione e redirect al login

### Navigazione
```
├── Auth Stack
│   ├── Login
│   └── Registrazione
└── App Stack (Tabs)
    ├── Home
    │   ├── Gate screen (se non collegati) → LinkPartnerSheet
    │   └── Lista desideri per categoria
    │       └── WishDetail (segna fatto / commenti / elimina)
    ├── Archivio
    │   └── Lista desideri completati
    │       └── WishDetail (commenti / elimina)
    └── Modal
        └── Aggiungi desiderio
```
