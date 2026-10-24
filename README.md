# Tech Quizz

Petit jeu d'arcade dans le navigateur. Tu incarnes un paquet de données et tu traverses un réseau en esquivant des pare-feu, des routeurs en panne et des virus.

Cette version est le **jeu de base** :

- écran d'accueil et bouton **Jouer**
- déplacement gauche / droite (flèches ou boutons)
- obstacles qui tombent
- 3 vies, score qui augmente avec le temps
- écran « Paquet perdu ! » pour relancer

Le quiz (une question toutes les 20 secondes) et le meilleur score ne sont pas encore branchés.

## Lancer le jeu

Dans ce dossier :

```bash
python3 -m http.server 8741
```

Puis ouvre [http://127.0.0.1:8741](http://127.0.0.1:8741).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | La structure : écrans, paquet, boutons |
| `style.css` | Le look néon |
| `game.js` | Les règles et la boucle du jeu |
| `questions.js` | Les questions du quiz (vide pour l'instant) |
| `images/logo.jpg` | L'affiche de l'accueil |
| `fonts/` | La police Russo One (licence OFL) |

## Contrôles

- Ordinateur : flèches gauche et droite
- Téléphone : boutons **Gauche** et **Droite** (on peut garder le doigt appuyé)
