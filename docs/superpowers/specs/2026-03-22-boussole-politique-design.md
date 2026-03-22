# Ma Boussole Politique : Design Spec

**Date** : 2026-03-22
**Projet** : App mobile-first de positionnement politique basé sur les votes réels au Parlement
**Domaine** : boussole.poligraph.fr
**Repo** : boussole-politique (standalone)
**Porteur** : Association Sankofa, données Poligraph

---

## 1. Vision produit

Une app mobile-first qui permet à chaque citoyen de découvrir où il se situe politiquement, non pas sur la base de déclarations ou de programmes, mais sur les **votes réels des élus au Parlement français**.

L'utilisateur répond à 10 questions reformulées en langage courant (chaque question correspond à un vrai scrutin parlementaire), puis découvre sa position sur une boussole à deux axes et un classement des élus et partis qui votent comme lui.

### Principes directeurs

- **Pédagogie** : chaque écran doit être compréhensible par un citoyen sans culture politique préalable. Vocabulaire simple, pas de jargon législatif.
- **Mobile-first** : conçu pour le pouce, les petits écrans et les connexions moyennes. Les interactions (swipe, tap) priment sur les formulaires.
- **Performance** : premier écran en moins d'une seconde, animations à 60fps, calcul des résultats en moins de 200ms.
- **Transparence** : chaque question mentionne le scrutin réel, avec date et chambre. Les données viennent de Poligraph, source publique et vérifiable.
- **Vie privée** : aucune donnée personnelle collectée. Les réponses restent sur l'appareil. Le partage est optionnel et contrôlé par l'utilisateur.

### Public cible

Grand public, citoyens curieux. Le format doit être accessible, engageant et viral. L'objectif est la portée maximale, pas la profondeur analytique (celle-ci est disponible pour ceux qui veulent creuser).

---

## 2. Architecture

### Vue d'ensemble

```
POLIGRAPH (poligraph.fr)          VERCEL (boussole.poligraph.fr)          APP MOBILE
┌─────────────────────┐           ┌──────────────────────────────┐        ┌──────────────────┐
│ Base de données      │  cron    │ Serverless Functions          │  JSON  │ Expo/React Native│
│ source               │ ──────> │ GET  /api/quiz-pack           │ ────> │                  │
│                      │ (1x/j)  │ POST /api/compute             │        │ Quiz             │
│ • 10 145 scrutins    │          │ GET  /api/share/[id]          │        │ Boussole 2D      │
│ • 13 thèmes          │          │                               │        │ Classement       │
│ • 1 068 politiques   │          │ @vercel/og (Edge)             │        │ Partage          │
│ • Votes individuels  │          │ Image OG dynamique            │        │                  │
│                      │          │                               │        │ EAS Build (stores)│
│ API publique /api/*  │          │ Cron sync (vercel.json)       │        │ EAS Update (OTA) │
└─────────────────────┘           │ Expo Web (version navigateur) │        └──────────────────┘
                                  └──────────────────────────────┘
```

### Principes architecturaux

**Découplé de Poligraph** : le backend sync les données une fois par jour via l'API publique de Poligraph. Si Poligraph est indisponible, la boussole continue de fonctionner avec les données en cache.

**Calcul hybride** : la concordance peut se calculer côté client (mode offline, résultats instantanés) ou côté serveur (pour générer un résultat partageable avec ID unique).

**Pré-calcul batch** : les questions reformulées et la matrice de votes sont générées lors de la sync quotidienne. Aucun appel IA à chaque requête utilisateur.

### Contrat API Poligraph (endpoints consommés par la sync)

Le cron quotidien appelle ces endpoints de l'API publique Poligraph (aucune authentification requise) :

1. **GET /api/politiques?mandateType=DEPUTE&page=1&limit=100** : liste des députés avec ID, nom, parti, photo. Paginé (max 100 par page, ~6 pages pour ~577 députés), on récupère toutes les pages.
2. **GET /api/politiques/[slug]/votes?page=1&limit=100** : votes individuels d'un député. Paginé (max 100 par page). Appelé pour chaque député, filtré ensuite côté boussole pour ne garder que les 25 scrutins sélectionnés.
3. **GET /api/votes/stats?chamber=AN** : statistiques de votes par parti (positions majoritaires, cohésion). Utilisé pour le calcul de concordance par parti.

