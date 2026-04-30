import type {
  ApiTimelineEvent,
  Faction,
  FactionStats,
  FactionSlug,
  GameMode,
  HouseDeck,
  MatchComment,
  MatchSession,
  MatchVote,
  OverviewData,
  Participation,
  PlayerStats,
  PublicUser,
} from '@/mocks/types'

export const mockFactions: Faction[] = [
  {
    slug: 'stark',
    name: 'Старк',
    color: '#6B7B8C',
    sigilUrl: '/sigils/stark.svg',
  },
  {
    slug: 'lannister',
    name: 'Ланнистер',
    color: '#9B2226',
    sigilUrl: '/sigils/lannister.svg',
  },
  {
    slug: 'baratheon',
    name: 'Баратеон',
    color: '#F0B323',
    sigilUrl: '/sigils/baratheon.svg',
  },
  {
    slug: 'greyjoy',
    name: 'Грейджой',
    color: '#1C3B47',
    sigilUrl: '/sigils/greyjoy.svg',
  },
  {
    slug: 'tyrell',
    name: 'Тирелл',
    color: '#4B6B3A',
    sigilUrl: '/sigils/tyrell.svg',
  },
  {
    slug: 'martell',
    name: 'Мартелл',
    color: '#C94E2A',
    sigilUrl: '/sigils/martell.svg',
  },
  {
    slug: 'tully',
    name: 'Талли',
    color: '#4B6FA5',
    sigilUrl: '/sigils/tully.svg',
  },
  {
    slug: 'arryn',
    name: 'Аррен',
    color: '#8AAFC8',
    sigilUrl: '/sigils/arryn.svg',
  },
  {
    slug: 'targaryen',
    name: 'Таргариен',
    color: '#5B2D8A',
    sigilUrl: '/sigils/targaryen.svg',
  },
]

export const mockModes: GameMode[] = [
  {
    slug: 'classic',
    name: 'Классика',
    minPlayers: 3,
    maxPlayers: 6,
    maxRounds: 10,
    westerosDeckCount: 3,
    allowedFactions: [],
    requiredFactions: [],
    factionsByPlayerCount: {
      '3': ['stark', 'lannister', 'baratheon'],
      '4': ['stark', 'lannister', 'baratheon', 'greyjoy'],
      '5': ['stark', 'lannister', 'baratheon', 'greyjoy', 'tyrell'],
      '6': ['stark', 'lannister', 'baratheon', 'greyjoy', 'tyrell', 'martell'],
    },
  },
  {
    slug: 'feast_for_crows',
    name: 'Пир воронов',
    minPlayers: 4,
    maxPlayers: 4,
    maxRounds: 7,
    westerosDeckCount: 3,
    allowedFactions: ['arryn', 'stark', 'lannister', 'baratheon'],
    requiredFactions: [],
    factionsByPlayerCount: {},
  },
  {
    slug: 'dance_with_dragons',
    name: 'Танец с драконами',
    minPlayers: 6,
    maxPlayers: 6,
    maxRounds: 10,
    westerosDeckCount: 3,
    allowedFactions: ['stark', 'lannister', 'baratheon', 'greyjoy', 'tyrell', 'martell'],
    requiredFactions: [],
    factionsByPlayerCount: {},
  },
  {
    slug: 'mother_of_dragons',
    name: 'Мать драконов',
    minPlayers: 4,
    maxPlayers: 8,
    maxRounds: 10,
    westerosDeckCount: 4,
    allowedFactions: [],
    requiredFactions: ['targaryen'],
    factionsByPlayerCount: {},
  },
]

export const mockDecks: HouseDeck[] = [
  { slug: 'original', name: 'Base' },
  { slug: 'alternative', name: 'Alternative' },
]

