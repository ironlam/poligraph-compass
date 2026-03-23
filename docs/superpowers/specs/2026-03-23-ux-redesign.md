# Refonte UX : Ma Boussole Politique

## Objectif

Transformer l'app d'un prototype austère en un outil de reference bold, credible et educatif. Chaque ecran doit eduquer, pas juste afficher des donnees.

## Cible

Citoyens perdus face a la complexite politique, qui veulent voter mais ne savent pas pour qui. La simplicite et la clarte sont critiques.

## Principes de design

- **Bold et engage** : contrastes forts, typographie affirmee, design qui a du caractere
- **Zero placeholder** : si on n'a pas la donnee, on ne montre pas l'element
- **Educatif par defaut** : chaque interaction est une opportunite d'apprendre

## Identite visuelle

- **Palette** : indigo-950 (base sombre), ambre vif (CTA), couleurs de parti saturees, blanc casse (fonds clairs)
- **Typographie** : hierarchie renforcee. Titres en extra-bold, taille genereuse (text-xl minimum pour les titres de section). Corps en text-sm/text-base avec bon leading
- **Coins** : rounded-2xl sur les cartes principales
- **Ombres** : shadow-sm sur les cartes pour de la profondeur
- **Accents parti** : chaque parti a un `color` dans les donnees, utilise comme bande laterale ou accent sur les items du classement

## Ecrans a modifier

### 1. Quiz cards

**Probleme** : carte blanche, texte, 3 boutons plats. Aucune emotion.

**Changements** :
- Theme visuel renforce : icone + couleur de fond en haut de carte (le ThemeBadge existe, le rendre plus prominent)
- Feedback visuel a la reponse : flash de couleur sur la carte (vert POUR, rouge CONTRE, gris abstention) avant la transition
- Compteur de progression : indicateur "5/10" avec points colores selon la reponse donnee (petits cercles)
- Bouton "Comprendre ce vote" sous la question : ouvre un bottom sheet avec le contexte du scrutin

### 2. Resultats

**Probleme** : boussole + label + liste plate avec ronds gris.

**Changements boussole** :
- Zones colorees par quadrant (leger degrade)
- Legendes plus lisibles
- Animation d'entree spring
- Le label du quadrant en gros, bold, comme un verdict

**Changements classement** :
- Photos reelles des deputes (round, border couleur du parti). Le champ `photoUrl` existe deja dans les donnees
- Barre de concordance visuelle (barre horizontale coloree) a cote du pourcentage
- Le #1 en carte "heros" : photo plus grande, nom, parti, score, phrase resume ("D'accord sur 14 votes sur 18")
- Les suivants en liste compacte avec photos + barre
- Onglets Elus/Partis : underline bold sur l'actif

### 3. Fiche depute (nouvel ecran)

**Nouvel ecran** accessible en tapant sur un depute dans le classement.

Route : `/politician/[id]`

**Structure** :
- En-tete : photo large, nom, parti (couleur), score de concordance en gros
- Resume par theme : barres horizontales par theme (Economie, Societe, Securite...) avec % d'accord par theme
- Detail vote par vote : liste de chaque scrutin en commun
  - La question
  - Votre reponse (badge colore POUR/CONTRE/ABSTENTION)
  - Sa reponse (badge colore)
  - Accord/desaccord (icone check/cross)
- Lien externe : "Voir son profil complet sur Poligraph"

**Donnees necessaires** : tout est deja disponible dans le store (answers, voteMatrix, questions). Le calcul par theme necessite de grouper les scrutins par leur champ `theme` existant.

### 4. Share card

**Probleme** : fond sombre basique, pas engageant.

**Changements** :
- Fond degrade indigo vers noir
- Quadrant en texte large et bold
- Top 3 des partis les plus proches (noms + score)
- CTA : "Et toi ? poligraph.fr"
- Format optimise stories Instagram (option ratio 9:16)

### 5. Bottom sheet educatif (nouveau composant)

**Nouveau composant** : bouton "Comprendre ce vote" dans le quiz ouvre un panneau avec :
- Titre officiel du scrutin
- Resume en 2 phrases de l'enjeu
- Resultat du vote (adopte/rejete, chiffres)
- Optionnel : comment les groupes ont vote

**Donnees necessaires** : enrichir `data/scrutins.json` avec des champs supplementaires par scrutin :
- `officialTitle` : titre officiel du scrutin
- `summary` : resume en 2 phrases
- `result` : "adopte" | "rejete"
- `voteCount` : { pour: number, contre: number, abstention: number }

Ces donnees peuvent etre ajoutees manuellement dans un premier temps, puis automatisees via le pipeline politic-tracker.

## Ecrans NON modifies

- **Accueil** : le moins problematique, on le garde tel quel
- **Methodologie** : vient d'etre cree, contenu OK
- **Refine interstitial** : simple et fonctionnel

## Hors scope

- Boucle d'engagement (fil nouveaux scrutins, comparaison amis, historique) : phase ulterieure
- 3e axe souverainete : quand on aura plus de scrutins
- Comptes utilisateur / persistance : pas necessaire pour le moment
- Mode sombre / clair : on garde le theme actuel

## Stack technique

Pas de nouvelles dependances majeures. Utiliser :
- `react-native-reanimated` (deja installe) pour les animations
- `react-native-gesture-handler` (deja installe) pour le bottom sheet
- Les `photoUrl` existants dans les donnees pour les photos deputes
- NativeWind/Tailwind existant pour le styling

## Resume des livrables

| Livrable | Type | Priorite |
|----------|------|----------|
| Photos deputes + couleurs parti dans le classement | Modification | P0 |
| Carte heros #1 dans les resultats | Modification | P0 |
| Barres de concordance visuelles | Modification | P0 |
| Fiche depute (ecran + navigation) | Nouveau | P0 |
| Feedback visuel quiz (flash couleur) | Modification | P1 |
| Bottom sheet educatif | Nouveau | P1 |
| Boussole avec zones colorees | Modification | P1 |
| Share card redesign | Modification | P1 |
| Compteur progression colore | Modification | P2 |
| Format stories Instagram | Modification | P2 |
