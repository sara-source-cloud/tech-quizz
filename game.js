// Tech Quizz — jeu de base (sans le quiz, pour l'instant).
//
// Trois idées :
// 1. L'état : vies, score, position du paquet, liste des obstacles.
// 2. La boucle : une fonction rappelée environ 60 fois par seconde.
// 3. Les contrôles : les flèches et les boutons changent seulement
//    une direction (-1 gauche, 1 droite, 0 immobile).

"use strict";

// --- Réglages. Tu peux changer ces nombres pour tester. ---

// Vies au début d'une partie.
const VIES_DEPART = 3;

// Vitesse du paquet, en pixels par seconde.
const VITESSE_JOUEUR = 460;

// Le score monte tout seul : 10 points par seconde de survie.
const POINTS_PAR_SECONDE = 10;

// Après un choc, le paquet clignote et ne peut plus être touché
// pendant ce temps (en millisecondes). Sinon trois obstacles collés
// videraient toutes les vies d'un coup.
const DUREE_INVINCIBLE = 1000;

// --- Balises de la page ---

const ecranAccueil = document.querySelector("#ecran-accueil");
const ecranFin = document.querySelector("#ecran-fin");
const zoneJeu = document.querySelector("#zone-jeu");
const joueur = document.querySelector("#joueur");
const corpsJoueur = document.querySelector("#joueur .corps");
const elVies = document.querySelector("#vies");
const elScore = document.querySelector("#score");
const banniere = document.querySelector("#banniere");
const elScoreFinal = document.querySelector("#score-final");
const texteFin = document.querySelector("#texte-fin");
const boutonGauche = document.querySelector("#bouton-gauche");
const boutonDroite = document.querySelector("#bouton-droite");

// --- État de la partie ---

let enCours = false;
let vies = VIES_DEPART;
let score = 0;
let positionX = 0;
let directionClavier = 0;
let directionTactile = 0;
let obstacles = [];
let dernierTemps = 0;
let tempsDepuisDernier = 0;
let invincibleJusqua = 0;
let idAnimation = 0;
let timerMessage = 0;

// Touches et boutons actuellement enfoncés.
// Un Set garde des valeurs uniques : une flèche enfoncée n'y est qu'une fois,
// même si le clavier répète l'événement.
const fleches = new Set();
const boutonsEnfonces = new Set();

// Les trois dangers. `dessin` est du HTML écrit par nous (pas par le joueur).
const TYPES_OBSTACLES = [
  {
    id: "pare-feu",
    message: "Aïe ! Le pare-feu a recraché ton paquet.",
    dessin: ""
      + '<svg viewBox="0 0 64 48" aria-hidden="true">'
      + '<rect x="4" y="4" width="26" height="10" rx="2"></rect>'
      + '<rect x="34" y="4" width="26" height="10" rx="2"></rect>'
      + '<rect x="18" y="18" width="28" height="10" rx="2"></rect>'
      + '<rect x="4" y="32" width="26" height="10" rx="2"></rect>'
      + '<rect x="34" y="32" width="26" height="10" rx="2"></rect>'
      + "</svg><span>Pare-feu</span>",
  },
  {
    id: "routeur",
    message: "Routeur en panne… ton paquet a pris le mauvais câble.",
    dessin: ""
      + '<svg viewBox="0 0 64 64" aria-hidden="true">'
      + '<path d="M18 28 V14 M32 28 V10 M46 28 V14" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>'
      + '<rect x="8" y="28" width="48" height="26" rx="5" stroke="currentColor" stroke-width="4"></rect>'
      + '<circle cx="22" cy="41" r="3" fill="#ff4d6a" stroke="none"></circle>'
      + '<path d="M40 34 l12 14 M52 34 l-12 14" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>'
      + "</svg><span>Routeur</span>",
  },
  {
    id: "virus",
    message: "Atchoum ! Un virus traînait dans le réseau.",
    dessin: ""
      + '<svg viewBox="0 0 64 64" aria-hidden="true">'
      + '<circle cx="32" cy="32" r="12" stroke="currentColor" stroke-width="4"></circle>'
      + '<path d="M32 6 v10 M32 48 v10 M6 32 h10 M48 32 h10 M14 14 l7 7 M43 43 l7 7 M50 14 l-7 7 M14 50 l7-7" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>'
      + "</svg><span>Virus</span>",
  },
];

