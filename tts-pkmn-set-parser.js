const { debug } = require("console");
var fs = require("fs");
var path = require("path");

const setMappingJsonPath = "./set-mapping.json";
const ttsSavedObjDirectory =
  "C:/Users/Anthony/Documents/My Games/Tabletop Simulator/Saves/Saved Objects";
const outputFilePath = "./deck-builder/assets/tts-set-metadata.js";

const setMapIndex = new Map();

// RegEx
const standardSetRegex = new RegExp(/^\((\d{2,3})\) (.*)$/);
const popSeriesRegex = new RegExp(/^(POP Series \d+)$/i);
const promoSetRegex = new RegExp(/^^(.*) Promos$$/i);

if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

fs.readdir(ttsSavedObjDirectory, (err, files) => {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  let matches = [];
  parseSetMappings();

  files.forEach((file) => {
    const fullFilePath = path.join(ttsSavedObjDirectory, file);

    if (file.endsWith(".json")) {
      const fileData = JSON.parse(fs.readFileSync(fullFilePath));

      for (let state of fileData.ObjectStates) {
        matches.push(...recurseContainedObjects(state));
      }
    }
  });

  // Sort all sets by set name
  matches = matches.sort((a, b) =>
    a.setId && b.setId ? a.setId.localeCompare(b.setId) : -1
  );

  fs.writeFileSync(
    outputFilePath,
    `const ttsSetMetadata = ${JSON.stringify(matches)};
    
    const indexedSetMetadata = new Map(ttsSetMetadata.map(set => [set.setAbbr, { ...set, cards: new Map(set.cards.map((card) => [card.name, card.id])) }]));`,
    "utf8"
  );
});

function isStandardSet(name) {
  return standardSetRegex.test(name);
}

function isPromoSet(name) {
  return promoSetRegex.test(name);
}

function isPopSeriesSet(name) {
  return popSeriesRegex.test(name);
}

function getSetNameForSpecialCase(deckName) {
  let name = deckName;

  switch (deckName) {
    case "Pokémon Futsal Collection":
      name = "Pokémon Futsal Promos 2020";
      break;
    case "SWSH Shining Fates":
      name = "Shining Fates";
      break;
    case "SWSH Crown Zenith":
      name = "Crown Zenith";
      break;
    case "(59a) XY Kalos Starter Set":
      name = "Kalos Starter Set";
      break;
    case "(63a) XY Double Crisis":
      name = "Double Crisis";
      break;
    case "(53a) BW Dragon Vault":
      name = "Dragon Vault";
      break;
    default:
      break;
  }

  return name;
}

function isSpecialSetCase(name) {
  const specialCases = [
    "Pokémon GO",
    "Celebrations",
    "Pokémon Futsal Collection", // Pokémon Futsal Promos 2020
    "SWSH Shining Fates", // Shining Fates
    "SWSH Crown Zenith", // Crown Zenith
    "Detective Pikachu",
    "(59a) XY Kalos Starter Set", // Kalos Starter Set
    "(63a) XY Double Crisis", // Double Crisis
    "(53a) BW Dragon Vault", // Dragon Vault
  ];

  return specialCases.includes(name);
}

/**
 * Parses the set-mappings.json file into a hash map.
 */
function parseSetMappings() {
  const mapping = JSON.parse(fs.readFileSync(setMappingJsonPath));

  for (const set of mapping) {
    setMapIndex.set(set.name, set.abbr);
  }
}

/**
 * Recurses through all "Contained Object" properties of a provided TTS Saved Object.
 * This function will return all matches where the "Name" property is "deck" AND
 * the "Nickname" property matches the supplied regex.
 */
function recurseContainedObjects(obj) {
  let matches = [];

  if (obj.ContainedObjects) {
    for (let cObj of obj.ContainedObjects) {
      const objName = cObj.Name.toLowerCase();

      if (objName === "deck") {
        let parsedSetId = null;
        let parsedSetName = null;
        let deckName = cObj.Nickname;

        if (isStandardSet(deckName)) {
          const setRegexMatch = standardSetRegex.exec(deckName);

          const parsedSetNameMatch = new RegExp(
            /^(BW|DP|EX|HS|PL|SM|SWSH|XY)?\s*(.*)$/
          ).exec(setRegexMatch[2]);

          parsedSetId = setRegexMatch[1];
          parsedSetName = parsedSetNameMatch[2];
          parsedSetAbbr = setMapIndex.get(parsedSetName);

          if (!setMapIndex.get(parsedSetName)) {
            parsedSetName = handleParsedSetNameMismatches(parsedSetNameMatch);
            parsedSetAbbr = setMapIndex.get(parsedSetName);
          }
        } else if (isPromoSet(deckName)) {
          parsedSetId = null;
          parsedSetName = cObj.Nickname;
          parsedSetAbbr = getSetAbbrForPromoSet(cObj.Nickname);
        } else if (isPopSeriesSet(deckName)) {
          parsedSetId = null;
          parsedSetName = deckName.replaceAll("Pop", "POP");
          parsedSetAbbr = setMapIndex.get(parsedSetName);
        } else if (isSpecialSetCase(deckName)) {
          parsedSetId = null;
          parsedSetName = getSetNameForSpecialCase(deckName);
          parsedSetAbbr = setMapIndex.get(parsedSetName);
        }

        if (parsedSetName !== null) {
          matches.push({
            setId: parsedSetId,
            setName: parsedSetName,
            setAbbr: parsedSetAbbr,
            deckAssets: cObj.CustomDeck,
            cards: cObj.ContainedObjects.map((card) => ({
              id: card.CardID,
              name: card.Nickname,
            })),
          });
        }
        //  else {
        //   if (!deckName.endsWith("Deck")) {
        //     console.log(cObj.Nickname);
        //   }
        // }
      }

      matches.push(...recurseContainedObjects(cObj));
    }
  }

  return matches;
}

function getSetAbbrForPromoSet(setName) {
  let abbr = null;

  switch (setName) {
    case "Scarlet & Violet Promos":
      // @TODO - This set isn't released. Need to confirm the abbr.
      abbr = "PR-SV";
      break;
    case "XY Promos":
      abbr = "PR-XY";
      break;
    case "Sword & Shield Promos":
      abbr = "PR-SW";
      break;
    case "Sun & Moon Promos":
      abbr = "PR-SM";
      break;
    case "Black & White Promos":
      abbr = "PR-BLW";
      break;
    case "HeartGold & SoulSilver Promos":
      abbr = "PR-HS";
      break;
    case "Diamond & Pearl Promos":
      abbr = "PR-DPP";
      break;
    case "Wizards Star Promos":
      abbr = "PR";
      break;
    case "Nintendo Star Promos":
      abbr = "PR-NP";
      break;
    default:
      break;
  }

  return abbr;
}

/**
 * Handles any irregular cases with the regex matching where
 * no matching value is found in the set-mapping.json
 */
function handleParsedSetNameMismatches(parsedNameRegex) {
  let value = "";

  if (parsedNameRegex[2] != "") {
    switch (parsedNameRegex[2]) {
      case "Burning Shadow":
        value = "Burning Shadows";
        break;
      case "Expedition Base Set":
        value = "Expedition";
        break;
      case "Power Keeper":
        value = "Power Keepers";
        break;
    }
  } else {
    value = parsedNameRegex[1];
  }

  return value;
}