export const mockPlayers: PublicUser[] = [
  {
    id: 1,
    nickname: 'IronFist',
    favoriteFaction: 'lannister',
    currentAvatarUrl: null,
    dateJoined: '2024-02-14T18:00:00Z',
  },
  {
    id: 2,
    nickname: 'Kraken42',
    favoriteFaction: 'greyjoy',
    currentAvatarUrl: null,
    dateJoined: '2024-02-21T18:00:00Z',
  },
  {
    id: 3,
    nickname: 'DireWolf',
    favoriteFaction: 'stark',
    currentAvatarUrl: null,
    dateJoined: '2024-03-01T18:00:00Z',
  },
  {
    id: 4,
    nickname: 'GoldHand',
    favoriteFaction: 'baratheon',
    currentAvatarUrl: null,
    dateJoined: '2024-03-18T18:00:00Z',
  },
  {
    id: 5,
    nickname: 'RedViper',
    favoriteFaction: 'martell',
    currentAvatarUrl: null,
    dateJoined: '2024-04-02T18:00:00Z',
  },
  {
    id: 6,
    nickname: 'FireQueen',
    favoriteFaction: 'targaryen',
    currentAvatarUrl: null,
    dateJoined: '2024-04-19T18:00:00Z',
  },
  {
    id: 7,
    nickname: 'Frey73',
    favoriteFaction: 'tully',
    currentAvatarUrl: null,
    dateJoined: '2024-05-04T18:00:00Z',
  },
  {
    id: 8,
    nickname: 'Bookworm',
    favoriteFaction: 'arryn',
    currentAvatarUrl: null,
    dateJoined: '2024-06-13T18:00:00Z',
  },
]

function playerById(id: number) {
  return mockPlayers.find((player) => player.id === id) ?? mockPlayers[0]
}

function modeBySlug(slug: GameMode['slug']) {
  return mockModes.find((mode) => mode.slug === slug) ?? mockModes[0]
}

function deckBySlug(slug: HouseDeck['slug']) {
  return mockDecks.find((deck) => deck.slug === slug) ?? mockDecks[0]
}

export function factionBySlug(slug: FactionSlug) {
  return (
    mockFactions.find((faction) => faction.slug === slug) ?? mockFactions[0]
  )
}

function buildParticipation(
  id: number,
  userId: number,
  faction: FactionSlug,
  place: number | null,
  castles: number | null,
): Participation {
  return {
    id,
    user: playerById(userId),
    faction,
    place,
    castles,
    isWinner: place === 1,
    notes: '',
  }
}

function buildVotes(
  matchId: number,
  pairs: Array<[number, number, MatchVote['voteType']]>,
) {
  return pairs.map(([fromUser, toUser, voteType], index) => ({
    id: matchId * 10 + index + 1,
    fromUser: playerById(fromUser),
    toUser: playerById(toUser),
    voteType,
    createdAt: new Date(Date.UTC(2026, 3, 1 + index, 20, 15)).toISOString(),
  }))
}

function buildMatch(match: {
  id: number
  scheduledAt: string
  mode: GameMode['slug']
  deck: HouseDeck['slug']
  createdBy: number
  status: MatchSession['status']
  planningNote: string
  participations: Array<
    [number, number, FactionSlug, number | null, number | null]
  >
  commentsCount: number
  votes?: Array<[number, number, MatchVote['voteType']]>
  outcome?: {
    roundsPlayed: number
    endReason: 'castles_7' | 'timer' | 'rounds_end' | 'early' | 'other'
    mvp: number | null
    finalNote: string
  }
}): MatchSession {
  return {
    id: match.id,
    scheduledAt: match.scheduledAt,
    mode: modeBySlug(match.mode),
    deck: deckBySlug(match.deck),
    createdBy: playerById(match.createdBy),
    status: match.status,
    planningNote: match.planningNote,
    participations: match.participations.map(
      ([participationId, userId, faction, place, castles]) =>
        buildParticipation(participationId, userId, faction, place, castles),
    ),
    outcome: match.outcome
      ? {
          roundsPlayed: match.outcome.roundsPlayed,
          endReason: match.outcome.endReason,
          mvp:
            match.outcome.mvp === null ? null : playerById(match.outcome.mvp),
          finalNote: match.outcome.finalNote,
        }
      : null,
    commentsCount: match.commentsCount,
    votes: buildVotes(match.id, match.votes ?? []),
  }
}

