// questions.js
//
// Les questions du quiz seront ajoutées à l'étape suivante.
// Pour l'instant le tableau est vide : le jeu de base n'en a pas besoin.
//
// Ce fichier est chargé par une balise <script> avant game.js,
// donc la variable QUESTIONS sera visible dans game.js.
//
// Format prévu pour chaque question :
// {
//   question: "Le texte de la question",
//   choix: ["réponse A", "réponse B", "réponse C", "réponse D"],
//   bonneReponse: 0, // 0 = premier choix, 1 = deuxième, etc.
//   explication: "Pourquoi c'est la bonne réponse."
// }

const QUESTIONS = [];
