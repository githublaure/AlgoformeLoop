
# 🐦 PigeonSub - Le Guide du Pigeon Gangsta

*Yo yo yo, c'est ton pigeon gangsta qui parle ! 🎩*

## 🔥 Qu'est-ce que c'est que cette histoire ?

Alors mon pote, laisse-moi te raconter... Tu sais comme moi qu'on est tous des pigeons quand il s'agit d'abonnements, non ? Netflix qu'on regarde plus, Spotify qu'on écoute jamais, Adobe qu'on utilise une fois par an... Bref, on se fait plumer comme des poules !

**PigeonSub**, c'est MON application pour t'aider à arrêter d'être un pigeon... tout en restant stylé ! 😎

## 🎯 Ce que fait cette app de ouf

### 📊 Tableau de bord intelligent
- **Statistiques en temps réel** : Combien tu claque par mois (ça fait mal aux yeux parfois)
- **Renouvellements à venir** : Pour pas te faire surprendre comme un pigeon qui voit pas la vitre
- **Gestion des abonnements** : Ajoute, modifie, supprime tes trucs

### 🎤 Rappels vocaux (LA KILLER FEATURE!)
Écoute bien ça mon reuf : j'ai intégré **ElevenLabs** pour te générer des rappels vocaux !
- "Yo mec, ton Netflix se renouvelle demain, tu l'utilises encore ou quoi ?"
- "Hé pigeon, ton Spotify à 10 balles, ça fait 3 mois que tu l'écoutes pas !"

### 🔐 Authentification sécurisée
- **Inscription/Connexion** : Avec hashage bcrypt, on rigole pas avec la sécu
- **Reset de mot de passe** : Par email si tu oublies (arrive aux meilleurs)
- **Gestion de profil** : Change ton mot de passe quand tu veux

### 🎨 Interface de pigeon stylé
- **Design moderne** : Avec mes couleurs violettes de gangsta
- **Responsive** : Ça marche sur ton phone comme sur ton ordi
- **Thème pigeon** : Avec mes photos partout, même une démo avec mes potes pigeons !

## 🚀 Comment lancer cette merveille

### Prérequis
Tu vas avoir besoin de :
- **Node.js** (version récente, on est pas des sauvages)
- **PostgreSQL** (pour stocker tes données)
- **Clé API ElevenLabs** (pour mes rappels vocaux de chef)

### Installation
```bash
# Clone le projet
git clone [ton-repo]

# Installe les dépendances
npm install

# Configure ta base de données
npm run db:push
```

### Variables d'environnement
Crée ton fichier `.env` avec :
```env
DATABASE_URL="postgresql://..."
ELEVEN_LABS_API_KEY="ta_cle_api"
EMAIL_USER="ton_email@gmail.com"
EMAIL_PASS="ton_mot_de_passe_app"
JWT_SECRET="change_moi_stp"
```

### Lancement
```bash
# Mode développement (avec mon hot reload de boss)
npm run dev

# Mode production (pour les vrais)
npm run build
npm start
```

## 🏗️ Architecture technique (pour les nerds)

### Frontend
- **React + TypeScript** : Du code propre comme mes plumes
- **Vite** : Rapide comme un pigeon qui fonce
- **Tailwind CSS** : Stylé sans effort
- **shadcn/ui** : Des composants de qualité
- **React Query** : Gestion d'état comme un chef

### Backend
- **Express.js** : API REST solide
- **Drizzle ORM** : Base de données typée
- **JWT** : Authentification sécurisée
- **bcrypt** : Hashage de mots de passe
- **nodemailer** : Envoi d'emails

### Services externes
- **ElevenLabs** : Pour mes rappels vocaux légendaires
- **PostgreSQL** : Base de données robuste

## 🎭 Fonctionnalités principales

### 💰 Gestion des abonnements
- **Ajouter** : Netflix, Spotify, Adobe, tout ce qui te coûte des sous
- **Catégoriser** : Divertissement, Musique, Productivité, etc.
- **Suivre l'usage** : Très utilisé, utilisé, rarement utilisé (sois honnête !)
- **Alertes** : Renouvellements, essais qui se terminent

### 🔊 Rappels vocaux intelligents
- **Génération automatique** : Je crée le texte selon ton usage
- **Voix naturelle** : Grâce à ElevenLabs, ça sonne humain
- **Personnalisés** : Selon tes habitudes et tes abonnements

### 📈 Analytics et insights
- **Coût mensuel total** : Pour te faire pleurer (ou sourire si tu gères bien)
- **Tendances d'usage** : Quels abonnements tu utilises vraiment
- **Recommandations** : Lesquels tu devrais peut-être virer

## 🎪 La démo interactive

Va voir la page `/demo` pour une démo complète avec :
- **Mes photos de pigeon** : Moi et mes potes en action
- **Témoignages** : De Pierre Pigeon et Marie Colombe (ils existent vraiment !)
- **Fonctionnalités en action** : Tout ce que l'app peut faire

## 🛠️ API Endpoints

### Authentification
- `POST /api/auth/register` : Inscription
- `POST /api/auth/login` : Connexion
- `POST /api/auth/forgot-password` : Mot de passe oublié
- `POST /api/auth/reset-password` : Réinitialisation

### Abonnements
- `GET /api/subscriptions` : Liste tes abonnements
- `POST /api/subscriptions` : Ajoute un nouvel abonnement
- `PUT /api/subscriptions/:id` : Modifie un abonnement
- `DELETE /api/subscriptions/:id` : Supprime un abonnement

### Rappels vocaux
- `POST /api/voice/generate` : Génère un rappel vocal
- `GET /api/voice/reminders/:id` : Récupère les rappels d'un abonnement

## 🎯 Philosophie du projet

"Comment être un pigeon... et s'en sortir" - C'est pas juste un slogan, c'est une façon de vivre !

On est tous des pigeons parfois, surtout avec les abonnements. Mais avec **PigeonSub**, tu deviens un pigeon intelligent qui sait gérer ses sous et éviter les pièges !

## 🤝 Contribution

Tu veux aider ton pigeon gangsta ? Fork le projet, fais tes modifications, et envoie une pull request ! 

## 📜 Licence

MIT - Fais ce que tu veux avec, mais cite ton pigeon gangsta ! 😉

---

*Fait avec ❤️ par ton pigeon gangsta préféré*

*Remember: "Être un pigeon, c'est pas une fatalité, c'est un choix... Alors choisis bien !"* 🐦✨
