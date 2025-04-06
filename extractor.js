import fs from "node:fs";
import { URL } from "node:url";

const url = "https://theportalwiki.com/wiki/GLaDOS_voice_lines/fr";

const res = await fetch(url);
const html = await res.text();
const portalTwoRelatedStuff = html.split(`id="Portal_2"`).pop();

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

  if(text === "N'espérez surtout pas revenir.") text = "Ne comptez surtout pas revenir."
  if(text === "OK.") text = "Bien."
  if(text === "Assez !") text = "Arrêtez !"
  if(text === "Salle de test terminée. Dans l'intérêt de la science, le centre d'enrichissement est fier de vous présenter la liste de nombres suivante : neuf. Sept. Cinquante. Trois. Sept cent sept.") text = "Vous vous débrouillez très bien tous les deux."
  if(text === "Le centre d'enrichissement va maintenant vous communiquer une liste de nombres et de fruits. Prenez soin de les noter car ils auront de l'importance ultérieurement dans l'expérience. Pas les fruits, toutefois. Sept. Avocat. Quarante. Veuillez rejoindre la salle de test suivante.") text = "Vous vous débrouillez très bien tous les deux."
  if(text === "Salle de test terminée. Dans l'intérêt de -  Cent sept.") text = "J'ai fait un peu de lecture. Saviez-vous que le mot Orange a la même racine latine que le mot traitre ?"
  if(text === "Excellent.") text = "Parfait."

  samples.push({
    audioLink,
    text,
  });
}

fs.mkdirSync("./wav")
fs.writeFileSync(`./metadata.csv`, "");

for (let i = 0; i < samples.length; i++) {
  const element = samples[i];

  try {
    let parsedUrl = new URL(element.audioLink);
  } catch (_) {
    console.log("Got invalid url for element :", element.audioLink, ", skipping");
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