const matchSeeds: Array<Parameters<typeof buildMatch>[0]> = [
  {
    id: 201,
    scheduledAt: '2026-04-28T16:30:00Z',
    mode: 'mother_of_dragons',
    deck: 'alternative',
    createdBy: 1,
    status: 'planned',
    planningNote: 'Нужен стол побольше и таймер на 3 часа.',
    participations: [
      [1, 1, 'lannister', null, null],
      [2, 2, 'greyjoy', null, null],
      [3, 3, 'stark', null, null],
      [4, 6, 'targaryen', null, null],
      [5, 8, 'arryn', null, null],
    ],
    commentsCount: 2,
  },
  {
    id: 202,
    scheduledAt: '2026-05-04T17:00:00Z',
    mode: 'classic',
    deck: 'original',
    createdBy: 3,
    status: 'planned',
    planningNote: 'Пробуем быстрый драфт фракций на старте.',
    participations: [
      [6, 3, 'stark', null, null],
      [7, 4, 'baratheon', null, null],
      [8, 5, 'martell', null, null],
      [9, 7, 'tully', null, null],
    ],
    commentsCount: 1,
  },
  {
    id: 203,
    scheduledAt: '2026-05-11T18:15:00Z',
    mode: 'feast_for_crows',
    deck: 'alternative',
    createdBy: 6,
    status: 'planned',
    planningNote: 'Хочу реванш за прошлую партию без ранних альянсов.',
    participations: [
      [10, 2, 'greyjoy', null, null],
      [11, 5, 'martell', null, null],
      [12, 6, 'targaryen', null, null],
      [13, 8, 'arryn', null, null],
    ],
    commentsCount: 0,
  },
  {
    id: 204,
    scheduledAt: '2026-03-16T16:00:00Z',
    mode: 'classic',
    deck: 'original',
    createdBy: 2,
    status: 'cancelled',
    planningNote: 'Слетели по кворуму в последний момент.',
    participations: [
      [14, 2, 'greyjoy', null, null],
      [15, 3, 'stark', null, null],
      [16, 5, 'martell', null, null],
    ],
    commentsCount: 0,
  },
  {
    id: 205,
    scheduledAt: '2026-02-02T18:00:00Z',
    mode: 'feast_for_crows',
    deck: 'alternative',
    createdBy: 4,
    status: 'cancelled',
    planningNote: 'Owner отменил, потому что заболел.',
    participations: [
      [17, 1, 'lannister', null, null],
      [18, 4, 'baratheon', null, null],
      [19, 6, 'targaryen', null, null],
      [20, 7, 'tully', null, null],
    ],
    commentsCount: 0,
  },
  {
    id: 206,
    scheduledAt: '2026-04-14T17:30:00Z',
    mode: 'mother_of_dragons',
    deck: 'alternative',
    createdBy: 1,
    status: 'completed',
    planningNote: 'Большой стол и чайник рядом.',
    participations: [
      [21, 1, 'lannister', 2, 5],
      [22, 2, 'greyjoy', 4, 3],
      [23, 3, 'stark', 1, 7],
      [24, 5, 'martell', 5, 2],
      [25, 6, 'targaryen', 3, 4],
      [26, 8, 'arryn', 6, 1],
    ],
    commentsCount: 12,
    votes: [
      [1, 3, 'positive'],
      [6, 3, 'positive'],
      [2, 5, 'negative'],
    ],
    outcome: {
      roundsPlayed: 9,
      endReason: 'castles_7',
      mvp: 3,
      finalNote: 'DireWolf забрал стол через поздний марш и идеальный тайминг.',
    },
  },
  {
    id: 207,
    scheduledAt: '2026-04-09T18:00:00Z',
    mode: 'classic',
    deck: 'original',
    createdBy: 3,
    status: 'completed',
    planningNote: 'Классика без хоумрулов.',
    participations: [
      [27, 1, 'baratheon', 4, 2],
      [28, 3, 'stark', 2, 5],
      [29, 4, 'lannister', 1, 7],
      [30, 5, 'martell', 3, 4],
    ],
    commentsCount: 7,
    votes: [
      [3, 4, 'positive'],
      [5, 1, 'negative'],
    ],
    outcome: {
      roundsPlayed: 8,
      endReason: 'castles_7',
      mvp: 4,
      finalNote: 'GoldHand выиграл через агрессию и контроль короны.',
    },
  },
  {
    id: 208,
    scheduledAt: '2026-04-01T18:45:00Z',
    mode: 'feast_for_crows',
    deck: 'alternative',
    createdBy: 6,
    status: 'completed',
    planningNote: 'Проверяли новый состав на 5 игроков.',
    participations: [
      [31, 2, 'greyjoy', 3, 4],
      [32, 5, 'martell', 4, 3],
      [33, 6, 'targaryen', 1, 6],
      [34, 7, 'tully', 5, 2],
      [35, 8, 'arryn', 2, 5],
    ],
    commentsCount: 9,
    votes: [
      [8, 6, 'positive'],
      [2, 7, 'negative'],
    ],
    outcome: {
      roundsPlayed: 10,
      endReason: 'rounds_end',
      mvp: 6,
      finalNote: 'FireQueen дожала по очкам после затяжной дипломатии.',
    },
  },
  {
    id: 209,
    scheduledAt: '2026-03-25T17:00:00Z',
    mode: 'classic',
    deck: 'alternative',
    createdBy: 2,
    status: 'completed',
    planningNote: 'Решили играть быстрее, без долгих торгов.',
    participations: [
      [36, 1, 'lannister', 1, 7],
      [37, 2, 'greyjoy', 2, 5],
      [38, 4, 'baratheon', 3, 4],
      [39, 8, 'arryn', 4, 2],
    ],
    commentsCount: 4,
    votes: [
      [2, 1, 'positive'],
      [8, 4, 'negative'],
    ],
    outcome: {
      roundsPlayed: 7,
      endReason: 'castles_7',
      mvp: 1,
      finalNote:
        'IronFist снова доказал, что поздняя экономика Ланнистеров опасна.',
    },
  },
  {
    id: 210,
    scheduledAt: '2026-03-18T18:30:00Z',
    mode: 'mother_of_dragons',
    deck: 'alternative',
    createdBy: 8,
    status: 'completed',
    planningNote: 'Максимум игроков и хаоса.',
    participations: [
      [40, 1, 'lannister', 5, 2],
      [41, 2, 'greyjoy', 2, 5],
      [42, 3, 'stark', 3, 4],
      [43, 4, 'baratheon', 7, 1],
      [44, 5, 'martell', 6, 2],
      [45, 6, 'targaryen', 1, 7],
      [46, 7, 'tully', 4, 3],
      [47, 8, 'arryn', 8, 0],
    ],
    commentsCount: 14,
    votes: [
      [3, 6, 'positive'],
      [1, 8, 'negative'],
      [2, 4, 'negative'],
    ],
    outcome: {
      roundsPlayed: 11,
      endReason: 'timer',
      mvp: 6,
      finalNote: 'FireQueen победила в самой длинной партии весны.',
    },
  },
  {
    id: 211,
    scheduledAt: '2026-03-11T18:10:00Z',
    mode: 'feast_for_crows',
    deck: 'alternative',
    createdBy: 5,
    status: 'completed',
    planningNote: 'Партия с акцентом на дипломатические сделки.',
    participations: [
      [48, 1, 'baratheon', 5, 2],
      [49, 3, 'stark', 1, 7],
      [50, 5, 'martell', 2, 6],
      [51, 7, 'tully', 4, 3],
      [52, 8, 'arryn', 3, 4],
    ],
    commentsCount: 6,
    votes: [
      [5, 3, 'positive'],
      [7, 1, 'negative'],
    ],
    outcome: {
      roundsPlayed: 9,
      endReason: 'castles_7',
      mvp: 3,
      finalNote: 'DireWolf снова безошибочно закрыл север и центр.',
    },
  },
  {
    id: 212,
    scheduledAt: '2026-03-03T18:20:00Z',
    mode: 'classic',
    deck: 'original',
    createdBy: 4,
    status: 'completed',
    planningNote: 'Плотная классика на четыре дома.',
    participations: [
      [53, 2, 'greyjoy', 1, 7],
      [54, 4, 'baratheon', 2, 6],
      [55, 6, 'targaryen', 3, 4],
      [56, 8, 'arryn', 4, 2],
    ],
    commentsCount: 5,
    votes: [
      [4, 2, 'positive'],
      [6, 8, 'negative'],
    ],
    outcome: {
      roundsPlayed: 8,
      endReason: 'castles_7',
      mvp: 2,
      finalNote: 'Kraken42 реализовал любимый темп на море и не отпустил стол.',
    },
  },
  {
    id: 213,
    scheduledAt: '2026-02-24T18:00:00Z',
    mode: 'classic',
    deck: 'alternative',
    createdBy: 6,
    status: 'completed',
    planningNote: 'Быстрая вечерняя партия после работы.',
    participations: [
      [57, 1, 'lannister', 3, 4],
      [58, 5, 'martell', 1, 7],
      [59, 6, 'targaryen', 2, 5],
      [60, 7, 'tully', 4, 2],
    ],
    commentsCount: 8,
    votes: [
      [1, 5, 'positive'],
      [7, 6, 'negative'],
    ],
    outcome: {
      roundsPlayed: 8,
      endReason: 'castles_7',
      mvp: 5,
      finalNote: 'RedViper вытащил южный стол через терпение и позднюю атаку.',
    },
  },
  {
    id: 214,
    scheduledAt: '2026-02-17T17:45:00Z',
    mode: 'mother_of_dragons',
    deck: 'alternative',
    createdBy: 8,
    status: 'completed',
    planningNote: 'Проверка большого стола на новом балансе.',
    participations: [
      [61, 1, 'lannister', 4, 3],
      [62, 2, 'greyjoy', 5, 2],
      [63, 3, 'stark', 2, 6],
      [64, 4, 'baratheon', 6, 1],
      [65, 5, 'martell', 3, 4],
      [66, 6, 'targaryen', 1, 7],
      [67, 7, 'tully', 7, 1],
      [68, 8, 'arryn', 8, 0],
    ],
    commentsCount: 11,
    votes: [
      [3, 6, 'positive'],
      [2, 8, 'negative'],
      [5, 4, 'negative'],
    ],
    outcome: {
      roundsPlayed: 10,
      endReason: 'castles_7',
      mvp: 6,
      finalNote: 'FireQueen опять выиграла через драконов и идеальный тайминг.',
    },
  },
  {
    id: 215,
    scheduledAt: '2026-02-10T18:15:00Z',
    mode: 'feast_for_crows',
    deck: 'alternative',
    createdBy: 7,
    status: 'completed',
    planningNote: 'Квесты и минимум компромиссов.',
    participations: [
      [69, 2, 'greyjoy', 2, 5],
      [70, 4, 'baratheon', 4, 3],
      [71, 7, 'tully', 1, 7],
      [72, 8, 'arryn', 3, 4],
    ],
    commentsCount: 4,
    votes: [
      [8, 7, 'positive'],
      [4, 2, 'negative'],
    ],
    outcome: {
      roundsPlayed: 8,
      endReason: 'castles_7',
      mvp: 7,
      finalNote: 'Frey73 наконец-то конвертировал любимый Талли-план в победу.',
    },
  },
  {
    id: 216,
    scheduledAt: '2026-01-30T18:40:00Z',
    mode: 'classic',
    deck: 'original',
    createdBy: 1,
    status: 'completed',
    planningNote: 'Старт года с классическим составом.',
    participations: [
      [73, 1, 'lannister', 1, 7],
      [74, 3, 'stark', 2, 5],
      [75, 5, 'martell', 3, 4],
      [76, 8, 'arryn', 4, 2],
    ],
    commentsCount: 10,
    votes: [
      [3, 1, 'positive'],
      [8, 5, 'negative'],
    ],
    outcome: {
      roundsPlayed: 7,
      endReason: 'castles_7',
      mvp: 1,
      finalNote: 'IronFist уверенно начал сезон и удержал темп до конца.',
    },
  },
  {
    id: 217,
    scheduledAt: '2026-01-23T18:10:00Z',
    mode: 'feast_for_crows',
    deck: 'alternative',
    createdBy: 5,
    status: 'completed',
    planningNote: 'Партия для проверки новых хоум-правил по таймеру.',
    participations: [
      [77, 1, 'baratheon', 3, 4],
      [78, 2, 'greyjoy', 1, 7],
      [79, 5, 'martell', 2, 6],
      [80, 6, 'targaryen', 4, 2],
    ],
    commentsCount: 5,
    votes: [
      [5, 2, 'positive'],
      [1, 6, 'negative'],
    ],
    outcome: {
      roundsPlayed: 8,
      endReason: 'castles_7',
      mvp: 2,
      finalNote: 'Kraken42 снова выиграл темповую партию почти без ошибок.',
    },
  },
  {
    id: 218,
    scheduledAt: '2026-01-16T17:55:00Z',
    mode: 'mother_of_dragons',
    deck: 'alternative',
    createdBy: 6,
    status: 'completed',
    planningNote: 'Репетиция перед февральским марафоном.',
    participations: [
      [81, 1, 'lannister', 6, 1],
      [82, 2, 'greyjoy', 3, 4],
      [83, 3, 'stark', 2, 6],
      [84, 4, 'baratheon', 7, 1],
      [85, 5, 'martell', 5, 2],
      [86, 6, 'targaryen', 1, 7],
      [87, 7, 'tully', 4, 3],
      [88, 8, 'arryn', 8, 0],
    ],
    commentsCount: 13,
    votes: [
      [3, 6, 'positive'],
      [2, 8, 'negative'],
      [5, 1, 'negative'],
    ],
    outcome: {
      roundsPlayed: 10,
      endReason: 'timer',
      mvp: 6,
      finalNote:
        'FireQueen доминировала лейт-гейм и удержала лидерство по таймеру.',
    },
  },
  {
    id: 219,
    scheduledAt: '2026-01-08T18:30:00Z',
    mode: 'dance_with_dragons',
    deck: 'original',
    createdBy: 4,
    status: 'completed',
    planningNote: 'Дуэльный формат на троих ради разнообразия.',
    participations: [
      [89, 3, 'stark', 1, 7],
      [90, 4, 'lannister', 2, 5],
      [91, 8, 'arryn', 3, 3],
    ],
    commentsCount: 3,
    votes: [
      [4, 3, 'positive'],
      [8, 4, 'negative'],
    ],
    outcome: {
      roundsPlayed: 6,
      endReason: 'castles_7',
      mvp: 3,
      finalNote: 'DireWolf закрыл короткий формат уверенной макро-игрой.',
    },
  },
  {
    id: 220,
    scheduledAt: '2026-01-03T16:20:00Z',
    mode: 'classic',
    deck: 'alternative',
    createdBy: 8,
    status: 'completed',
    planningNote: 'Первый матч года, играли без долгих остановок.',
    participations: [
      [92, 1, 'lannister', 2, 5],
      [93, 2, 'greyjoy', 4, 2],
      [94, 6, 'targaryen', 1, 7],
      [95, 8, 'arryn', 3, 4],
    ],
    commentsCount: 6,
    votes: [
      [1, 6, 'positive'],
      [8, 2, 'negative'],
    ],
    outcome: {
      roundsPlayed: 8,
      endReason: 'castles_7',
      mvp: 6,
      finalNote: 'FireQueen открыла год победой и сразу забрала лидерство.',
    },
  },
]

