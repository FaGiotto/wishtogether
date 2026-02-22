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
- Aggiunta desideri manuale e tramite ricerca (Google Places per posti/ristoranti, TMDB per film/serie)
- Commenti/chat su ogni singolo desiderio in realtime
- Segna come fatto ✓ con archivio storico
- Notifica push quando il partner aggiunge un nuovo desiderio

### Fuori Scope (MVP)
- Più di due utenti per lista
- Swipe/match
- Condivisione social
- Sotto-liste o tag personalizzati

### Success Metric
L'app funziona se entrambi gli utenti riescono ad aggiungere un desiderio, commentarlo e segnarlo come completato in una sessione di test reale.

---

## 2. Stack Tecnico

- **Frontend:** React Native con Expo
- **Backend/DB:** Supabase (auth, database, realtime, storage)
- **Notifiche:** Expo Notifications
- **API esterne:** Google Places API (posti/ristoranti), TMDB API (film/serie)

---

## 3. Implementation Plan

### Tabelle Supabase
- `users` — id, email, display_name, avatar_url, partner_id
- `wishes` — id, couple_id, category, title, description, image_url, source_url, created_by, is_done, created_at
- `comments` — id, wish_id, user_id, text, created_at

### Fase 1 — Setup & Auth
- [ ] Inizializzare progetto Expo
- [ ] Configurare Supabase: tabelle, RLS policies
- [ ] Schermata registrazione e login (email/password)
- [ ] Generazione codice invito per collegare i due account
- [ ] Schermata accettazione invito e collegamento coppia

### Fase 2 — Core Feature
- [ ] Home con lista desideri filtrata per categoria (tab bar)
- [ ] Aggiunta desiderio manuale (titolo, categoria, note, immagine opzionale)
- [ ] Ricerca integrata: Google Places per Posti/Ristoranti, TMDB per Film/Serie
- [ ] Dettaglio desiderio con commenti in realtime (Supabase realtime)
- [ ] Segna come fatto ✓ con animazione
- [ ] Schermata archivio (desideri completati)
- [ ] Notifica push al partner quando viene aggiunto un nuovo desiderio

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
- **Primary:** #6C63FF
- **Secondary:** #FF6584
- **Background:** #F8F8F8
- **Surface (card):** #FFFFFF
- **Text primario:** #1A1A2E
- **Text secondario:** #6B7280
- **Success:** #10B981
- **Border:** #E5E7EB

### Tipografia
- Font: System default (SF Pro su iOS, Roboto su Android)
- Titoli: 22px bold
- Sottotitoli: 16px semibold
- Body: 14px regular
- Caption: 12px regular, colore secondario

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
- Border radius: 12px card, 8px bottoni piccoli
- Padding interno card: 16px
- Spacing: multipli di 8px
- Ombra: `shadowOpacity: 0.08` max

### Componenti chiave
- **WishCard:** immagine (se presente) in alto, titolo, categoria pill, icona ✓ se completato
- **CategoryTab:** tab bar orizzontale scrollabile in cima alla home
- **CommentBubble:** stile chat, allineato a destra se mio, sinistra se del partner
- **AddButton:** FAB in basso a destra, colore primary

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
1. Home → tap su FAB (+) in basso a destra
2. Si apre la modal "Nuovo desiderio" dal basso
3. Form in sequenza: selezione categoria (pill), titolo (obbligatorio), note (opzionale), immagine da galleria (opzionale)
4. Tap "Salva desiderio" → il desiderio appare in cima alla lista senza refresh

### Journey 3 — Azioni su un desiderio
1. Home → tap su una WishCard
2. Si apre **WishActionSheet** (bottom sheet con backdrop semitrasparente)
3. Due azioni disponibili:
   - **Segna come completato** (pulsante verde prominente) → Alert di conferma sistema → il desiderio si sposta nell'Archivio
   - **Elimina desiderio** (pulsante con bordo rosso) → Alert di conferma → eliminazione definitiva
4. Il pulsante "Segna come completato" non compare se il desiderio è già fatto (es. nell'Archivio)

### Journey 4 — Archivio
1. Tab "Archivio" in basso → lista dei desideri con `is_done: true`
2. Tap su una card → stesso **WishActionSheet** ma con solo l'opzione "Elimina" (già completato)

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
    │       └── WishActionSheet (segna fatto / elimina)
    ├── Archivio
    │   └── Lista desideri completati
    │       └── WishActionSheet (elimina)
    └── Modal
        └── Aggiungi desiderio
```
