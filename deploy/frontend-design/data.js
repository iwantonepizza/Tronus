
// GOT Tracker — Mock Data
// All data exported to window.GOT

(function() {
'use strict';

const FACTIONS = {
  stark:     { slug: 'stark',     name: 'Старки',      color: '#6B7B8C', onPrimary: '#F0F0F0', emoji: '🐺' },
  lannister: { slug: 'lannister', name: 'Ланнистеры',  color: '#9B2226', onPrimary: '#F5E6C8', emoji: '🦁' },
  baratheon: { slug: 'baratheon', name: 'Баратеоны',   color: '#F0B323', onPrimary: '#1A1A22', emoji: '🦌' },
  greyjoy:   { slug: 'greyjoy',   name: 'Грейджои',    color: '#1C3B47', onPrimary: '#E0E6E8', emoji: '🦑' },
  tyrell:    { slug: 'tyrell',    name: 'Тиреллы',     color: '#4B6B3A', onPrimary: '#F0E6D2', emoji: '🌹' },
  martell:   { slug: 'martell',   name: 'Мартеллы',    color: '#C94E2A', onPrimary: '#F5E6C8', emoji: '☀️' },
  tully:     { slug: 'tully',     name: 'Талли',       color: '#4B6FA5', onPrimary: '#F0E6D2', emoji: '🐟' },
  arryn:     { slug: 'arryn',     name: 'Аррены',      color: '#8AAFC8', onPrimary: '#1A2A3A', emoji: '🦅' },
  targaryen: { slug: 'targaryen', name: 'Таргариены',  color: '#5B2D8A', onPrimary: '#E0D0F0', emoji: '🐉' },
};

const MODES = {
  classic:     { slug: 'classic',     name: 'Классика',     minPlayers: 3, maxPlayers: 6 },
  quests:      { slug: 'quests',      name: 'Квесты',       minPlayers: 3, maxPlayers: 6 },
  alternative: { slug: 'alternative', name: 'Альтернатива', minPlayers: 3, maxPlayers: 6 },
  dragons:     { slug: 'dragons',     name: 'Драконы',      minPlayers: 3, maxPlayers: 6 },
};

const DECKS = {
  original:    { slug: 'original',    name: 'Оригинальная' },
  expansion_a: { slug: 'expansion_a', name: 'Расширение A' },
  expansion_b: { slug: 'expansion_b', name: 'Расширение B' },
};

const PLAYERS = [
  { id: 1, nickname: 'IronFist',  favoriteFaction: 'lannister', currentAvatarUrl: null, dateJoined: '2024-03-15' },
  { id: 2, nickname: 'Kraken42',  favoriteFaction: 'greyjoy',   currentAvatarUrl: null, dateJoined: '2024-03-15' },
  { id: 3, nickname: 'DireWolf',  favoriteFaction: 'stark',     currentAvatarUrl: null, dateJoined: '2024-03-20' },
  { id: 4, nickname: 'GoldHand',  favoriteFaction: 'baratheon', currentAvatarUrl: null, dateJoined: '2024-04-01' },
  { id: 5, nickname: 'RedViper',  favoriteFaction: 'martell',   currentAvatarUrl: null, dateJoined: '2024-04-10' },
  { id: 6, nickname: 'FireQueen', favoriteFaction: 'targaryen', currentAvatarUrl: null, dateJoined: '2024-04-10' },
  { id: 7, nickname: 'Frey73',    favoriteFaction: null,        currentAvatarUrl: null, dateJoined: '2024-05-01' },
  { id: 8, nickname: 'Bookworm',  favoriteFaction: 'tyrell',    currentAvatarUrl: null, dateJoined: '2024-05-15' },
];

function p(id) { return PLAYERS.find(x => x.id === id); }
function f(slug) { return FACTIONS[slug]; }

const SESSIONS = [
  // Session 1 - completed, classic, IronFist wins
  {
    id: 1, scheduledAt: '2024-06-08T18:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(1), status: 'completed', planningNote: 'Первая серьёзная партия сезона',
    participations: [
      { id:1, user: p(1), faction: 'lannister', place: 1, castles: 7, isWinner: true },
      { id:2, user: p(3), faction: 'stark',     place: 2, castles: 5, isWinner: false },
      { id:3, user: p(2), faction: 'greyjoy',   place: 3, castles: 4, isWinner: false },
      { id:4, user: p(4), faction: 'baratheon', place: 4, castles: 3, isWinner: false },
      { id:5, user: p(5), faction: 'martell',   place: 5, castles: 2, isWinner: false },
    ],
    outcome: { roundsPlayed: 9, endReason: 'castles_7', mvp: p(1), finalNote: 'IronFist полностью доминировал с юга' },
    commentsCount: 5, votes: [
      { id:1, fromUser: p(3), toUser: p(1), voteType: 'positive', createdAt: '2024-06-08T22:00:00' },
      { id:2, fromUser: p(2), toUser: p(1), voteType: 'positive', createdAt: '2024-06-08T22:05:00' },
      { id:3, fromUser: p(1), toUser: p(5), voteType: 'negative', createdAt: '2024-06-08T22:10:00' },
      { id:4, fromUser: p(4), toUser: p(2), voteType: 'negative', createdAt: '2024-06-08T22:15:00' },
    ],
    comments: [
      { id:1, author: p(3), body: 'Классная партия, но Ланнистер нас всех задушил к 7 раунду', createdAt: '2024-06-08T22:30:00', editedAt: null },
      { id:2, author: p(2), body: 'Морские дороги забиты, я ничего не мог сделать', createdAt: '2024-06-08T22:35:00', editedAt: null },
      { id:3, author: p(1), body: 'Ребята, просто лучше читайте порядок хода 😈', createdAt: '2024-06-08T22:40:00', editedAt: null },
      { id:4, author: p(5), body: 'Мартелл снова в аутсайдерах... Это уже система', createdAt: '2024-06-08T23:00:00', editedAt: null },
      { id:5, author: p(4), body: 'Следующий раз я за что-то другое', createdAt: '2024-06-09T09:00:00', editedAt: null },
    ]
  },
  // Session 2 - completed, quests, FireQueen wins
  {
    id: 2, scheduledAt: '2024-06-22T19:00:00', mode: MODES.quests, deck: DECKS.expansion_a,
    createdBy: p(6), status: 'completed', planningNote: '',
    participations: [
      { id:6,  user: p(6), faction: 'targaryen', place: 1, castles: 7, isWinner: true },
      { id:7,  user: p(8), faction: 'tyrell',    place: 2, castles: 6, isWinner: false },
      { id:8,  user: p(1), faction: 'lannister', place: 3, castles: 5, isWinner: false },
      { id:9,  user: p(4), faction: 'baratheon', place: 4, castles: 3, isWinner: false },
      { id:10, user: p(7), faction: 'stark',     place: 5, castles: 2, isWinner: false },
      { id:11, user: p(2), faction: 'greyjoy',   place: 6, castles: 1, isWinner: false },
    ],
    outcome: { roundsPlayed: 8, endReason: 'castles_7', mvp: p(6), finalNote: 'FireQueen в своём стиле — тихо и убийственно' },
    commentsCount: 3, votes: [
      { id:5, fromUser: p(8), toUser: p(6), voteType: 'positive', createdAt: '2024-06-22T23:00:00' },
      { id:6, fromUser: p(1), toUser: p(6), voteType: 'positive', createdAt: '2024-06-22T23:05:00' },
      { id:7, fromUser: p(4), toUser: p(7), voteType: 'positive', createdAt: '2024-06-22T23:10:00' },
      { id:8, fromUser: p(6), toUser: p(2), voteType: 'negative', createdAt: '2024-06-22T23:15:00' },
    ],
    comments: [
      { id:6, author: p(8), body: 'Почти взял, Таргариен был уже на 7 замков, а я на 6...', createdAt: '2024-06-22T23:30:00', editedAt: null },
      { id:7, author: p(6), body: 'Квесты — мой режим. Обожаю его 🐉', createdAt: '2024-06-22T23:35:00', editedAt: null },
      { id:8, author: p(2), body: 'Грейджой не для квестов, больше не буду', createdAt: '2024-06-23T10:00:00', editedAt: null },
    ]
  },
  // Session 3 - completed, Bookworm wins
  {
    id: 3, scheduledAt: '2024-07-06T18:30:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(1), status: 'completed', planningNote: '',
    participations: [
      { id:12, user: p(8), faction: 'tyrell',    place: 1, castles: 7, isWinner: true },
      { id:13, user: p(5), faction: 'martell',   place: 2, castles: 5, isWinner: false },
      { id:14, user: p(3), faction: 'stark',     place: 3, castles: 4, isWinner: false },
      { id:15, user: p(1), faction: 'lannister', place: 4, castles: 3, isWinner: false },
    ],
    outcome: { roundsPlayed: 10, endReason: 'castles_7', mvp: p(8), finalNote: 'Bookworm читал книги и всех обыграл' },
    commentsCount: 2, votes: [
      { id:9,  fromUser: p(5), toUser: p(8), voteType: 'positive', createdAt: '2024-07-06T22:00:00' },
      { id:10, fromUser: p(3), toUser: p(8), voteType: 'positive', createdAt: '2024-07-06T22:05:00' },
      { id:11, fromUser: p(1), toUser: p(3), voteType: 'negative', createdAt: '2024-07-06T22:10:00' },
    ],
    comments: [
      { id:9,  author: p(8), body: 'Тиреллы имбовые в 4х человек, проверено', createdAt: '2024-07-06T22:40:00', editedAt: null },
      { id:10, author: p(1), body: 'В следующий раз буду знать...', createdAt: '2024-07-07T09:00:00', editedAt: null },
    ]
  },
  // Session 4
  {
    id: 4, scheduledAt: '2024-07-20T19:00:00', mode: MODES.alternative, deck: DECKS.expansion_b,
    createdBy: p(2), status: 'completed', planningNote: 'Попробуем альтернативный режим',
    participations: [
      { id:16, user: p(2), faction: 'greyjoy',   place: 1, castles: 7, isWinner: true },
      { id:17, user: p(6), faction: 'targaryen', place: 2, castles: 6, isWinner: false },
      { id:18, user: p(4), faction: 'baratheon', place: 3, castles: 4, isWinner: false },
      { id:19, user: p(7), faction: 'tully',     place: 4, castles: 2, isWinner: false },
      { id:20, user: p(5), faction: 'martell',   place: 5, castles: 1, isWinner: false },
    ],
    outcome: { roundsPlayed: 11, endReason: 'castles_7', mvp: p(2), finalNote: 'Kraken42 показал что Грейджой — это сила в море' },
    commentsCount: 4, votes: [
      { id:12, fromUser: p(6), toUser: p(2), voteType: 'positive', createdAt: '2024-07-20T23:00:00' },
      { id:13, fromUser: p(4), toUser: p(2), voteType: 'positive', createdAt: '2024-07-20T23:05:00' },
      { id:14, fromUser: p(2), toUser: p(7), voteType: 'negative', createdAt: '2024-07-20T23:10:00' },
      { id:15, fromUser: p(7), toUser: p(5), voteType: 'negative', createdAt: '2024-07-20T23:15:00' },
    ],
    comments: [
      { id:11, author: p(2), body: 'Наконец-то! Кракен торжествует!', createdAt: '2024-07-20T23:30:00', editedAt: null },
      { id:12, author: p(6), body: 'Kraken42 реально мощный когда за своих играет', createdAt: '2024-07-20T23:35:00', editedAt: null },
      { id:13, author: p(7), body: 'Талли — это не моё, слишком пассивно', createdAt: '2024-07-21T09:00:00', editedAt: null },
      { id:14, author: p(4), body: 'Барат снова без победы, грусть', createdAt: '2024-07-21T10:00:00', editedAt: null },
    ]
  },
  // Session 5
  {
    id: 5, scheduledAt: '2024-08-03T18:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(3), status: 'completed', planningNote: '',
    participations: [
      { id:21, user: p(3), faction: 'stark',     place: 1, castles: 7, isWinner: true },
      { id:22, user: p(1), faction: 'lannister', place: 2, castles: 5, isWinner: false },
      { id:23, user: p(6), faction: 'targaryen', place: 3, castles: 5, isWinner: false },
      { id:24, user: p(8), faction: 'tyrell',    place: 4, castles: 4, isWinner: false },
      { id:25, user: p(2), faction: 'greyjoy',   place: 5, castles: 3, isWinner: false },
      { id:26, user: p(5), faction: 'martell',   place: 6, castles: 2, isWinner: false },
    ],
    outcome: { roundsPlayed: 9, endReason: 'castles_7', mvp: p(3), finalNote: 'DireWolf играл идеально с севера' },
    commentsCount: 3, votes: [
      { id:16, fromUser: p(1), toUser: p(3), voteType: 'positive', createdAt: '2024-08-03T22:30:00' },
      { id:17, fromUser: p(6), toUser: p(3), voteType: 'positive', createdAt: '2024-08-03T22:35:00' },
      { id:18, fromUser: p(3), toUser: p(5), voteType: 'negative', createdAt: '2024-08-03T22:40:00' },
    ],
    comments: [
      { id:15, author: p(3), body: 'Наконец Север победил!', createdAt: '2024-08-03T22:50:00', editedAt: null },
      { id:16, author: p(5), body: 'Я реально не понимаю как играть Мартелл в 6 игроков', createdAt: '2024-08-04T09:00:00', editedAt: null },
      { id:17, author: p(8), body: 'Тиреллы с 4 замками... позор', createdAt: '2024-08-04T10:00:00', editedAt: null },
    ]
  },
  // Session 6
  {
    id: 6, scheduledAt: '2024-08-17T19:30:00', mode: MODES.dragons, deck: DECKS.expansion_a,
    createdBy: p(6), status: 'completed', planningNote: 'Первый раз пробуем Драконов',
    participations: [
      { id:27, user: p(6), faction: 'targaryen', place: 1, castles: 7, isWinner: true },
      { id:28, user: p(1), faction: 'lannister', place: 2, castles: 5, isWinner: false },
      { id:29, user: p(4), faction: 'baratheon', place: 3, castles: 4, isWinner: false },
      { id:30, user: p(3), faction: 'stark',     place: 4, castles: 3, isWinner: false },
    ],
    outcome: { roundsPlayed: 8, endReason: 'castles_7', mvp: p(6), finalNote: 'Таргариен в режиме Драконов — это читерство' },
    commentsCount: 5, votes: [
      { id:19, fromUser: p(1), toUser: p(6), voteType: 'positive', createdAt: '2024-08-17T23:00:00' },
      { id:20, fromUser: p(4), toUser: p(6), voteType: 'negative', createdAt: '2024-08-17T23:05:00' },
      { id:21, fromUser: p(3), toUser: p(6), voteType: 'negative', createdAt: '2024-08-17T23:10:00' },
      { id:22, fromUser: p(6), toUser: p(4), voteType: 'negative', createdAt: '2024-08-17T23:15:00' },
    ],
    comments: [
      { id:18, author: p(4), body: 'Это должно быть запрещено. Таргариен + Драконы = невозможно', createdAt: '2024-08-17T23:30:00', editedAt: null },
      { id:19, author: p(6), body: 'Жалуйтесь сколько хотите 🐉🔥', createdAt: '2024-08-17T23:35:00', editedAt: null },
      { id:20, author: p(3), body: 'Предлагаю бан Таргариена в режиме Драконов', createdAt: '2024-08-17T23:40:00', editedAt: null },
      { id:21, author: p(1), body: 'Объективно она сыграла безупречно', createdAt: '2024-08-17T23:45:00', editedAt: null },
      { id:22, author: p(4), body: 'Ладно... следующий раз я за Таргов', createdAt: '2024-08-18T09:00:00', editedAt: null },
    ]
  },
  // Session 7
  {
    id: 7, scheduledAt: '2024-09-07T18:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(1), status: 'completed', planningNote: '',
    participations: [
      { id:31, user: p(8), faction: 'tyrell',    place: 1, castles: 7, isWinner: true },
      { id:32, user: p(2), faction: 'greyjoy',   place: 2, castles: 6, isWinner: false },
      { id:33, user: p(5), faction: 'martell',   place: 3, castles: 4, isWinner: false },
      { id:34, user: p(7), faction: 'baratheon', place: 4, castles: 3, isWinner: false },
      { id:35, user: p(1), faction: 'lannister', place: 5, castles: 2, isWinner: false },
      { id:36, user: p(4), faction: 'stark',     place: 6, castles: 1, isWinner: false },
    ],
    outcome: { roundsPlayed: 10, endReason: 'castles_7', mvp: p(8), finalNote: 'Bookworm снова показал что Тиреллы в его руках — топ' },
    commentsCount: 2, votes: [
      { id:23, fromUser: p(2), toUser: p(8), voteType: 'positive', createdAt: '2024-09-07T22:30:00' },
      { id:24, fromUser: p(5), toUser: p(8), voteType: 'positive', createdAt: '2024-09-07T22:35:00' },
      { id:25, fromUser: p(1), toUser: p(7), voteType: 'negative', createdAt: '2024-09-07T22:40:00' },
    ],
    comments: [
      { id:23, author: p(1), body: 'Проиграл Тиреллу с 5 замками... грустно', createdAt: '2024-09-07T22:50:00', editedAt: null },
      { id:24, author: p(8), body: 'Книги учат терпению 📚', createdAt: '2024-09-07T23:00:00', editedAt: null },
    ]
  },
  // Session 8
  {
    id: 8, scheduledAt: '2024-09-21T19:00:00', mode: MODES.quests, deck: DECKS.expansion_a,
    createdBy: p(5), status: 'completed', planningNote: 'Реванш для RedViper',
    participations: [
      { id:37, user: p(5), faction: 'martell',   place: 1, castles: 7, isWinner: true },
      { id:38, user: p(3), faction: 'stark',     place: 2, castles: 5, isWinner: false },
      { id:39, user: p(6), faction: 'targaryen', place: 3, castles: 5, isWinner: false },
      { id:40, user: p(1), faction: 'lannister', place: 4, castles: 3, isWinner: false },
      { id:41, user: p(2), faction: 'greyjoy',   place: 5, castles: 2, isWinner: false },
    ],
    outcome: { roundsPlayed: 12, endReason: 'castles_7', mvp: p(5), finalNote: 'Самая долгая партия — 4 часа! Мартелл взял своё' },
    commentsCount: 4, votes: [
      { id:26, fromUser: p(3), toUser: p(5), voteType: 'positive', createdAt: '2024-09-21T23:30:00' },
      { id:27, fromUser: p(1), toUser: p(5), voteType: 'positive', createdAt: '2024-09-21T23:35:00' },
      { id:28, fromUser: p(5), toUser: p(2), voteType: 'negative', createdAt: '2024-09-21T23:40:00' },
      { id:29, fromUser: p(2), toUser: p(5), voteType: 'negative', createdAt: '2024-09-21T23:45:00' },
    ],
    comments: [
      { id:25, author: p(5), body: '12 раундов. Мы играли 4 часа. И я победил. Это лучший день', createdAt: '2024-09-21T23:50:00', editedAt: null },
      { id:26, author: p(1), body: 'Реально было 4 часа... но круто', createdAt: '2024-09-22T09:00:00', editedAt: null },
      { id:27, author: p(3), body: 'Самый эпичный камбэк — RedViper с 4-го на 1-е за 3 раунда!', createdAt: '2024-09-22T10:00:00', editedAt: null },
      { id:28, author: p(6), body: 'Я тоже была близко... Таргариен и Мартелл — вечные соперники', createdAt: '2024-09-22T11:00:00', editedAt: null },
    ]
  },
  // Session 9
  {
    id: 9, scheduledAt: '2024-10-05T18:30:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(2), status: 'completed', planningNote: '',
    participations: [
      { id:42, user: p(1), faction: 'lannister', place: 1, castles: 7, isWinner: true },
      { id:43, user: p(6), faction: 'targaryen', place: 2, castles: 6, isWinner: false },
      { id:44, user: p(8), faction: 'tyrell',    place: 3, castles: 5, isWinner: false },
      { id:45, user: p(2), faction: 'greyjoy',   place: 4, castles: 3, isWinner: false },
      { id:46, user: p(3), faction: 'stark',     place: 5, castles: 2, isWinner: false },
    ],
    outcome: { roundsPlayed: 9, endReason: 'castles_7', mvp: p(1), finalNote: 'Классика Ланнистера' },
    commentsCount: 2, votes: [
      { id:30, fromUser: p(6), toUser: p(1), voteType: 'positive', createdAt: '2024-10-05T22:00:00' },
      { id:31, fromUser: p(1), toUser: p(3), voteType: 'negative', createdAt: '2024-10-05T22:05:00' },
    ],
    comments: [
      { id:29, author: p(3), body: 'Старк 5-й... снова... буду менять тактику', createdAt: '2024-10-05T22:30:00', editedAt: null },
      { id:30, author: p(1), body: 'Тактика? Научись читать карты порядка', createdAt: '2024-10-05T22:35:00', editedAt: null },
    ]
  },
  // Session 10
  {
    id: 10, scheduledAt: '2024-10-19T19:00:00', mode: MODES.alternative, deck: DECKS.expansion_b,
    createdBy: p(8), status: 'completed', planningNote: 'Попробуем другой состав',
    participations: [
      { id:47, user: p(4), faction: 'baratheon', place: 1, castles: 7, isWinner: true },
      { id:48, user: p(7), faction: 'tully',     place: 2, castles: 5, isWinner: false },
      { id:49, user: p(8), faction: 'tyrell',    place: 3, castles: 4, isWinner: false },
      { id:50, user: p(5), faction: 'martell',   place: 4, castles: 3, isWinner: false },
      { id:51, user: p(2), faction: 'greyjoy',   place: 5, castles: 2, isWinner: false },
      { id:52, user: p(6), faction: 'targaryen', place: 6, castles: 1, isWinner: false },
    ],
    outcome: { roundsPlayed: 10, endReason: 'castles_7', mvp: p(4), finalNote: 'Наконец-то Баратеон! GoldHand сделал это!' },
    commentsCount: 3, votes: [
      { id:32, fromUser: p(7), toUser: p(4), voteType: 'positive', createdAt: '2024-10-19T23:00:00' },
      { id:33, fromUser: p(8), toUser: p(4), voteType: 'positive', createdAt: '2024-10-19T23:05:00' },
      { id:34, fromUser: p(6), toUser: p(2), voteType: 'negative', createdAt: '2024-10-19T23:10:00' },
    ],
    comments: [
      { id:31, author: p(4), body: 'БАРАТЕОН ПОБЕДИЛ!!! После 9 попыток!!!', createdAt: '2024-10-19T23:30:00', editedAt: null },
      { id:32, author: p(7), body: 'Наконец-то! Ждали этого 6 месяцев', createdAt: '2024-10-19T23:35:00', editedAt: null },
      { id:33, author: p(6), body: 'Таргариен без драконов — это просто фиолетовый кружок на карте', createdAt: '2024-10-19T23:40:00', editedAt: null },
    ]
  },
  // Session 11
  {
    id: 11, scheduledAt: '2024-11-02T18:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(1), status: 'completed', planningNote: '',
    participations: [
      { id:53, user: p(6), faction: 'targaryen', place: 1, castles: 7, isWinner: true },
      { id:54, user: p(1), faction: 'lannister', place: 2, castles: 5, isWinner: false },
      { id:55, user: p(3), faction: 'stark',     place: 3, castles: 4, isWinner: false },
      { id:56, user: p(5), faction: 'martell',   place: 4, castles: 3, isWinner: false },
    ],
    outcome: { roundsPlayed: 9, endReason: 'castles_7', mvp: p(6), finalNote: '' },
    commentsCount: 1, votes: [
      { id:35, fromUser: p(1), toUser: p(6), voteType: 'positive', createdAt: '2024-11-02T22:00:00' },
    ],
    comments: [
      { id:34, author: p(5), body: 'Мартелл — 4 место каждый раз. Я проклят', createdAt: '2024-11-02T22:30:00', editedAt: null },
    ]
  },
  // Session 12
  {
    id: 12, scheduledAt: '2024-11-16T19:30:00', mode: MODES.quests, deck: DECKS.expansion_a,
    createdBy: p(3), status: 'completed', planningNote: '',
    participations: [
      { id:57, user: p(3), faction: 'stark',     place: 1, castles: 7, isWinner: true },
      { id:58, user: p(8), faction: 'tyrell',    place: 2, castles: 6, isWinner: false },
      { id:59, user: p(2), faction: 'greyjoy',   place: 3, castles: 4, isWinner: false },
      { id:60, user: p(4), faction: 'baratheon', place: 4, castles: 2, isWinner: false },
      { id:61, user: p(7), faction: 'tully',     place: 5, castles: 1, isWinner: false },
    ],
    outcome: { roundsPlayed: 8, endReason: 'castles_7', mvp: p(3), finalNote: 'DireWolf в кратчайшие сроки' },
    commentsCount: 2, votes: [
      { id:36, fromUser: p(8), toUser: p(3), voteType: 'positive', createdAt: '2024-11-16T23:00:00' },
      { id:37, fromUser: p(4), toUser: p(7), voteType: 'negative', createdAt: '2024-11-16T23:05:00' },
    ],
    comments: [
      { id:35, author: p(3), body: 'Квесты Старка — это мощь. Понял наконец как играть', createdAt: '2024-11-16T23:30:00', editedAt: null },
      { id:36, author: p(8), body: 'Почти победил, Тиреллы на 6 замках... в следующий раз', createdAt: '2024-11-17T09:00:00', editedAt: null },
    ]
  },
  // Session 13
  {
    id: 13, scheduledAt: '2024-12-07T18:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(5), status: 'completed', planningNote: 'Последняя партия года',
    participations: [
      { id:62, user: p(1), faction: 'lannister', place: 1, castles: 7, isWinner: true },
      { id:63, user: p(6), faction: 'targaryen', place: 2, castles: 5, isWinner: false },
      { id:64, user: p(5), faction: 'martell',   place: 3, castles: 5, isWinner: false },
      { id:65, user: p(8), faction: 'tyrell',    place: 4, castles: 4, isWinner: false },
      { id:66, user: p(3), faction: 'stark',     place: 5, castles: 3, isWinner: false },
      { id:67, user: p(4), faction: 'baratheon', place: 6, castles: 2, isWinner: false },
    ],
    outcome: { roundsPlayed: 10, endReason: 'castles_7', mvp: p(1), finalNote: 'IronFist закончил год на победной ноте' },
    commentsCount: 3, votes: [
      { id:38, fromUser: p(6), toUser: p(1), voteType: 'positive', createdAt: '2024-12-07T23:00:00' },
      { id:39, fromUser: p(5), toUser: p(1), voteType: 'positive', createdAt: '2024-12-07T23:05:00' },
      { id:40, fromUser: p(1), toUser: p(4), voteType: 'negative', createdAt: '2024-12-07T23:10:00' },
    ],
    comments: [
      { id:37, author: p(1), body: 'Год закрыт. Лучшая партия в году.', createdAt: '2024-12-07T23:30:00', editedAt: null },
      { id:38, author: p(4), body: 'GoldHand в 6 месте... грустный Новый год', createdAt: '2024-12-08T09:00:00', editedAt: null },
      { id:39, author: p(5), body: 'Мартелл снова в топ-3! Прогресс!', createdAt: '2024-12-08T10:00:00', editedAt: null },
    ]
  },
  // Session 14
  {
    id: 14, scheduledAt: '2025-01-11T19:00:00', mode: MODES.dragons, deck: DECKS.expansion_a,
    createdBy: p(4), status: 'completed', planningNote: '',
    participations: [
      { id:68, user: p(4), faction: 'targaryen', place: 1, castles: 7, isWinner: true },
      { id:69, user: p(2), faction: 'greyjoy',   place: 2, castles: 5, isWinner: false },
      { id:70, user: p(8), faction: 'tyrell',    place: 3, castles: 4, isWinner: false },
      { id:71, user: p(1), faction: 'lannister', place: 4, castles: 3, isWinner: false },
      { id:72, user: p(6), faction: 'stark',     place: 5, castles: 2, isWinner: false },
    ],
    outcome: { roundsPlayed: 8, endReason: 'castles_7', mvp: p(4), finalNote: 'GoldHand наконец взял Таргов — и сразу победил' },
    commentsCount: 2, votes: [
      { id:41, fromUser: p(2), toUser: p(4), voteType: 'positive', createdAt: '2025-01-11T22:30:00' },
      { id:42, fromUser: p(6), toUser: p(4), voteType: 'negative', createdAt: '2025-01-11T22:35:00' },
    ],
    comments: [
      { id:40, author: p(4), body: 'Значит мне просто надо было взять Таргариен раньше', createdAt: '2025-01-11T23:00:00', editedAt: null },
      { id:41, author: p(6), body: 'Предатель, ты взял МОЮ фракцию', createdAt: '2025-01-11T23:05:00', editedAt: null },
    ]
  },
  // Session 15
  {
    id: 15, scheduledAt: '2025-02-08T18:30:00', mode: MODES.quests, deck: DECKS.expansion_b,
    createdBy: p(8), status: 'completed', planningNote: '',
    participations: [
      { id:73, user: p(8), faction: 'tyrell',    place: 1, castles: 7, isWinner: true },
      { id:74, user: p(5), faction: 'martell',   place: 2, castles: 6, isWinner: false },
      { id:75, user: p(3), faction: 'stark',     place: 3, castles: 4, isWinner: false },
      { id:76, user: p(7), faction: 'arryn',     place: 4, castles: 3, isWinner: false },
      { id:77, user: p(1), faction: 'lannister', place: 5, castles: 2, isWinner: false },
      { id:78, user: p(4), faction: 'baratheon', place: 6, castles: 1, isWinner: false },
    ],
    outcome: { roundsPlayed: 9, endReason: 'castles_7', mvp: p(8), finalNote: 'Хет-трик Bookworm за Тиреллов!' },
    commentsCount: 3, votes: [
      { id:43, fromUser: p(5), toUser: p(8), voteType: 'positive', createdAt: '2025-02-08T22:30:00' },
      { id:44, fromUser: p(3), toUser: p(8), voteType: 'positive', createdAt: '2025-02-08T22:35:00' },
      { id:45, fromUser: p(1), toUser: p(4), voteType: 'negative', createdAt: '2025-02-08T22:40:00' },
    ],
    comments: [
      { id:42, author: p(7), body: 'Первый раз Аррены и я в топ-4! Прогресс!', createdAt: '2025-02-08T23:00:00', editedAt: null },
      { id:43, author: p(8), body: 'Три победы за Тиреллов. Это моя фракция навсегда.', createdAt: '2025-02-08T23:05:00', editedAt: null },
      { id:44, author: p(4), body: 'Баратеон последний... снова... я проклят', createdAt: '2025-02-09T09:00:00', editedAt: null },
    ]
  },
  // Cancelled 1
  {
    id: 16, scheduledAt: '2025-01-25T19:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(2), status: 'cancelled', planningNote: 'Не набрался состав',
    participations: [
      { id:79, user: p(2), faction: 'greyjoy', place: null, castles: null, isWinner: false },
      { id:80, user: p(3), faction: 'stark',   place: null, castles: null, isWinner: false },
    ],
    outcome: null, commentsCount: 0, votes: [], comments: []
  },
  // Cancelled 2
  {
    id: 17, scheduledAt: '2025-03-01T18:00:00', mode: MODES.quests, deck: DECKS.expansion_a,
    createdBy: p(1), status: 'cancelled', planningNote: 'Заболели двое игроков',
    participations: [
      { id:81, user: p(1), faction: 'lannister', place: null, castles: null, isWinner: false },
    ],
    outcome: null, commentsCount: 0, votes: [], comments: []
  },
  // Planned 1 — near future (next match)
  {
    id: 18, scheduledAt: '2026-04-26T19:00:00', mode: MODES.classic, deck: DECKS.original,
    createdBy: p(1), status: 'planned', planningNote: 'Большая партия пятницы — все приходим!',
    participations: [
      { id:82, user: p(1), faction: 'lannister', place: null, castles: null, isWinner: false },
      { id:83, user: p(6), faction: 'targaryen', place: null, castles: null, isWinner: false },
      { id:84, user: p(3), faction: 'stark',     place: null, castles: null, isWinner: false },
      { id:85, user: p(8), faction: 'tyrell',    place: null, castles: null, isWinner: false },
      { id:86, user: p(2), faction: 'greyjoy',   place: null, castles: null, isWinner: false },
    ],
    outcome: null, commentsCount: 0, votes: [], comments: []
  },
  // Planned 2
  {
    id: 19, scheduledAt: '2026-05-10T18:30:00', mode: MODES.dragons, deck: DECKS.expansion_a,
    createdBy: p(6), status: 'planned', planningNote: 'Реванш в режиме Драконов',
    participations: [
      { id:87, user: p(6), faction: 'targaryen', place: null, castles: null, isWinner: false },
      { id:88, user: p(4), faction: 'baratheon', place: null, castles: null, isWinner: false },
    ],
    outcome: null, commentsCount: 0, votes: [], comments: []
  },
  // Planned 3
  {
    id: 20, scheduledAt: '2026-05-24T19:00:00', mode: MODES.quests, deck: DECKS.expansion_b,
    createdBy: p(5), status: 'planned', planningNote: 'Посмотрим кто лучший в квестах',
    participations: [
      { id:89, user: p(5), faction: 'martell',   place: null, castles: null, isWinner: false },
      { id:90, user: p(8), faction: 'tyrell',    place: null, castles: null, isWinner: false },
      { id:91, user: p(3), faction: 'stark',     place: null, castles: null, isWinner: false },
    ],
    outcome: null, commentsCount: 0, votes: [], comments: []
  },
];

// --- Computed Stats ---
function computePlayerStats(playerId) {
  const player = PLAYERS.find(p => p.id === playerId);
  const completed = SESSIONS.filter(s => s.status === 'completed');
  const myGames = completed.filter(s => s.participations.some(p => p.user.id === playerId));
  const myParticipations = myGames.map(s => s.participations.find(p => p.user.id === playerId));
  const wins = myParticipations.filter(p => p.isWinner).length;
  const totalGames = myGames.length;
  const winrate = totalGames > 0 ? wins / totalGames : 0;
  const avgPlace = totalGames > 0 ? myParticipations.reduce((a, p) => a + (p.place || 0), 0) / totalGames : 0;
  const avgCastles = totalGames > 0 ? myParticipations.reduce((a, p) => a + (p.castles || 0), 0) / totalGames : 0;

  // faction breakdown
  const factionMap = {};
  myParticipations.forEach(p => {
    if (!factionMap[p.faction]) factionMap[p.faction] = { games: 0, wins: 0 };
    factionMap[p.faction].games++;
    if (p.isWinner) factionMap[p.faction].wins++;
  });
  const factionEntries = Object.entries(factionMap).map(([slug, d]) => ({ slug, ...d, winrate: d.games > 0 ? d.wins / d.games : 0 }));
  const favoriteFaction = factionEntries.sort((a,b) => b.games - a.games)[0]?.slug || player.favoriteFaction;
  const bestFaction = [...factionEntries].sort((a,b) => b.winrate - a.winrate)[0];
  const worstFaction = [...factionEntries].sort((a,b) => a.winrate - b.winrate)[0];

  // streak
  const last10games = myGames.slice(-10);
  let streakType = null, streakCount = 0;
  for (let i = last10games.length - 1; i >= 0; i--) {
    const p = last10games[i].participations.find(x => x.user.id === playerId);
    const isWin = p.isWinner;
    if (streakType === null) { streakType = isWin ? 'win' : 'loss'; streakCount = 1; }
    else if ((streakType === 'win') === isWin) streakCount++;
    else break;
  }

  // votes received
  const allVotes = SESSIONS.flatMap(s => s.votes);
  const crownsReceived = allVotes.filter(v => v.toUser.id === playerId && v.voteType === 'positive').length;
  const shitsReceived = allVotes.filter(v => v.toUser.id === playerId && v.voteType === 'negative').length;

  const last10 = myGames.slice(-10).map(s => {
    const participation = s.participations.find(x => x.user.id === playerId);
    return { matchId: s.id, place: participation.place, faction: participation.faction };
  });

  return {
    user: player, totalGames, wins, winrate,
    avgPlace: Math.round(avgPlace * 10) / 10,
    avgCastles: Math.round(avgCastles * 10) / 10,
    favoriteFaction,
    bestFaction: bestFaction ? { faction: bestFaction.slug, winrate: bestFaction.winrate } : null,
    worstFaction: worstFaction ? { faction: worstFaction.slug, winrate: worstFaction.winrate } : null,
    currentStreak: { type: streakType || 'win', count: streakCount },
    last10, crownsReceived, shitsReceived, factionBreakdown: factionEntries,
  };
}

function computeFactionStats(slug) {
  const faction = FACTIONS[slug];
  const completed = SESSIONS.filter(s => s.status === 'completed');
  const gamesWithFaction = completed.filter(s => s.participations.some(p => p.faction === slug));
  const totalGames = gamesWithFaction.length;
  const wins = gamesWithFaction.filter(s => s.participations.find(p => p.faction === slug)?.isWinner).length;
  const winrate = totalGames > 0 ? wins / totalGames : 0;
  const participations = gamesWithFaction.map(s => s.participations.find(p => p.faction === slug));
  const avgPlace = totalGames > 0 ? participations.reduce((a, p) => a + (p.place || 0), 0) / totalGames : 0;
  const avgCastles = totalGames > 0 ? participations.reduce((a, p) => a + (p.castles || 0), 0) / totalGames : 0;

  const byMode = Object.values(MODES).map(mode => {
    const modeGames = gamesWithFaction.filter(s => s.mode.slug === mode.slug);
    const modeWins = modeGames.filter(s => s.participations.find(p => p.faction === slug)?.isWinner).length;
    return { mode: mode.slug, games: modeGames.length, winrate: modeGames.length > 0 ? modeWins / modeGames.length : 0 };
  }).filter(x => x.games > 0);

  // top players
  const playerMap = {};
  gamesWithFaction.forEach(s => {
    const part = s.participations.find(p => p.faction === slug);
    const uid = part.user.id;
    if (!playerMap[uid]) playerMap[uid] = { user: part.user, games: 0, wins: 0 };
    playerMap[uid].games++;
    if (part.isWinner) playerMap[uid].wins++;
  });
  const topPlayers = Object.values(playerMap)
    .map(x => ({ ...x, winrate: x.games > 0 ? x.wins / x.games : 0 }))
    .sort((a, b) => b.winrate - a.winrate).slice(0, 5);

  return { faction, totalGames, wins, winrate, avgPlace: Math.round(avgPlace*10)/10, avgCastles: Math.round(avgCastles*10)/10, byMode, topPlayers };
}

function computeOverview() {
  const completed = SESSIONS.filter(s => s.status === 'completed');
  const nextMatch = SESSIONS.find(s => s.status === 'planned' && new Date(s.scheduledAt) > new Date()) || null;

  const factionWins = {};
  const factionGames = {};
  completed.forEach(s => {
    s.participations.forEach(p => {
      factionGames[p.faction] = (factionGames[p.faction] || 0) + 1;
      if (p.isWinner) factionWins[p.faction] = (factionWins[p.faction] || 0) + 1;
    });
  });

  const mostPopularSlug = Object.entries(factionGames).sort((a,b) => b[1]-a[1])[0]?.[0];
  const factionWinrates = Object.entries(factionGames).map(([slug, games]) => ({
    faction: FACTIONS[slug], winrate: games > 0 ? (factionWins[slug] || 0) / games : 0,
  })).sort((a,b) => b.winrate - a.winrate);

  const playerWins = {};
  completed.forEach(s => s.participations.filter(p => p.isWinner).forEach(p => {
    playerWins[p.user.id] = (playerWins[p.user.id] || 0) + 1;
  }));
  const topWinnerId = Object.entries(playerWins).sort((a,b) => b[1]-a[1])[0]?.[0];
  const currentLeader = topWinnerId ? { user: PLAYERS.find(p => p.id === parseInt(topWinnerId)), wins: playerWins[topWinnerId] } : null;

  const topWinrate = PLAYERS.map(u => {
    const stats = computePlayerStats(u.id);
    return { user: u, winrate: stats.winrate, games: stats.totalGames };
  }).filter(x => x.games >= 3).sort((a,b) => b.winrate - a.winrate).slice(0, 5);

  return {
    nextMatch,
    recentMatches: SESSIONS.filter(s => s.status === 'completed').slice(-8).reverse(),
    totalMatches: completed.length,
    activePlayers: PLAYERS.length,
    mostPopularFaction: mostPopularSlug ? { faction: FACTIONS[mostPopularSlug], games: factionGames[mostPopularSlug] } : null,
    currentLeader,
    factionWinrates,
    topWinrate,
    funFacts: [
      { icon: '⏱️', title: 'Самая долгая партия', description: '12 раундов, ~4 часа — RedViper за Мартеллов (Партия #8)' },
      { icon: '⚡', title: 'Эпичный камбэк', description: 'RedViper с 4-го на 1-е за 3 раунда в партии #8' },
      { icon: '👑', title: 'Хет-трик', description: 'Bookworm победил 3 раза подряд за Тиреллов (партии #7, #3, #15)' },
    ],
  };
}

function computeLeaderboard(metric) {
  return PLAYERS.map(u => {
    const s = computePlayerStats(u.id);
    let value;
    switch (metric) {
      case 'winrate': value = s.winrate; break;
      case 'wins': value = s.wins; break;
      case 'games': value = s.totalGames; break;
      case 'crowns': value = s.crownsReceived; break;
      case 'shits': value = s.shitsReceived; break;
      case 'avgplace': value = s.avgPlace; break;
      default: value = s.winrate;
    }
    return { user: u, value, stats: s };
  }).filter(x => x.stats.totalGames > 0)
    .sort((a,b) => metric === 'avgplace' ? a.value - b.value : b.value - a.value);
}

function computeH2H(userAId, userBId) {
  const completed = SESSIONS.filter(s => s.status === 'completed');
  const together = completed.filter(s =>
    s.participations.some(p => p.user.id === userAId) &&
    s.participations.some(p => p.user.id === userBId)
  );
  const winsA = together.filter(s => s.participations.find(p => p.user.id === userAId)?.isWinner).length;
  const winsB = together.filter(s => s.participations.find(p => p.user.id === userBId)?.isWinner).length;
  const placesA = together.map(s => s.participations.find(p => p.user.id === userAId)?.place || 0);
  const placesB = together.map(s => s.participations.find(p => p.user.id === userBId)?.place || 0);
  const avgPlaceA = placesA.length > 0 ? placesA.reduce((a,b) => a+b,0)/placesA.length : 0;
  const avgPlaceB = placesB.length > 0 ? placesB.reduce((a,b) => a+b,0)/placesB.length : 0;
  return {
    userA: PLAYERS.find(p => p.id === userAId),
    userB: PLAYERS.find(p => p.id === userBId),
    gamesTogetherCount: together.length,
    winsA, winsB,
    avgPlaceA: Math.round(avgPlaceA*10)/10,
    avgPlaceB: Math.round(avgPlaceB*10)/10,
    matches: together.reverse(),
  };
}

window.GOT = {
  FACTIONS, MODES, DECKS, PLAYERS, SESSIONS,
  computePlayerStats, computeFactionStats, computeOverview,
  computeLeaderboard, computeH2H,
};

})();
