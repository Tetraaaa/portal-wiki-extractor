import fs from "node:fs";
import { URL } from "node:url";

const url = "https://theportalwiki.com/wiki/GLaDOS_voice_lines/fr";

const res = await fetch(url);
const html = await res.text();
const portalTwoRelatedStuff = html.split(`id="Portal_2"`).pop();

const samplesToSkip = [
  "Non ! NON ! NON ! AAAAAAAAAAAAAAA-",
  "Je suis vraiment désolée pour cette surprise. Tenez, vous savez quoi, nous allons appeler vos parents. [sonnerie téléphonique]. Les parents biologiques que vous essayez de joindre ne vous aiment pas. Veuillez raccrocher. [clic. Tonalité]",
  "Le prochain test... [boum !] ... est... [BOUM !] dangereux jervientoudsuite.",
  "[bip-bip-bip] À propos, vous avez l'air en forme. Très svelte.",
  "Le saviez-vous ? Les personnes qui n'ont pas la conscience tranquille sont plus sensibles aux crises car-[corne de brume]"
];

const textsToReplace = {
  "N'espérez surtout pas revenir.": "Ne comptez surtout pas revenir.",
  "OK.": "Bien.",
  "Assez !": "Arrêtez !",
  "Salle de test terminée. Dans l'intérêt de la science, le centre d'enrichissement est fier de vous présenter la liste de nombres suivante : neuf. Sept. Cinquante. Trois. Sept cent sept.":
    "Vous vous débrouillez très bien tous les deux.",
  "Le centre d'enrichissement va maintenant vous communiquer une liste de nombres et de fruits. Prenez soin de les noter car ils auront de l'importance ultérieurement dans l'expérience. Pas les fruits, toutefois. Sept. Avocat. Quarante. Veuillez rejoindre la salle de test suivante.":
    "Vous vous débrouillez très bien tous les deux.",
  "Salle de test terminée. Dans l'intérêt de -  Cent sept.":
    "J'ai fait un peu de lecture. Saviez-vous que le mot Orange a la même racine latine que le mot traitre ?",
  "Excellent.": "Parfait.",
  "Mais qu'est-ce que vous faites?": "Que faites-vous tous les deux?",
};

let matches = [
  ...portalTwoRelatedStuff.matchAll(
    /<li>.*<\/li>|<span class="mw-headline".*<\/span>/g
  ),
].map((match) => match[0]);

let samples = [];

let shouldSkipCurrentMatch = false;

for (let i = 0; i < matches.length; i++) {
  const match = matches[i];
  if (match.includes("mw-headline")) {
    const id = match.split("id=").pop().split(">")[0].replaceAll(`"`, "");
    //Skip the parts where GLaDOS is a potato, because audio quality of those samples is purposely bad
    if (id === `Chambre_de_GLaDOS_:_PoTATOS`) shouldSkipCurrentMatch = true;
    if (id === `L'espace`) shouldSkipCurrentMatch = false;
    continue;
  }

  if (shouldSkipCurrentMatch) continue;
  if (samplesToSkip.includes(match)) continue;

  let audioLink = match
    .split(`class="internal"`)[0]
    .split(`href="`)
    .pop()
    .replaceAll(`"`, "")
    .replace(" ", "");

  let text = match
    .split(`</a>`)[0]
    .split(">")
    .pop()
    .replaceAll(`"`, "")
    .replaceAll("&#160;", "")
    .replaceAll(/\[.*\]/g, "")
    .trim();

  if (!text || !audioLink) continue;
  if (audioLink.includes("potatos")) continue;

  if (textsToReplace[text]) text = textsToReplace[text];

  samples.push({
    audioLink,
    text,
  });
}

fs.mkdirSync("./wav");
fs.writeFileSync(`./metadata.csv`, "");

for (let i = 0; i < samples.length; i++) {
  const element = samples[i];

  try {
    let parsedUrl = new URL(element.audioLink);
  } catch (_) {
    console.log(
      "Got invalid url for element :",
      element.audioLink,
      ", skipping"
    );
    continue;
  }

  // fs.writeFile(`./wav/${i}.txt`, element.text, () => {});
  fetch(element.audioLink)
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      fs.writeFile(`./wav/${i}.wav`, Buffer.from(buf), () => {});
    });
  fs.appendFileSync(`./metadata.csv`, `${i}|"${element.text}"\n`);
}