export const mockMatches: MatchSession[] = matchSeeds.map(buildMatch)

export const mockCommentsByMatch: Record<number, MatchComment[]> = {
  206: [
    {
      id: 101,
      author: null,
      body: 'Летописец: партия завершена после девятого раунда и позднего рывка Stark.',
      createdAt: '2026-04-14T20:55:00Z',
      editedAt: null,
    },
    {
      id: 1,
      author: playerById(6),
      body: 'Лейт-гейм получился грязный, но очень красивый. Надо повторить этот состав.',
      createdAt: '2026-04-14T21:05:00Z',
      editedAt: null,
    },
    {
      id: 2,
      author: playerById(3),
      body: 'На севере было тесно. В следующий раз Greyjoy нельзя так рано пускать в море.',
      createdAt: '2026-04-14T21:18:00Z',
      editedAt: null,
    },
  ],
  207: [
    {
      id: 3,
      author: playerById(4),
      body: 'Редко когда Ланнистеры настолько чисто закрывают стол.',
      createdAt: '2026-04-09T21:00:00Z',
      editedAt: null,
    },
  ],
  208: [
    {
      id: 4,
      author: playerById(8),
      body: 'Аррены были в шаге от камбэка, но драконы пережили всё.',
      createdAt: '2026-04-01T22:10:00Z',
      editedAt: null,
    },
    {
      id: 5,
      author: playerById(5),
      body: 'Квесты внезапно сделали матч намного злее, чем ожидалось.',
      createdAt: '2026-04-01T22:18:00Z',
      editedAt: null,
    },
  ],
}

