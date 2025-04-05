import fs from "node:fs";
import { URL } from "node:url";

const res = await fetch("https://theportalwiki.com/wiki/GLaDOS_voice_lines/fr");
const html = await res.text();
const portalTwoRelatedStuff = html.split(`id="Portal_2"`).pop();

let matches = [...portalTwoRelatedStuff.matchAll(/<li>.*<\/li>/g)];

let samples = [];

matches.forEach((match) => {
  let audioLink = match[0]
  .split(`class="internal"`)[0]
  .split(`href="`)
  .pop()
  .replaceAll(`"`, "")
  .replace(" ", "")

  let text = match[0].split(`</a>`)[0].split(">").pop().replaceAll(`"`, "").replaceAll("&#160;", "").replaceAll(/\[.*\]/g, "")
  if(text)
  {
    try {
      samples.push({
        audioLink,
        text,
      });
    } catch (error) {
      console.log(
        "Error while getting proper values for match : ",
        match,
        ", skipping."
      );
    }
  }
});

fs.writeFileSync(`./metadata.csv`, "");

for (let i = 0; i < samples.length; i++) {
  const element = samples[i];
  if(!element.audioLink) {
    console.log("Element had invalid values, skipping", element);
    continue;
  }

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
    fs.appendFileSync(`./metadata.csv`, `\n${i}|"${element.text}"`);
}
