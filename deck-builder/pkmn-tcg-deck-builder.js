const dlGroupRegex = new RegExp(/^\s*(Pok[eé]mon|Energy|Trainer).*/);
const dlItemRegex = new RegExp(/^(\d{1,}) (\D*) (.*) (?:\D)*(\d{1,})$/);
const whitespaceRegex = new RegExp(/^\s*$/);

function addToDeckList(decklist, assetData, cardData) {
  if (!decklist.has(assetData.FaceURL)) {
    decklist.set(assetData.FaceURL, {
      assetData,
      cardData: [],
    });
  }

  const assembledAssetData = decklist.get(assetData.FaceURL);
  assembledAssetData.cardData.push(cardData);
}

function cleanCardName(name) {
  return (
    name
      // Clean all names ending in V, VMAX, or VSTAR to include a dash. This is how TTS handles these names.
      .replaceAll(/ (V(?:MAX)?(?:STAR)?)$/gi, "-$1")
      // Clean all names matching "(Description) (Type) Energy" to now be "(Description) (First Letter of Type) Energy".
      //.replaceAll(/((?:\w+ )+)(.)\w+( Energy)/gi, "$1$2$3")
      .replaceAll(/((?:\b(?!Double)\b\w+ )+)(.)\w+( Energy)/gi, "$1$2$3")
      // Clean all backticks and change to single quotes.
      .replaceAll("`", "'")
  );
}

function exportDeck(deck) {
  const deckName =
    document.getElementById("deckName").value || generateObjectUid();

  const deckData =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(deck));

  var dlLink = document.createElement("a");
  dlLink.href = deckData;
  dlLink.download = `${deckName}.json`;
  document.body.appendChild(dlLink);
  dlLink.click();

  // Download the card back as well
  dlLink.href = CARD_BACK_BASE64;
  dlLink.download = `${deckName}.png`;
  dlLink.click();

  dlLink.remove();
}

function generateDeck() {
  const { decklist, warnings, errors } = parseDecklist();

  warnings.forEach((warning) => `WARNING: ${console.log(warning)}`);
  errors.forEach((error) => `ERROR: ${console.log(error)}`);

  document.getElementById("parseDecklistWarningMessage").innerHTML =
    "<ul>" +
    warnings.map((warning) => `<li>${warning}</li>`).join("") +
    "</ul>";

  document.getElementById("parseDecklistErrorMessage").innerHTML =
    "<ul>" + errors.map((error) => `<li>${error}</li>`).join("") + "</ul>";

  deck = prepareDecklistDownload(decklist);
  exportDeck(deck);
}

function getEnergyCardMetadata(energyType, quantity) {
  let metadata = null;
  let assetUrl = null;
  let cardId = null;

  switch (energyType) {
    case "Metal":
      assetUrl = "https://i.imgur.com/uKT9NX3.jpg";
      cardId = 829;
      break;
    case "Darkness":
      assetUrl = "https://i.imgur.com/uKT9NX3.jpg";
      cardId = 828;
      break;
    case "Lightning":
      assetUrl = "https://i.imgur.com/uKT9NX3.jpg";
      cardId = 827;
      break;
    case "Fighting":
      assetUrl = "https://i.imgur.com/S2NzT92.jpg";
      cardId = 1025;
      break;
    case "Psychic":
      assetUrl = "https://i.imgur.com/S2NzT92.jpg";
      cardId = 1024;
      break;
    case "Water":
      assetUrl = "https://i.imgur.com/S2NzT92.jpg";
      cardId = 1023;
      break;
    case "Fire":
      assetUrl = "https://i.imgur.com/iRtj50x.jpg";
      cardId = 1007;
      break;
    case "Grass":
      assetUrl = "https://i.imgur.com/iRtj50x.jpg";
      cardId = 1006;
      break;
    case "Fairy":
      assetUrl = "https://i.imgur.com/qvHhlzK.jpg";
      cardId = 638;
      break;
    default:
      break;
  }

  if (assetUrl && cardId) {
    metadata = {
      assetData: {
        FaceURL: assetUrl,
        BackURL:
          "http://cloud-3.steamusercontent.com/ugc/993492320947720504/9BE66430CD3C340060773E321DDD5FD86C1F2703/",
        NumWidth: 10,
        NumHeight: 7,
        BackIsHidden: true,
        UniqueBack: false,
        Type: 0,
      },
      cardData: {
        id: parseCardIdFromReferenceId(cardId.toString()),
        name: `${energyType} Energy`,
        quantity,
      },
    };
  }

  return metadata;
}

/**
 * Determine if the set abbreviation is "Energy", this will happen in cases where no set is provided for an energy card.
 */
function isEnergyCard(setAbbr) {
  return setAbbr === "Energy";
}