export function getMockCommentsForMatch(matchId: number): MatchComment[] {
  return [...(mockCommentsByMatch[matchId] ?? [])]
}

export const mockTimelineByMatch: Record<number, ApiTimelineEvent[]> = {
  206: [
    {
      id: 9001,
      kind: 'session_started',
      happened_at: '2026-04-14T17:40:00Z',
      actor: { id: 1, nickname: 'IronFist' },
      payload: {},
      created_at: '2026-04-14T17:40:00Z',
    },
    {
      id: 9002,
      kind: 'wildlings_raid',
      happened_at: '2026-04-14T19:10:00Z',
      actor: { id: 1, nickname: 'IronFist' },
      payload: {
        outcome: 'loss',
        outcome_card_slug: 'horn',
        wildlings_threat_after: 6,
      },
      created_at: '2026-04-14T19:10:00Z',
    },
    {
      id: 9003,
      kind: 'clash_of_kings',
      happened_at: '2026-04-14T19:50:00Z',
      actor: { id: 1, nickname: 'IronFist' },
      payload: {
        tracks: {
          influence_throne: [{ participation_id: 23, bid: 2, place: 1 }],
          influence_sword: [{ participation_id: 21, bid: 1, place: 1 }],
          influence_court: [{ participation_id: 25, bid: 3, place: 1 }],
        },
      },
      created_at: '2026-04-14T19:50:00Z',
    },
    {
      id: 9004,
      kind: 'event_card_played',
      happened_at: '2026-04-14T20:15:00Z',
      actor: { id: 1, nickname: 'IronFist' },
      payload: {
        deck_number: 2,
        card_slug: 'storm_of_swords',
      },
      created_at: '2026-04-14T20:15:00Z',
    },
    {
      id: 9005,
      kind: 'session_finalized',
      happened_at: '2026-04-14T20:50:00Z',
      actor: { id: 1, nickname: 'IronFist' },
      payload: {},
      created_at: '2026-04-14T20:50:00Z',
    },
  ],
}