const PHRASES_FIN = [
  "Ton paquet erre dans un sous-réseau oublié.",
  "Livraison échouée. Personne n'a reçu ces données.",
  "Timeout ! Ce paquet a trop traîné en route.",
];

// --- Démarrage et fin ---

function demarrer() {
  cancelAnimationFrame(idAnimation);
  viderObstacles();

  vies = VIES_DEPART;
  score = 0;
  // 0,5 : le premier obstacle arrive un peu après le début, pas dans la même image.
  tempsDepuisDernier = 0.5;
  invincibleJusqua = 0;
  dernierTemps = 0;

  joueur.classList.remove("invincible");
  zoneJeu.classList.remove("choc");
  fleches.clear();
  directionClavier = 0;
  relacherBoutons();

  afficherVies();
  afficherScore();
  montrerMessage("Esquive ce qui tombe du réseau !");

  ecranAccueil.classList.add("cache");
  ecranFin.classList.add("cache");
  centrerJoueur();

  enCours = true;
  idAnimation = requestAnimationFrame(boucle);
}

function finDePartie() {
  enCours = false;
  cancelAnimationFrame(idAnimation);
  relacherBoutons();

  const points = Math.floor(score);
  elScoreFinal.textContent = String(points);
  const phrase = PHRASES_FIN[Math.floor(Math.random() * PHRASES_FIN.length)];
  texteFin.textContent = phrase;

  ecranFin.classList.remove("cache");
  ecranFin.querySelector("h2").focus();
}

function viderObstacles() {
  for (const obstacle of obstacles) {
    obstacle.el.remove();
  }
  obstacles = [];
}

// --- Boucle du jeu ---

// Le navigateur appelle cette fonction avant chaque image.
// `temps` est le nombre de millisecondes depuis l'ouverture de la page.
function boucle(temps) {
  if (!enCours) {
    return;
  }

  // Première image : on retient l'heure, sans encore déplacer quoi que ce soit.
  if (dernierTemps === 0) {
    dernierTemps = temps;
    idAnimation = requestAnimationFrame(boucle);
    return;
  }

  // dt = durée de cette image, en secondes.
  // On la plafonne à 0,05 s : si l'onglet a été caché, le jeu ne saute pas en avant.
  const dt = Math.min(0.05, (temps - dernierTemps) / 1000);
  dernierTemps = temps;

  score += POINTS_PAR_SECONDE * dt;
  afficherScore();
  deplacerJoueur(dt);

  tempsDepuisDernier += dt;
  if (tempsDepuisDernier >= delaiEntreObstacles()) {
    tempsDepuisDernier = 0;
    apparaitreObstacle();
  }

  faireTomberObstacles(dt);

  if (temps >= invincibleJusqua) {
    joueur.classList.remove("invincible");
    verifierCollisions();
  }

  if (!enCours) {
    return;
  }
  idAnimation = requestAnimationFrame(boucle);
}

// Au début, un obstacle toutes les 1,3 s environ.
// Plus le score est haut, plus c'est serré, sans jamais descendre sous 0,7 s.
function delaiEntreObstacles() {
  return Math.max(0.7, 1.3 - score / 700);
}