**Optimisation prioritaire** : la sync v1 nécessite ~1200+ requêtes par jour (6 pages de députés + ~600 députés × 1-5 pages de votes chacun). Pour réduire drastiquement ce volume, ajouter côté Poligraph un endpoint dédié (`/api/export/votes?scrutinIds=ID1,ID2,...`) qui retourne la matrice de votes pour les 25 scrutins sélectionnés en un seul appel. À implémenter avant ou juste après la v1.

---

## 3. Données et calcul

### Sélection des scrutins

**Processus** : sélection manuelle éditoriale. Un fichier de configuration `data/scrutins.json` dans le repo contient la liste des 25 scrutins retenus avec leurs métadonnées (ID Poligraph, axe assigné, polarité). Ce fichier est modifié manuellement et versionné dans git. La sync quotidienne ne change pas la sélection : elle met à jour les votes et les politiques, pas les questions.

**Critères de sélection** :
- **Clivants** : forte division entre les groupes parlementaires (score de division élevé dans les données Poligraph, endpoint `/api/votes/stats` champ "divisive scrutins")
- **Couverture thématique** : au moins 1 scrutin par grand thème (économie, environnement, sécurité, immigration, institutions, santé, etc.)
- **Compréhensibles** : le sujet doit être reformulable en question simple pour un non-spécialiste
- **Récents** : priorité aux scrutins de la législature en cours

**Format du fichier `data/scrutins.json`** :
```json
[
  {
    "scrutinId": "VTANR6L16V4217",
    "order": 1,
    "tier": "essential",
    "axis": "society",
    "polarity": 1,
    "theme": "ENVIRONNEMENT_ENERGIE",
    "question": "Faut-il interdire le glyphosate en agriculture ?"
  }
]
```