export function getMockTimelineForMatch(matchId: number): ApiTimelineEvent[] {
  return [...(mockTimelineByMatch[matchId] ?? [])]
}

export const mockRecentMatches = mockMatches.filter(
  (match) => match.status === 'completed',
)

export const mockPlayerStats: PlayerStats[] = [
  {
    user: playerById(6),
    totalGames: 11,
    wins: 5,
    winrate: 0.455,
    avgPlace: 2.6,
    avgCastles: 5.3,
    favoriteFaction: 'targaryen',
    bestFaction: { faction: 'targaryen', winrate: 0.71 },
    worstFaction: { faction: 'baratheon', winrate: 0.0 },
    currentStreak: { type: 'win', count: 2 },
    last10: mockRecentMatches.slice(0, 5).map((match, index) => ({
      matchId: match.id,
      place: [1, 3, 1, 2, 1][index],
      faction: 'targaryen',
    })),
    crownsReceived: 14,
    shitsReceived: 3,
  },
  {
    user: playerById(3),
    totalGames: 10,
    wins: 4,
    winrate: 0.4,
    avgPlace: 2.2,
    avgCastles: 5.6,
    favoriteFaction: 'stark',
    bestFaction: { faction: 'stark', winrate: 0.67 },
    worstFaction: { faction: 'baratheon', winrate: 0.0 },
    currentStreak: { type: 'win', count: 1 },
    last10: mockRecentMatches.slice(0, 4).map((match, index) => ({
      matchId: match.id,
      place: [1, 2, 1, 2][index],
      faction: 'stark',
    })),
    crownsReceived: 11,
    shitsReceived: 2,
  },
  {
    user: playerById(1),
    totalGames: 12,
    wins: 3,
    winrate: 0.25,
    avgPlace: 3.1,
    avgCastles: 4.4,
    favoriteFaction: 'lannister',
    bestFaction: { faction: 'lannister', winrate: 0.43 },
    worstFaction: { faction: 'baratheon', winrate: 0.0 },
    currentStreak: { type: 'loss', count: 1 },
    last10: mockRecentMatches.slice(0, 4).map((match, index) => ({
      matchId: match.id,
      place: [2, 4, 1, 5][index],
      faction: index === 2 ? 'lannister' : 'baratheon',
    })),
    crownsReceived: 8,
    shitsReceived: 6,
  },
  {
    user: playerById(2),
    totalGames: 11,
    wins: 3,
    winrate: 0.273,
    avgPlace: 2.8,
    avgCastles: 4.8,
    favoriteFaction: 'greyjoy',
    bestFaction: { faction: 'greyjoy', winrate: 0.5 },
    worstFaction: { faction: 'lannister', winrate: 0.0 },
    currentStreak: { type: 'loss', count: 2 },
    last10: mockRecentMatches.slice(0, 4).map((match, index) => ({
      matchId: match.id,
      place: [4, 2, 3, 2][index],
      faction: 'greyjoy',
    })),
    crownsReceived: 7,
    shitsReceived: 7,
  },
  {
    user: playerById(5),
    totalGames: 9,
    wins: 2,
    winrate: 0.222,
    avgPlace: 3.0,
    avgCastles: 4.5,
    favoriteFaction: 'martell',
    bestFaction: { faction: 'martell', winrate: 0.5 },
    worstFaction: { faction: 'baratheon', winrate: 0.0 },
    currentStreak: { type: 'loss', count: 1 },
    last10: mockRecentMatches.slice(0, 4).map((match, index) => ({
      matchId: match.id,
      place: [5, 3, 4, 1][index],
      faction: 'martell',
    })),
    crownsReceived: 6,
    shitsReceived: 5,
  },
]