function deplacerJoueur(dt) {
  // Le clavier gagne si une flèche est enfoncée, sinon on suit le bouton tactile.
  const sens = directionClavier !== 0 ? directionClavier : directionTactile;
  const max = Math.max(0, zoneJeu.clientWidth - joueur.offsetWidth);

  positionX += sens * VITESSE_JOUEUR * dt;
  if (positionX < 0) {
    positionX = 0;
  }
  if (positionX > max) {
    positionX = max;
  }
  joueur.style.transform = "translateX(" + positionX + "px)";
}

function centrerJoueur() {
  positionX = Math.max(0, (zoneJeu.clientWidth - joueur.offsetWidth) / 2);
  joueur.style.transform = "translateX(" + positionX + "px)";
}

// --- Obstacles ---

function apparaitreObstacle() {
  if (obstacles.length >= 8) {
    return;
  }
  if (zoneJeu.clientWidth < 80) {
    return;
  }

  const type = TYPES_OBSTACLES[Math.floor(Math.random() * TYPES_OBSTACLES.length)];
  const el = document.createElement("div");
  el.className = "obstacle obstacle-" + type.id;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = type.dessin;
  zoneJeu.appendChild(el);

  const largeur = el.offsetWidth;
  // 8 px de marge : le dessin ne colle pas au bord arrondi de la zone.
  const gouttiere = 8;
  const maxX = Math.max(0, zoneJeu.clientWidth - largeur - gouttiere * 2);
  let x = gouttiere + Math.random() * maxX;

  // On évite d'empiler deux obstacles au même endroit en haut de l'écran.
  for (let essai = 0; essai < 8; essai++) {
    let tropPres = false;
    for (const autre of obstacles) {
      if (autre.y < 120 && Math.abs(autre.x - x) < largeur * 0.8) {
        tropPres = true;
        break;
      }
    }
    if (!tropPres) {
      break;
    }
    x = gouttiere + Math.random() * maxX;
  }

  const obstacle = {
    el: el,
    x: x,
    y: -el.offsetHeight - 6,
    // Chaque obstacle a une vitesse de base un peu différente.
    vitesse: 145 + Math.random() * 55,
    type: type,
  };
  obstacles.push(obstacle);
  poserObstacle(obstacle);
}

function poserObstacle(obstacle) {
  obstacle.el.style.transform = "translate(" + obstacle.x + "px, " + obstacle.y + "px)";
}

function faireTomberObstacles(dt) {
  // Le score rend la chute plus rapide, avec un plafond pour que ça reste jouable.
  const bonus = Math.min(160, score * 0.1);
  const bas = zoneJeu.clientHeight;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.y += (obstacle.vitesse + bonus) * dt;

    if (obstacle.y > bas) {
      obstacle.el.remove();
      obstacles.splice(i, 1);
      continue;
    }
    poserObstacle(obstacle);
  }
}

// --- Collisions ---

// Rectangle d'un élément, mesuré dans la zone de jeu.
// `marge` rétrécit la boîte : le contact est un peu plus juste que le dessin.
function boite(element, marge) {
  const zone = zoneJeu.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - zone.left + marge,
    y: rect.top - zone.top + marge,
    w: rect.width - marge * 2,
    h: rect.height - marge * 2,
  };
}

function seTouchent(a, b) {
  return a.x < b.x + b.w
    && a.x + a.w > b.x
    && a.y < b.y + b.h
    && a.y + a.h > b.y;
}

function verifierCollisions() {
  // On mesure le cube, pas la flèche : la flèche ne doit pas compter comme un choc.
  const paquet = boite(corpsJoueur, 4);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    const danger = boite(obstacle.el, 8);
    if (!seTouchent(paquet, danger)) {
      continue;
    }

    obstacle.el.remove();
    obstacles.splice(i, 1);
    perdreUneVie(obstacle.type);
    break;
  }
}

function perdreUneVie(type) {
  vies -= 1;
  invincibleJusqua = performance.now() + DUREE_INVINCIBLE;
  joueur.classList.add("invincible");
  zoneJeu.classList.add("choc");
  window.setTimeout(function () {
    zoneJeu.classList.remove("choc");
  }, 180);

  afficherVies();
  montrerMessage(type.message);

  if (vies <= 0) {
    finDePartie();
  }
}