Champs :
- `scrutinId` : identifiant du scrutin dans Poligraph
- `order` : position dans le quiz (1-10 = essentiels, 11-25 = affinage)
- `tier` : "essential" (10 premières questions) ou "refine" (15 supplémentaires)
- `axis` : "economy" ou "society" (pour le positionnement boussole 2D)
- `polarity` : +1 ou -1 (POUR sur ce scrutin = positif ou négatif sur l'axe, déterminé éditorialement)
- `theme` : thème Poligraph pour le badge affiché
- `question` : question reformulée en langage citoyen (générée par Mistral Small 4, relue humainement)

### Reformulation des questions

Chaque titre de scrutin est reformulé en question citoyenne via **Mistral Small 4**. La reformulation est stockée directement dans `data/scrutins.json` (champ `question`) et n'est exécutée qu'une seule fois, au moment de l'ajout d'un scrutin à la sélection (pas à chaque sync). Un script CLI `npm run generate:questions` reformule les scrutins dont le champ `question` est vide, puis écrit le résultat dans le fichier. Relecture humaine obligatoire avant commit.

Exemple :
- **Scrutin** : "Amendement n°CE1432 relatif à l'interdiction de mise sur le marché des produits contenant du glyphosate"
- **Question** : "Faut-il interdire le glyphosate en agriculture ?"

Le wording doit être :
- Neutre (pas de formulation orientée)
- Court (une phrase, 15 mots max)
- Compréhensible sans contexte politique

### Matrice de votes

Pour chaque scrutin sélectionné, le quiz-pack contient le vote de chaque politique :

```
scrutin_id → { politician_id: POUR | CONTRE | ABSTENTION | ABSENT }
```

Les votes ABSENT et NON_VOTANT sont exclus du calcul (le politique n'a pas exprimé de position).

### Calcul de concordance

#### Par politique (individuel)

Pour chaque élu, on compare les réponses de l'utilisateur aux votes réels. On réutilise la même logique que `computeVoteConcordance()` de Poligraph (`src/lib/data/compare.ts`) :

- Même position (POUR/POUR ou CONTRE/CONTRE) → "agree"
- Position opposée (POUR/CONTRE) → "disagree"
- Un des deux en ABSTENTION → "partial"
- Question passée par l'utilisateur ou politique absent → ignorée (exclu du total)

**Concordance = agree / (agree + disagree + partial) × 100**

Résultat : un pourcentage de 0% (opposition totale) à 100% (accord total). Les "partial" comptent dans le dénominateur sans ajouter au numérateur, ce qui pénalise légèrement l'abstention par rapport à un accord (comportement identique à Poligraph).

#### Par parti (agrégé)

Pour chaque parti, on détermine la **position majoritaire** de ses membres sur chaque scrutin (la position avec le plus de votes parmi les membres du parti). Puis on applique le même calcul de concordance entre l'utilisateur et la position majoritaire du parti.

Cette logique existe déjà dans Poligraph (`compare.ts`, requête SQL des positions majoritaires par parti).

### Positionnement sur la boussole 2D

#### Définition des axes

Les deux axes sont définis par des sous-ensembles thématiques de scrutins, choisis pour maximiser la discrimination entre les positions politiques dans les données françaises réelles :

- **Axe X (Économie)** : scrutins des thèmes ECONOMIE_BUDGET et SOCIAL_TRAVAIL. Gauche = interventionnisme étatique, droite = libéralisme économique.
- **Axe Y (Société)** : scrutins des thèmes SECURITE_JUSTICE, IMMIGRATION et INSTITUTIONS. Bas = conservateur, haut = progressiste.

Les labels des axes doivent rester en langage courant : pas de "collectivisme" ou "libertarianisme".

#### Calcul de position

Pour chaque axe, on prend les réponses de l'utilisateur aux questions de cet axe.

Chaque scrutin a une **polarité pré-définie** dans `data/scrutins.json` (champ `polarity`, valeur +1 ou -1, déterminée lors de la sélection éditoriale) :
- Voter POUR sur un scrutin de polarité +1 = +1 sur l'axe
- Voter POUR sur un scrutin de polarité -1 = -1 sur l'axe
- Voter CONTRE = inverse de la polarité
- ABSTENTION = 0

Position sur l'axe = moyenne des scores, normalisée entre -1 et +1.

Le même calcul est appliqué à chaque politique et chaque parti, ce qui place tout le monde sur le même plan comparable.

**Seuil minimum** : si l'utilisateur a répondu à moins de 3 questions sur un axe, la position sur cet axe n'est pas affichée ("Pas assez de réponses pour ce thème"). Si moins de 3 questions répondues au total, pas de résultat : message invitant à répondre à plus de questions.

---

## 4. Parcours utilisateur

### Écran 1 : Accueil

- Branding "Ma Boussole Politique" + mention "par Poligraph"
- Pitch en une phrase : "Découvrez quels élus votent comme vous"
- Durée estimée : "2 minutes, 10 questions"
- Un seul bouton : "Commencer"
- Mention "basé sur les votes réels au Parlement"

### Écran 2 : Quiz (10 questions essentielles)

- Barre de progression (4/10)
- Badge thématique en couleur (Environnement, Sécurité, etc.)
- Question reformulée en gros, langage simple
- Mention discrète du scrutin réel (date, chambre) pour la transparence
- 3 boutons : Pour (vert), Contre (rouge), Abstention (gris)
- Option "Passer" en texte discret (la question ne compte pas)
- Swipe gauche/droite pour répondre (interaction mobile-first)
- Animation de transition entre les questions (Reanimated 4)

### Écran 3 : Résultat, boussole 2D

- Titre : "Votre position politique"
- Sous-titre : "D'après vos réponses à 10 scrutins réels"
- Boussole interactive : position de l'utilisateur (point mis en avant) + partis en fond (points semi-transparents)
- Tap sur un parti : bulle avec nom + % de concordance
- Résumé textuel du quadrant en langage simple ("Vous vous situez du côté progressiste et interventionniste")
- Deux boutons : "Partager" et "Affiner mes résultats"
- Animation d'arrivée du point (rebond léger)

### Écran 4 : Classement

Section scrollable sous la boussole dans `results.tsx` (même écran, pas de navigation séparée). L'utilisateur scroll naturellement après avoir vu sa position.

- Deux onglets : "Élus" et "Partis"
- Liste classée par % de concordance décroissant
- Chaque entrée : photo (si dispo), nom, mandat, parti, % de concordance
- Code couleur : vert (>60%), orange (40-60%), rouge (<40%)
- Tap sur un élu : ouvre sa fiche sur poligraph.fr (deep link web)
- Tap sur un parti : liste des élus de ce parti classés par concordance

### Écran 5 : Affiner (optionnel)

- Écran de transition : "15 questions supplémentaires pour affiner votre position"
- Durée estimée : "4 minutes"
- Bouton "Continuer" + lien "Non merci, partager mes résultats"
- Même format que l'écran 2
- Les résultats sont recalculés avec les 25 questions au total

### Écran 6 : Partage

- Prévisualisation de l'image de partage
- **Par défaut** : position sur la boussole + quadrant en texte, sans mention de parti
- **Toggle optionnel** : "Afficher les partis proches" ajoute les noms des partis sur l'image
- Bouton "Partager l'image" (Share Sheet natif iOS/Android)
- Bouton "Copier le lien" (boussole.poligraph.fr/r/abc123)
- Bouton "Recommencer"

---

## 5. Viralité et partage

### Boucle virale

Fait le quiz → Découvre son résultat → Partage → Un ami voit le post → Fait le quiz → Boucle relancée.

### Image OG (1200×630px)

Générée dynamiquement par @vercel/og (Edge Function, ~50ms, cachée par ID de résultat).

Contenu par défaut :
- Position de l'utilisateur sur la boussole (point blanc sur graphe)
- Partis en fond (points semi-transparents, nommés si l'utilisateur a activé le toggle)
- Texte du quadrant : "Progressiste-interventionniste" (etc.)
- CTA : "Et toi ? Fais le test →"
- Mention : "Basé sur les votes réels des élus, données Poligraph"
- Pas de données personnelles

Contenu optionnel (si toggle activé) :
- Nom du parti le plus proche + % de concordance

### Mécanismes de partage

1. **Share Sheet natif** : expo-sharing + react-native-view-shot. Capture de la boussole en image, menu de partage de l'OS.
2. **Lien partageable** : boussole.poligraph.fr/r/[id]. Page web avec meta tags OG. L'ami voit le résultat puis est invité à faire le quiz.
3. **V2 possible** : comparaison entre amis (deux boussoles superposées).

### Déclencheurs de viralité

- **Curiosité** : "Je suis ici sur la boussole, et toi ?" (format jeu)
- **Surprise** : les résultats basés sur les votes réels surprennent souvent par rapport aux attentes
- **Débat** : invite naturellement les amis à se positionner et comparer
- **Crédibilité** : la mention "votes réels au Parlement" + Poligraph rend le résultat légitime

---

## 6. Stack technique

### App mobile

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework | Expo SDK 55, React Native 0.83 | Dernière version stable, New Architecture |
| Navigation | Expo Router | File-based routing, deep linking automatique |
| Styling | NativeWind v5 (Tailwind CSS v4) | Cohérence avec Poligraph (Tailwind) |
| Animations | Reanimated 4 + Gesture Handler | 60fps, swipe natif, UI thread |
| État local | Zustand | 2kb, zero boilerplate, état du quiz |
| Données serveur | TanStack Query | Cache offline, revalidation, retry |
| Boussole | React Native SVG + D3.js | Visualisation 2D interactive |
| Partage | expo-sharing + react-native-view-shot | Share Sheet natif + capture d'écran |

### Backend (Vercel)

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Runtime | Vercel Serverless Functions | Déjà en place pour Poligraph |
| Base de données | Vercel KV (Redis) | Stockage des résultats partageables (clé: ID résultat, valeur: JSON position + concordances, TTL: 90 jours) |
| Sync Poligraph | Cron Vercel (vercel.json, 1x/jour) | Sync quotidienne automatique |
| IA reformulation | Mistral Small 4 (batch, 1x/sync) | Modèle français, open source, léger |
| Images OG | @vercel/og (Edge Function) | Natif Vercel, ~50ms de rendu |
| Cache | Edge Cache headers (quiz-pack: 24h) | Quiz-pack servi depuis le cache edge |
| Validation | Zod (schemas partagés client/serveur) | Typage runtime partagé |
| Analytics | Umami (instance dédiée boussole) | Instance séparée de celle de Sankofa |
| Monitoring | Sentry | Crash reporting mobile + serverless |

### Objectifs de performance

| Métrique | Cible | Levier |
|----------|-------|--------|
| Premier écran visible | <1s | Hermes bytecode + splash screen |
| Chargement quiz-pack | <300ms | Edge cache Vercel (TTL 24h) |
| Animations quiz/swipe | 60fps | Reanimated 4, UI thread |
| Calcul concordance | <200ms | 25 questions × ~500 politiques, calcul local |

### Structure du repo

```
boussole-politique/
├── app/                          # Expo Router
│   ├── (tabs)/                   # Navigation principale
│   │   ├── index.tsx             # Accueil
│   │   ├── quiz.tsx              # Quiz (10 + 15 questions)
│   │   ├── results.tsx           # Boussole + classement
│   │   └── share.tsx             # Écran de partage
│   └── api/                      # Vercel Serverless Functions
│       ├── quiz-pack+api.ts      # GET : questions + matrice de votes
│       ├── compute+api.ts        # POST : calcul concordance serveur
│       ├── share/[id]+api.ts     # GET : résultat partageable + OG image
│       └── cron/sync+api.ts      # Cron : sync quotidienne Poligraph
├── components/                   # Composants partagés
│   ├── Compass.tsx               # Boussole 2D (SVG + D3)
│   ├── QuizCard.tsx              # Carte question swipable
│   ├── RankingList.tsx           # Liste concordance
│   └── ShareImage.tsx            # Image de partage
├── lib/                          # Logique métier
│   ├── concordance.ts            # Algo concordance (client + serveur)
│   ├── compass.ts                # Positionnement axes 2D
│   ├── schemas.ts                # Zod schemas (partagés)
│   └── store.ts                  # Zustand (état quiz)
├── vercel.json                   # Crons + config Vercel
└── app.json                      # Config Expo
```

---

## 7. Wording et pédagogie

### Principes de rédaction

- **Vocabulaire courant** : "élu" plutôt que "parlementaire", "vote" plutôt que "scrutin", "loi" plutôt que "dossier législatif"
- **Phrases courtes** : 15 mots max par question, 10 mots max par bouton ou label
- **Pas de jargon** : jamais d'acronyme sans explication (AN → Assemblée nationale), pas de termes techniques (amendement, navette, commission)
- **Ton neutre** : ni moralisateur, ni militant. Factuel et engageant.
- **Pédagogie intégrée** : chaque écran explique ce qu'il montre. Pas de connaissance préalable requise.

### Exemples de wording par écran

**Accueil**
- Titre : "Ma Boussole Politique"
- Sous-titre : "Découvrez quels élus votent comme vous"
- Détail : "10 questions basées sur de vrais votes au Parlement"
- Bouton : "Commencer"

**Quiz**
- Badge : "Environnement" (pas "ENVIRONNEMENT_ENERGIE")
- Question : "Faut-il interdire le glyphosate en agriculture ?" (pas "Amendement n°CE1432 relatif à...")
- Contexte : "Voté à l'Assemblée nationale le 12 juin 2024"
- Boutons : "Pour", "Contre", "Sans avis"
- Note : "Sans avis" plutôt que "Abstention" (mot plus courant)

**Résultats**
- Titre : "Votre position"
- Axes : "Économie : plus ou moins d'intervention de l'État" / "Société : plus ou moins de libertés individuelles"
- Quadrant : "Vous êtes plutôt pour l'intervention de l'État et les libertés individuelles"
- Classement : "Les élus qui votent comme vous" (pas "Concordance")

**Partage**
- CTA : "Et toi, tu es où ?"
- Mention : "D'après les votes réels des élus"

### Accessibilité

- Contraste AA minimum sur tous les textes
- Taille de texte minimum 14px pour le corps, 12px pour les mentions secondaires
- Boutons de réponse minimum 48×48px (guideline Material + HIG)
- Support du mode sombre
- Labels accessibles sur la boussole SVG (aria-label)

---

## 8. Contraintes et risques

### Risques identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Biais dans la sélection des scrutins | Le choix des questions oriente les résultats | Processus éditorial transparent, couverture thématique équilibrée, publication de la méthodologie |
| Reformulation orientée | Une question mal formulée biaise la réponse | Relecture humaine obligatoire après génération IA, formulations neutres vérifiées |
| Réaction politique ("vous nous classez mal") | Risque réputationnel | Les données sont factuelles (votes publics), transparence totale sur la méthode |
| Faible taux de complétion | L'utilisateur abandonne en cours de quiz | Format court (10 questions, 2 min), barre de progression, animations engageantes |
| API Poligraph indisponible | Pas de nouvelles données | Le quiz-pack est caché, fonctionne en mode dégradé |

### Hors périmètre (v1)

- Comparaison entre amis (v2)
- Notifications push ("un nouveau scrutin clivant a eu lieu")
- Sénateurs dans la sélection initiale (commencer avec l'Assemblée nationale uniquement, plus médiatisée)
- Historique des résultats par utilisateur (pas de compte utilisateur en v1)
- Internationalisation (français uniquement)

---

## 9. Métriques de succès

| Métrique | Cible v1 | Mesure |
|----------|----------|--------|
| Taux de complétion du quiz | >70% | Umami : événement "quiz_completed" / "quiz_started" |
| Taux de partage | >15% des complétions | Umami : événement "share" / "quiz_completed" |
| Taux d'affinage | >25% font les 15 questions bonus | Umami : événement "refine_started" / "quiz_completed" |
| Taux de rebond depuis lien partagé | <50% | Umami : visiteurs qui commencent le quiz depuis /r/[id] |
| Performance : premier écran | <1s (p95) | Sentry performance monitoring |
| Performance : calcul résultats | <200ms (p95) | Mesure côté client |
