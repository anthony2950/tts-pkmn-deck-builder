function generateObjectUid() {
  return crypto.randomUUID().substr(-6);
}

function getNewDeck(name, description) {
  const deck = structuredClone(EMPTY_DECK);
  deck.GUID = generateObjectUid();
  deck.Nickname = name || "";
  deck.Description = description || "";
  return deck;
}

function getNewCard(id, name, description) {
  const card = structuredClone(EMPTY_CARD);
  card.GUID = generateObjectUid();
  card.Nickname = name || "";
  card.Description = description || "";
  card.CardID = id;
  return card;
}

function wrapDeckForExport(deck) {
  const wrapper = structuredClone(DECK_WRAPPER);
  wrapper.ObjectStates.push(deck);
  return wrapper;
}

function addCardsToDeck(deck, cardData, assetSheet) {
  // Determine the asset sheet this card is associated with, and if it exists already
  const assetSheetId = Object.keys(deck.CustomDeck).length + 1;
  deck.CustomDeck[assetSheetId] = assetSheet;

  for (const data of cardData) {
    const cardId = parseInt(
      assetSheetId.toString() + data.id.toString().padStart(2, "0")
    );

    const card = getNewCard(cardId, data.name);
    card.CustomDeck[assetSheetId] = assetSheet;

    for (let i = 0; i < data.quantity; i++) {
      deck.DeckIDs.unshift(cardId);
      deck.ContainedObjects.unshift(card);
    }
  }
}

const EMPTY_DECK = {
  GUID: "",
  Name: "Deck",
  Transform: {
    posX: 0,
    posY: 0,
    posZ: 0,
    rotX: 0,
    rotY: 180,
    rotZ: 0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
  },
  Nickname: "",
  Description: "",
  GMNotes: "",
  AltLookAngle: {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  },
  ColorDiffuse: {
    r: 0.713235259,
    g: 0.713235259,
    b: 0.713235259,
  },
  LayoutGroupSortIndex: 0,
  Value: 0,
  Locked: false,
  Grid: true,
  Snap: true,
  IgnoreFoW: false,
  MeasureMovement: false,
  DragSelectable: true,
  Autoraise: true,
  Sticky: true,
  Tooltip: true,
  GridProjection: false,
  HideWhenFaceDown: true,
  Hands: false,
  SidewaysCard: false,
  DeckIDs: [],
  CustomDeck: {},
  LuaScript: "",
  LuaScriptState: "",
  XmlUI: "",
  ContainedObjects: [],
};

const EMPTY_CARD = {
  GUID: "",
  Name: "Card",
  Transform: {
    posX: 0,
    posY: 0,
    posZ: 0,
    rotX: 0,
    rotY: 180,
    rotZ: 0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
  },
  Nickname: "",
  Description: "",
  GMNotes: "",
  AltLookAngle: {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  },
  ColorDiffuse: {
    r: 0.713235259,
    g: 0.713235259,
    b: 0.713235259,
  },
  LayoutGroupSortIndex: 0,
  Value: 0,
  Locked: false,
  Grid: true,
  Snap: true,
  IgnoreFoW: false,
  MeasureMovement: false,
  DragSelectable: true,
  Autoraise: true,
  Sticky: true,
  Tooltip: true,
  GridProjection: false,
  HideWhenFaceDown: true,
  Hands: true,
  CardID: 0,
  SidewaysCard: false,
  CustomDeck: {},
  LuaScript: "",
  LuaScriptState: "",
  XmlUI: "",
};

const DECK_WRAPPER = {
  SaveName: "",
  Date: "",
  VersionNumber: "",
  GameMode: "",
  GameType: "",
  GameComplexity: "",
  Tags: [],
  Gravity: 0.5,
  PlayArea: 0.5,
  Table: "",
  Sky: "",
  Note: "",
  TabStates: {},
  LuaScript: "",
  LuaScriptState: "",
  XmlUI: "",
  ObjectStates: [],
};