export const mockFactionStats: FactionStats[] = mockFactions.map((faction, index) => {
  const totalGames = [12, 10, 8, 9, 7, 6, 4, 3, 11][index] ?? 0
  const wins = [4, 5, 2, 3, 2, 1, 1, 0, 6][index] ?? 0
  const winrate = totalGames > 0 ? wins / totalGames : 0

  return {
    faction,
    totalGames,
    wins,
    winrate,
    avgPlace: totalGames > 0 ? 2.2 + index * 0.13 : 0,
    avgCastles: totalGames > 0 ? 5.4 - index * 0.11 : 0,
    byMode: [
      { games: Math.max(1, Math.round(totalGames * 0.65)), mode: 'classic', winrate },
      {
        games: Math.max(1, Math.round(totalGames * 0.35)),
        mode: 'feast_for_crows',
        winrate: Math.max(0, winrate - 0.08),
      },
    ],
    topPlayers: mockPlayerStats.slice(0, 3).map((stats) => ({
      games: Math.max(1, Math.round(stats.totalGames / 2)),
      user: stats.user,
      winrate: stats.winrate,
    })),
  }
})

export const mockOverviewData: OverviewData = {
  nextMatch: mockMatches.find((match) => match.status === 'planned') ?? null,
  recentMatches: mockRecentMatches.slice(0, 4),
  totalMatches: mockMatches.length,
  activePlayers: mockPlayers.length,
  mostPopularFaction: { faction: factionBySlug('lannister'), games: 12 },
  currentLeader: { user: playerById(6), wins: 5 },
  factionWinrates: [
    { faction: factionBySlug('targaryen'), winrate: 0.58 },
    { faction: factionBySlug('stark'), winrate: 0.52 },
    { faction: factionBySlug('greyjoy'), winrate: 0.36 },
    { faction: factionBySlug('lannister'), winrate: 0.34 },
    { faction: factionBySlug('martell'), winrate: 0.29 },
  ],
  topWinrate: mockPlayerStats.slice(0, 5).map((stats) => ({
    user: stats.user,
    winrate: stats.winrate,
  })),
  funFacts: [
    {
      icon: 'Crown',
      title: 'Самая длинная партия',
      description: '14 апреля шла 11 раундов и завершилась только по таймеру.',
    },
    {
      icon: 'Zap',
      title: 'Самый быстрый разворот',
      description: 'DireWolf поднялся с 4-го места на 1-е за три раунда.',
    },
    {
      icon: 'Flame',
      title: 'Метагейм сезона',
      description: 'Targaryen и Stark сейчас самые опасные дома за столом.',
    },
  ],
}

export const mockLeaderboard = mockPlayerStats
  .slice()
  .sort((left, right) => right.winrate - left.winrate)

export const mockMatchForDetail = mockRecentMatches[0]