/**
 * Determine if the line is a group header (i.e. Energy Cards - 22)
 */
function isListHeader(value) {
  return dlGroupRegex.test(value);
}

/**
 * Determines if the entire line is whitespace.
 */
function isWhitespace(value) {
  return whitespaceRegex.test(value);
}

function parseCardIdFromReferenceId(referenceId) {
  return parseInt(referenceId.substr(-2));
}

function parseDecklist() {
  const parsingErrors = [];
  const parsingWarnings = [];
  const builtDecklist = new Map();
  const unparsedDecklist = document.getElementById("decklistArea").value;
  const decklistParts = unparsedDecklist
    .split(/\r?\n|\r|\n/g)
    .map((part) => part.trim());

  for (const part of decklistParts) {
    // Determine if the line is a group header (i.e. Energy Cards - 22)
    if (isListHeader(part) || isWhitespace(part)) {
      continue;
    }

    const deckItemParts = dlItemRegex.exec(part);

    if (deckItemParts) {
      const quantity = parseInt(deckItemParts[1]);
      let cardName = deckItemParts[2];
      const setAbbr = deckItemParts[3];
      const setNumber = deckItemParts[4];

      if (indexedSetMetadata.has(setAbbr)) {
        const ttsSetData = indexedSetMetadata.get(setAbbr);
        let ttsCardData = null;
        let referenceId = null;

        if (!ttsSetData.cards.has(cardName)) {
          cardName = cleanCardName(cardName);
        }

        if (ttsSetData.cards.has(cardName)) {
          ttsCardData = ttsSetData.cards.get(cardName);
          referenceId = ttsCardData.toString();
        } else {
          // Some cards aren't labeled properly in TTS, we can try and guess which card
          // should be added to the deck as long as it's numbered correctly.
          if (setNumber) {
            const guessIndex = parseInt(setNumber) - 1;
            const cardsOrderedById = Array.from(ttsSetData.cards).sort((a, b) =>
              a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0
            );

            if (cardsOrderedById.length > guessIndex) {
              ttsCardData = ttsSetData.cards.get(
                cardsOrderedById[guessIndex][1]
              );

              if (ttsCardData) {
                referenceId = ttsCardData.toString();

                parsingWarnings.push(
                  `Unable to find card with name: <strong>${cardName}</strong> from set <strong>${setAbbr}</strong>. An attempt was made to get this card by set number but may not be correct. Please double check after importing to TTS.`
                );
              } else {
                parsingErrors.push(
                  `Unable to find card with name: <strong>${cardName}</strong> from set <strong>${setAbbr}</strong>`
                );
                continue;
              }
            } else {
              parsingErrors.push(
                `Unable to find card with name: <strong>${cardName}</strong> from set <strong>${setAbbr}</strong>`
              );
              continue;
            }
          } else {
            parsingErrors.push(
              `Unable to find card with name: <strong>${cardName}</strong> from set <strong>${setAbbr}</strong>`
            );
            continue;
          }
        }

        // All digits except the last two are the asset sheet Id
        const assetId = parseInt(
          referenceId.substring(0, referenceId.length - 2)
        );

        // The last two digits are the card Id
        const cardId = parseCardIdFromReferenceId(referenceId);
        const assetData = ttsSetData.deckAssets[assetId];

        addToDeckList(builtDecklist, assetData, {
          id: cardId,
          name: cardName,
          quantity,
        });
      } else if (isEnergyCard(setAbbr)) {
        const energyMetadata = getEnergyCardMetadata(cardName, quantity);

        if (energyMetadata) {
          addToDeckList(
            builtDecklist,
            energyMetadata.assetData,
            energyMetadata.cardData
          );
        } else {
          parsingErrors.push(
            `Found energy card ${cardName} ${setAbbr} without a defined set and could not parse.`
          );
        }
      } else {
        parsingErrors.push(`Unable to parse set: ${setAbbr}`);
        continue;
      }
    } else {
      parsingErrors.push(`Error parsing deck item part: ${part}`);
      continue;
    }
  }
  return {
    decklist: builtDecklist,
    warnings: parsingWarnings,
    errors: parsingErrors,
  };
}

function prepareDecklistDownload(decklist) {
  let deck = getNewDeck();

  for (const { assetData, cardData } of Array.from(decklist.values())) {
    addCardsToDeck(deck, cardData, assetData);
  }

  deck = wrapDeckForExport(deck);

  return deck;
}

function deckNameChanged(event) {
  localStorage.setItem("deckNameValue", event.target.value);
}

function textareaChanged(event) {
  localStorage.setItem("editorTextValue", event.target.value);
}

window.onload = () => {
  document.getElementById("deckName").value =
    localStorage.getItem("deckNameValue");

  document.getElementById("decklistArea").value =
    localStorage.getItem("editorTextValue");
};