// --- Affichage ---

function afficherVies() {
  // Au moins 3 cases : les vies perdues restent visibles en cœur vide.
  const cases = Math.max(VIES_DEPART, vies);
  let texte = "";
  for (let i = 0; i < cases; i++) {
    texte += i < vies ? "♥" : "♡";
    if (i < cases - 1) {
      texte += " ";
    }
  }
  elVies.textContent = texte;
  const mot = vies === 1 ? " vie" : " vies";
  elVies.setAttribute("aria-label", vies + mot);
}

function afficherScore() {
  // padStart ajoute des zéros devant : 42 devient « 00042 », comme un compteur d'arcade.
  elScore.textContent = String(Math.floor(score)).padStart(5, "0");
}

function montrerMessage(texte) {
  banniere.textContent = texte;
  banniere.classList.add("visible");
  window.clearTimeout(timerMessage);
  timerMessage = window.setTimeout(function () {
    banniere.classList.remove("visible");
  }, 1700);
}

// --- Contrôles clavier et tactiles ---

function brancherBouton(bouton, nom) {
  bouton.addEventListener("pointerdown", function (event) {
    event.preventDefault();
    bouton.setPointerCapture(event.pointerId);
    boutonsEnfonces.add(nom);
    bouton.classList.add("appuye");
    mettreAJourTactile();
  });

  function relacher() {
    boutonsEnfonces.delete(nom);
    bouton.classList.remove("appuye");
    mettreAJourTactile();
  }

  bouton.addEventListener("pointerup", relacher);
  bouton.addEventListener("pointercancel", relacher);
  bouton.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });
}

function mettreAJourTactile() {
  const gauche = boutonsEnfonces.has("gauche");
  const droite = boutonsEnfonces.has("droite");
  if (gauche && !droite) {
    directionTactile = -1;
  } else if (droite && !gauche) {
    directionTactile = 1;
  } else {
    directionTactile = 0;
  }
}

function relacherBoutons() {
  boutonsEnfonces.clear();
  directionTactile = 0;
  boutonGauche.classList.remove("appuye");
  boutonDroite.classList.remove("appuye");
}

function mettreAJourClavier() {
  const gauche = fleches.has("ArrowLeft");
  const droite = fleches.has("ArrowRight");
  if (gauche && !droite) {
    directionClavier = -1;
  } else if (droite && !gauche) {
    directionClavier = 1;
  } else {
    directionClavier = 0;
  }
}

function onToucheBas(event) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }
  // Empêche la page de défiler quand on joue avec les flèches.
  event.preventDefault();
  if (!enCours) {
    return;
  }
  fleches.add(event.key);
  mettreAJourClavier();
}

function onToucheHaut(event) {
  if (!fleches.has(event.key)) {
    return;
  }
  fleches.delete(event.key);
  mettreAJourClavier();
}

function onRedimension() {
  const max = Math.max(0, zoneJeu.clientWidth - joueur.offsetWidth);
  if (positionX > max) {
    positionX = max;
  }
  joueur.style.transform = "translateX(" + positionX + "px)";
}

// Le script est en bas de la page : les balises existent déjà.
document.querySelector("#bouton-jouer").addEventListener("click", demarrer);
document.querySelector("#bouton-rejouer").addEventListener("click", demarrer);
brancherBouton(boutonGauche, "gauche");
brancherBouton(boutonDroite, "droite");
window.addEventListener("keydown", onToucheBas);
window.addEventListener("keyup", onToucheHaut);
window.addEventListener("blur", function () {
  fleches.clear();
  directionClavier = 0;
  relacherBoutons();
});
window.addEventListener("resize", onRedimension);

afficherVies();
afficherScore();
centrerJoueur();
