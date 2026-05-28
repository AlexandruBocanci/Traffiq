export type SuceavaLocation = {
  aliases: string[];
  category: string;
  latitude: number;
  longitude: number;
  name: string;
};

export const SUCEAVA_LOCATIONS: SuceavaLocation[] = [
  {
    aliases: ['centru', 'center', 'city center', 'suceava center'],
    category: 'Area',
    latitude: 47.6514,
    longitude: 26.2556,
    name: 'City Center',
  },
  {
    aliases: ['mall', 'iulius', 'iulius mall'],
    category: 'Shopping',
    latitude: 47.6592433,
    longitude: 26.2698158,
    name: 'Iulius Mall Suceava',
  },
  {
    aliases: ['shopping city', 'shopping', 'mall burdujeni'],
    category: 'Shopping',
    latitude: 47.6646646,
    longitude: 26.2668578,
    name: 'Shopping City Suceava',
  },
  {
    aliases: ['carrefour', 'carrefour suceava'],
    category: 'Shopping',
    latitude: 47.6653881,
    longitude: 26.2666112,
    name: 'Carrefour Suceava',
  },
  {
    aliases: ['cinema', 'cinema city', 'movie'],
    category: 'Leisure',
    latitude: 47.6590384,
    longitude: 26.2731606,
    name: 'Cinema City Suceava',
  },
  {
    aliases: ['aero', 'aeroport', 'airport', 'salcea', 'stefan cel mare airport'],
    category: 'Transport',
    latitude: 47.6880591,
    longitude: 26.3524817,
    name: 'Suceava Airport',
  },
  {
    aliases: ['gara', 'gara suceava', 'burdujeni station', 'railway station', 'train station'],
    category: 'Transport',
    latitude: 47.6705477,
    longitude: 26.2663,
    name: 'Suceava Railway Station',
  },
  {
    aliases: ['autogara', 'bus station', 'autogara suceava'],
    category: 'Transport',
    latitude: 47.6614464,
    longitude: 26.2525231,
    name: 'Suceava Bus Station',
  },
  {
    aliases: ['usv', 'universitate', 'university', 'stefan cel mare university'],
    category: 'Education',
    latitude: 47.6410688,
    longitude: 26.2439935,
    name: 'Stefan cel Mare University',
  },
  {
    aliases: ['spital', 'spital judetean', 'hospital', 'judetean'],
    category: 'Healthcare',
    latitude: 47.6391876,
    longitude: 26.2404587,
    name: 'Suceava County Hospital',
  },
  {
    aliases: ['primaria', 'primarie', 'city hall', 'municipality'],
    category: 'Institution',
    latitude: 47.6400692,
    longitude: 26.247848,
    name: 'Suceava City Hall',
  },
  {
    aliases: ['prefectura', 'palatul administrativ', 'administrativ'],
    category: 'Institution',
    latitude: 47.6431779,
    longitude: 26.2586426,
    name: 'Administrative Palace Suceava',
  },
  {
    aliases: ['cetate', 'cetatea de scaun', 'fortress', 'suceava fortress'],
    category: 'Landmark',
    latitude: 47.6448494,
    longitude: 26.2703335,
    name: 'Suceava Fortress',
  },
  {
    aliases: ['muzeul satului', 'bucovinean village museum', 'satul bucovinean'],
    category: 'Landmark',
    latitude: 47.642498,
    longitude: 26.271825,
    name: 'Bucovina Village Museum',
  },
  {
    aliases: ['parc central', 'central park', 'parcul central'],
    category: 'Park',
    latitude: 47.6427719,
    longitude: 26.2596374,
    name: 'Central Park Suceava',
  },
  {
    aliases: ['manastire', 'sfantul ioan', 'manastirea sfantul ioan cel nou'],
    category: 'Landmark',
    latitude: 47.6417094,
    longitude: 26.262906,
    name: 'Saint John Monastery',
  },
  {
    aliases: ['stadion', 'areni stadium', 'stadionul areni'],
    category: 'Sport',
    latitude: 47.656296,
    longitude: 26.2612726,
    name: 'Areni Stadium',
  },
  {
    aliases: ['planetariu', 'planetarium'],
    category: 'Education',
    latitude: 47.6417914,
    longitude: 26.2454151,
    name: 'Suceava Planetarium',
  },
  {
    aliases: ['biblioteca', 'biblioteca bucovinei', 'library'],
    category: 'Education',
    latitude: 47.6419722,
    longitude: 26.2592412,
    name: 'Bucovina Library',
  },
  {
    aliases: ['colegiul stefan', 'stefan cel mare college', 'cn stefan cel mare'],
    category: 'Education',
    latitude: 47.6466058,
    longitude: 26.2569654,
    name: 'Stefan cel Mare National College',
  },
  {
    aliases: ['colegiul petru rares', 'petru rares', 'cn petru rares'],
    category: 'Education',
    latitude: 47.6432085,
    longitude: 26.2525517,
    name: 'Petru Rares National College',
  },
  {
    aliases: ['dedeman', 'diy'],
    category: 'Shopping',
    latitude: 47.6650181,
    longitude: 26.2729132,
    name: 'Dedeman Suceava',
  },
  {
    aliases: ['kaufland areni', 'kaufland', 'kaufland suceava'],
    category: 'Shopping',
    latitude: 47.6429896,
    longitude: 26.2428419,
    name: 'Kaufland Areni',
  },
  {
    aliases: ['kaufland burdujeni'],
    category: 'Shopping',
    latitude: 47.6695937,
    longitude: 26.2732467,
    name: 'Kaufland Burdujeni',
  },
  {
    aliases: ['lidl burdujeni'],
    category: 'Shopping',
    latitude: 47.6705224,
    longitude: 26.2893638,
    name: 'Lidl Burdujeni',
  },
  {
    aliases: ['lidl george enescu', 'lidl obcini', 'lidl'],
    category: 'Shopping',
    latitude: 47.6401408,
    longitude: 26.2341449,
    name: 'Lidl George Enescu',
  },
  {
    aliases: ['metro', 'metro suceava'],
    category: 'Shopping',
    latitude: 47.6345652,
    longitude: 26.2363453,
    name: 'Metro Suceava',
  },
  {
    aliases: ['selgros', 'selgros suceava'],
    category: 'Shopping',
    latitude: 47.6695493,
    longitude: 26.2478603,
    name: 'Selgros Suceava',
  },
  {
    aliases: ['obcini', 'cartier obcini'],
    category: 'Area',
    latitude: 47.6373921,
    longitude: 26.2320203,
    name: 'Obcini',
  },
  {
    aliases: ['burdujeni', 'cartier burdujeni'],
    category: 'Area',
    latitude: 47.6724044,
    longitude: 26.2790567,
    name: 'Burdujeni',
  },
  {
    aliases: ['itcani', 'gara itcani', 'cartier itcani'],
    category: 'Area',
    latitude: 47.678359,
    longitude: 26.2380981,
    name: 'Itcani',
  },
  {
    aliases: ['zamca', 'cartier zamca'],
    category: 'Area',
    latitude: 47.6506364,
    longitude: 26.2493017,
    name: 'Zamca',
  },
  {
    aliases: ['areni', 'cartier areni'],
    category: 'Area',
    latitude: 47.6402909,
    longitude: 26.2469294,
    name: 'Areni',
  },
  {
    aliases: ['calea unirii', 'unirii'],
    category: 'Street',
    latitude: 47.6585756,
    longitude: 26.2641342,
    name: 'Calea Unirii',
  },
  {
    aliases: ['george enescu', 'bulevardul george enescu'],
    category: 'Street',
    latitude: 47.6465386,
    longitude: 26.2495266,
    name: 'Bulevardul George Enescu',
  },
  {
    aliases: ['strada universitatii', 'universitatii'],
    category: 'Street',
    latitude: 47.6416,
    longitude: 26.2449,
    name: 'Strada Universitatii',
  },
  {
    aliases: ['strada stefan cel mare', 'stefan cel mare'],
    category: 'Street',
    latitude: 47.6514,
    longitude: 26.2547,
    name: 'Strada Stefan cel Mare',
  },
  {
    aliases: ['bulevardul 1 mai', '1 mai'],
    category: 'Street',
    latitude: 47.6416,
    longitude: 26.2449,
    name: 'Bulevardul 1 Mai',
  },
  {
    aliases: ['calea burdujeni'],
    category: 'Street',
    latitude: 47.6702,
    longitude: 26.2776,
    name: 'Calea Burdujeni',
  },
  {
    aliases: ['traian vuia', 'strada traian vuia'],
    category: 'Street',
    latitude: 47.6688,
    longitude: 26.2861,
    name: 'Strada Traian Vuia',
  },
  {
    aliases: ['ana ipatescu', 'strada ana ipatescu'],
    category: 'Street',
    latitude: 47.6505,
    longitude: 26.2574,
    name: 'Strada Ana Ipatescu',
  },
  {
    aliases: ['mitropoliei', 'strada mitropoliei'],
    category: 'Street',
    latitude: 47.6476,
    longitude: 26.2576,
    name: 'Strada Mitropoliei',
  },
  {
    aliases: ['marasesti', 'strada marasesti'],
    category: 'Street',
    latitude: 47.6445,
    longitude: 26.2495,
    name: 'Strada Marasesti',
  },
];

export function normalizeSuceavaLocationSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function getSearchTerms(location: SuceavaLocation) {
  return [location.name, location.category, ...location.aliases].map(
    normalizeSuceavaLocationSearch
  );
}

export function resolveSuceavaLocation(value: string) {
  const normalizedValue = normalizeSuceavaLocationSearch(value);

  return SUCEAVA_LOCATIONS.find((location) =>
    getSearchTerms(location).includes(normalizedValue)
  );
}

export function searchSuceavaLocations(query: string, limit = 8) {
  const normalizedQuery = normalizeSuceavaLocationSearch(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return SUCEAVA_LOCATIONS.map((location) => {
    const terms = getSearchTerms(location);
    const startsWithScore = terms.some((term) => term.startsWith(normalizedQuery))
      ? 0
      : 1;
    const includesScore = terms.some((term) => term.includes(normalizedQuery)) ? 0 : 1;

    return {
      location,
      score: startsWithScore * 10 + includesScore,
    };
  })
    .filter((entry) => entry.score < 11)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      return left.location.name.localeCompare(right.location.name);
    })
    .slice(0, limit)
    .map((entry) => entry.location);
}
