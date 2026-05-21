import { PrismaClient } from '@prisma/client';
import { AuditAction, MatchStatus, MessageType, NotificationType, PaymentEventType, PaymentMethodType, PaymentStatus, PaymentType, PropertyStatus, PropertyType, SwipeAction, TrustEventType, UserRole, VerificationStatus, LeaseStatus } from '../src/common/constants/domain-enums';

type Listing = {
  title: string;
  description: string;
  city: string;
  zone: string | null;
  address: string | null;
  monthlyPrice: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number | null;
  furnished: boolean;
  petsAllowed: boolean;
  parking: boolean;
  roommateOk: boolean;
  type: PropertyType;
  images: string[];
  source: {
    provider: string;
    pageUrl: string;
    listingUrl: string;
  };
};

const prisma = new PrismaClient();
const useLiveListings = process.argv.includes('--live');

const SOURCE_PAGES = [
  'https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler-apartamentos/san-jose-provincia-escazu',
  'https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler-apartamentos/san-jose-provincia-curridabat',
  'https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler-apartamentos/san-jose-provincia-santa-ana',
  'https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler-apartamentos/san-jose-provincia-montes-de-oca',
];

const FALLBACK_LISTINGS: Listing[] = [
  {
    title: 'Apartamento moderno en Escazu',
    description:
      'Apartamento luminoso en torre con seguridad 24/7, balcon y acceso a gimnasio.',
    city: 'Escazu',
    zone: 'San Rafael',
    address: 'San Rafael, Escazu',
    monthlyPrice: 850,
    currency: 'USD',
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 74,
    furnished: true,
    petsAllowed: true,
    parking: true,
    roommateOk: false,
    type: PropertyType.APARTMENT,
    images: ['https://picsum.photos/seed/bilo-fallback-1/900/700'],
    source: {
      provider: 'fallback',
      pageUrl: 'https://www.encuentra24.com/',
      listingUrl: 'https://www.encuentra24.com/',
    },
  },
  {
    title: 'Casa familiar en Curridabat',
    description:
      'Casa en condominio con jardin, dos parqueos y excelente conectividad.',
    city: 'Curridabat',
    zone: 'Granadilla',
    address: 'Granadilla, Curridabat',
    monthlyPrice: 380000,
    currency: 'CRC',
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 120,
    furnished: false,
    petsAllowed: true,
    parking: true,
    roommateOk: false,
    type: PropertyType.HOUSE,
    images: ['https://picsum.photos/seed/bilo-fallback-2/900/700'],
    source: {
      provider: 'fallback',
      pageUrl: 'https://www.encuentra24.com/',
      listingUrl: 'https://www.encuentra24.com/',
    },
  },
  {
    title: 'Estudio amueblado en San Pedro',
    description:
      'Estudio amueblado cerca de universidades, ideal para estudiante o profesional joven.',
    city: 'Montes de Oca',
    zone: 'San Pedro',
    address: 'San Pedro, Montes de Oca',
    monthlyPrice: 520,
    currency: 'USD',
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 38,
    furnished: true,
    petsAllowed: false,
    parking: false,
    roommateOk: true,
    type: PropertyType.STUDIO,
    images: ['https://picsum.photos/seed/bilo-fallback-3/900/700'],
    source: {
      provider: 'fallback',
      pageUrl: 'https://www.encuentra24.com/',
      listingUrl: 'https://www.encuentra24.com/',
    },
  },
  {
    title: 'Loft urbano en Barrio Escalante',
    description:
      'Loft industrial con doble altura, balcon y cercania a cafes y restaurantes.',
    city: 'San Jose',
    zone: 'Escalante',
    address: 'Barrio Escalante, San Jose',
    monthlyPrice: 720,
    currency: 'USD',
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 62,
    furnished: true,
    petsAllowed: true,
    parking: true,
    roommateOk: false,
    type: PropertyType.LOFT,
    images: ['https://picsum.photos/seed/bilo-fallback-4/900/700'],
    source: {
      provider: 'fallback',
      pageUrl: 'https://www.encuentra24.com/',
      listingUrl: 'https://www.encuentra24.com/',
    },
  },
  {
    title: 'Apartamento ejecutivo en Santa Ana',
    description:
      'Apartamento contemporaneo con linea blanca, parqueo y seguridad.',
    city: 'Santa Ana',
    zone: 'Pozos',
    address: 'Pozos, Santa Ana',
    monthlyPrice: 950,
    currency: 'USD',
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 80,
    furnished: true,
    petsAllowed: false,
    parking: true,
    roommateOk: false,
    type: PropertyType.APARTMENT,
    images: ['https://picsum.photos/seed/bilo-fallback-5/900/700'],
    source: {
      provider: 'fallback',
      pageUrl: 'https://www.encuentra24.com/',
      listingUrl: 'https://www.encuentra24.com/',
    },
  },
  {
    title: 'Penthouse premium en Rohrmoser',
    description:
      'Penthouse con terraza, vistas abiertas, acabados premium y dos parqueos.',
    city: 'San Jose',
    zone: 'Rohrmoser',
    address: 'Rohrmoser, San Jose',
    monthlyPrice: 1650,
    currency: 'USD',
    bedrooms: 3,
    bathrooms: 3,
    areaM2: 160,
    furnished: true,
    petsAllowed: true,
    parking: true,
    roommateOk: false,
    type: PropertyType.APARTMENT,
    images: ['https://picsum.photos/seed/bilo-fallback-6/900/700'],
    source: {
      provider: 'fallback',
      pageUrl: 'https://www.encuentra24.com/',
      listingUrl: 'https://www.encuentra24.com/',
    },
  },
];

function log(message: string) {
  console.log(`[seed] ${message}`);
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(input: string) {
  return decodeHtml(input.replace(/<[^>]+>/g, ' '));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function parsePrice(raw: string) {
  const symbol = raw.includes('₡') ? 'CRC' : 'USD';
  const digits = raw.replace(/[^\d.,]/g, '');
  const normalized = digits.includes(',')
    ? digits.replace(/\./g, '').replace(/,/g, '')
    : digits.replace(/\./g, '');
  const amount = Number.parseInt(normalized, 10);

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency: symbol,
  };
}

function inferPropertyType(title: string, description: string) {
  const haystack = `${title} ${description}`.toLowerCase();
  if (haystack.includes('casa')) return PropertyType.HOUSE;
  if (haystack.includes('estudio')) return PropertyType.STUDIO;
  if (haystack.includes('loft')) return PropertyType.LOFT;
  if (haystack.includes('cuarto') || haystack.includes('habitacion')) {
    return PropertyType.ROOM;
  }
  return PropertyType.APARTMENT;
}

function boolByKeyword(text: string, keywords: string[]) {
  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function numberMatch(input: string, expression: RegExp, fallback: number) {
  const match = input.match(expression);
  if (!match) return fallback;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : fallback;
}

function parseListingCards(html: string, pageUrl: string): Listing[] {
  const cards = [...html.matchAll(/<a href="([^"]+)" target="_blank" class="block h-full w-full item-card-link">([\s\S]*?)<\/a>/g)];

  return cards
    .map(([, href, segment]) => {
      const title =
        stripTags(
          segment.match(/<h3 class="card_title[^"]*">([\s\S]*?)<\/h3>/)?.[1] ??
            '',
        ) || 'Apartamento en Costa Rica';
      const subtitle = stripTags(
        segment.match(/<p class="card_subtitle[^"]*">([\s\S]*?)<\/p>/)?.[1] ??
          '',
      );
      const description =
        decodeHtml(
          segment.match(/<p class="card_description[^"]*" title="([^"]*)"/)?.[1] ??
            segment.match(/<p class="card_description[^"]*">([\s\S]*?)<\/p>/)?.[1] ??
            '',
        ) || title;
      const priceText =
        stripTags(
          segment.match(/<span class="card_price[^"]*">([\s\S]*?)<\/span>/)?.[1] ??
            '',
        ) || '$0';
      const { amount, currency } = parsePrice(priceText);
      const images = unique(
        [...segment.matchAll(/<img[^>]+src="([^"]+)"/g)]
          .map((match) => match[1])
          .filter((image) => image.startsWith('http')),
      );
      const specsText = stripTags(segment);
      const bedrooms = numberMatch(specsText, /(\d+)\s+Rec[aá]maras/i, 1);
      const bathrooms = numberMatch(specsText, /(\d+)\s+Ba[ñn]os/i, 1);
      const parkingCount = numberMatch(description, /(\d+)\s+parqueo/i, 0);
      const areaM2 = (() => {
        const area =
          numberMatch(description, /(\d+)\s*(?:m2|m²)/i, -1) ||
          numberMatch(specsText, /(\d+)\s*(?:m2|m²)/i, -1);
        return area > 0 ? area : null;
      })();
      const [zonePart, cityPart] = subtitle
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const city = cityPart ?? zonePart ?? 'San Jose';
      const zone = cityPart ? zonePart ?? null : null;
      const fullText = `${title} ${description}`;

      return {
        title,
        description,
        city,
        zone,
        address: subtitle || null,
        monthlyPrice: amount || 0,
        currency,
        bedrooms,
        bathrooms,
        areaM2,
        furnished: boolByKeyword(fullText, [
          'amuebl',
          'furnished',
          'linea blanca',
        ]),
        petsAllowed: boolByKeyword(fullText, [
          'mascota',
          'pet friendly',
          'acepta perros',
          'acepta gatos',
        ]),
        parking: parkingCount > 0 || boolByKeyword(fullText, ['parqueo', 'parking']),
        roommateOk: boolByKeyword(fullText, [
          'roommate',
          'compartir',
          'estudiante',
        ]),
        type: inferPropertyType(title, description),
        images: images.length > 0 ? images : ['https://picsum.photos/seed/bilo-live-fallback/900/700'],
        source: {
          provider: 'encuentra24',
          pageUrl,
          listingUrl: href.startsWith('http')
            ? href
            : `https://www.encuentra24.com${href}`,
        },
      };
    })
    .filter((listing) => listing.monthlyPrice > 0);
}

async function fetchLiveListings() {
  const listings: Listing[] = [];

  for (const pageUrl of SOURCE_PAGES) {
    try {
      log(`Scraping ${pageUrl}`);
      const response = await fetch(pageUrl, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      listings.push(...parseListingCards(html, pageUrl));
    } catch (error) {
      log(`Could not scrape ${pageUrl}: ${(error as Error).message}`);
    }
  }

  const deduped = unique(
    listings.map((listing) => JSON.stringify(listing)),
  ).map((listing) => JSON.parse(listing) as Listing);

  return deduped.slice(0, 24);
}

async function resolveListings() {
  if (!useLiveListings) {
    return FALLBACK_LISTINGS;
  }

  const liveListings = await fetchLiveListings();
  if (liveListings.length >= 8) {
    log(`Using ${liveListings.length} live listings`);
    return liveListings;
  }

  log('Falling back to bundled listings because live scrape returned too little data');
  return [...liveListings, ...FALLBACK_LISTINGS].slice(0, 16);
}

async function resetDatabase() {
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIPropertyContext.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.propertyService.deleteMany({});
  await prisma.serviceProvider.deleteMany({});
  await prisma.disputeEvidence.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.trustScoreHistory.deleteMany({});
  await prisma.trustEvent.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.paymentEvent.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.lease.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.swipe.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.propertyAnalytics.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.userPreference.deleteMany({});
  await prisma.user.deleteMany({});
}

async function createPaymentWithEvents(input: {
  leaseId: string;
  payerId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: PaymentStatus;
  type: PaymentType;
  paymentMethodId?: string | null;
  providerRef: string;
  paidAt?: Date;
  message: string;
}) {
  const payment = await prisma.payment.create({
    data: {
      leaseId: input.leaseId,
      payerId: input.payerId,
      type: input.type,
      status: input.status,
      amount: input.amount,
      currency: input.currency,
      dueDate: input.dueDate,
      paidAt: input.paidAt ?? null,
      paymentMethodId: input.paymentMethodId ?? null,
    },
  });

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: PaymentEventType.CREATED,
      message: `${input.message} created`,
    },
  });

  if (input.status === PaymentStatus.PAID || input.status === PaymentStatus.FAILED) {
    const transaction = await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        provider: 'stripe_mock',
        providerRef: input.providerRef,
        amount: input.amount,
        currency: input.currency,
        success: input.status === PaymentStatus.PAID,
        rawResponse: JSON.stringify({
          seeded: true,
          providerRef: input.providerRef,
        }),
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        transactionId: transaction.id,
        eventType:
          input.status === PaymentStatus.PAID
            ? PaymentEventType.SUCCEEDED
            : PaymentEventType.FAILED,
        message: input.message,
      },
    });
  }

  if (input.status === PaymentStatus.PENDING || input.status === PaymentStatus.LATE) {
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType:
          input.status === PaymentStatus.LATE
            ? PaymentEventType.LATE
            : PaymentEventType.CREATED,
        message: input.message,
      },
    });
  }

  return payment;
}

async function main() {
  log(`Starting seed (${useLiveListings ? 'live scrape' : 'fallback dataset'})`);
  await resetDatabase();

  const listings = await resolveListings();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@bilo.app',
      fullName: 'BILO Admin',
      role: UserRole.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      trustScore: 95,
    },
  });

  const tenants = await Promise.all([
    prisma.user.create({
      data: {
        email: 'andres.quesada@gmail.com',
        fullName: 'Andres Quesada',
        role: UserRole.TENANT,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 86,
        avatarUrl: 'https://i.pravatar.cc/150?img=11',
        bio: 'Disenador remoto, ordenado y puntual con los pagos.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ana@bilo.app',
        fullName: 'Ana Tenant',
        role: UserRole.TENANT,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 82,
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bruno@bilo.app',
        fullName: 'Bruno Tenant',
        role: UserRole.TENANT,
        verificationStatus: VerificationStatus.PENDING,
        trustScore: 61,
        avatarUrl: 'https://i.pravatar.cc/150?img=13',
      },
    }),
    prisma.user.create({
      data: {
        email: 'pablo.mora@bilo.app',
        fullName: 'Pablo Mora',
        role: UserRole.TENANT,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 78,
        avatarUrl: 'https://i.pravatar.cc/150?img=14',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carolina.brenes@bilo.app',
        fullName: 'Carolina Brenes',
        role: UserRole.TENANT,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 88,
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
      },
    }),
    prisma.user.create({
      data: {
        email: 'roberto.solano@bilo.app',
        fullName: 'Roberto Solano',
        role: UserRole.TENANT,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 47,
        avatarUrl: 'https://i.pravatar.cc/150?img=16',
      },
    }),
  ]);

  const landlords = await Promise.all([
    prisma.user.create({
      data: {
        email: 'carla@bilo.app',
        fullName: 'Maria Solis',
        role: UserRole.LANDLORD,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 90,
        avatarUrl: 'https://i.pravatar.cc/150?img=21',
        bio: 'Superhost enfocada en apartamentos premium del oeste.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'diego@bilo.app',
        fullName: 'Carlos Mora',
        role: UserRole.LANDLORD,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 84,
        avatarUrl: 'https://i.pravatar.cc/150?img=22',
      },
    }),
    prisma.user.create({
      data: {
        email: 'laura@bilo.app',
        fullName: 'Laura Vargas',
        role: UserRole.LANDLORD,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 81,
        avatarUrl: 'https://i.pravatar.cc/150?img=23',
      },
    }),
    prisma.user.create({
      data: {
        email: 'aurora@bilo.app',
        fullName: 'Inmobiliaria Aurora',
        role: UserRole.LANDLORD,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 92,
        avatarUrl: 'https://i.pravatar.cc/150?img=24',
        bio: 'Portafolio premium en Rohrmoser, Escazu y Santa Ana.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ramirez@bilo.app',
        fullName: 'Diego Ramirez',
        role: UserRole.LANDLORD,
        verificationStatus: VerificationStatus.VERIFIED,
        trustScore: 79,
        avatarUrl: 'https://i.pravatar.cc/150?img=25',
      },
    }),
  ]);

  const [andres, ana, bruno, pablo, carolina, roberto] = tenants;
  const [maria, carlos, laura, aurora, diego] = landlords;

  await prisma.userPreference.createMany({
    data: [
      {
        userId: andres.id,
        budgetMin: 500,
        budgetMax: 1200,
        preferredCity: 'Escazu',
        preferredZone: 'San Rafael',
        acceptsPets: true,
        needsParking: true,
        needsFurnished: true,
        wantsRoommate: false,
        minBedrooms: 1,
      },
      {
        userId: ana.id,
        budgetMin: 400,
        budgetMax: 950,
        preferredCity: 'Santa Ana',
        preferredZone: 'Pozos',
        acceptsPets: false,
        needsParking: true,
        needsFurnished: true,
        wantsRoommate: false,
        minBedrooms: 1,
      },
      {
        userId: bruno.id,
        budgetMin: 350,
        budgetMax: 700,
        preferredCity: 'Montes de Oca',
        preferredZone: 'San Pedro',
        acceptsPets: false,
        needsParking: false,
        needsFurnished: false,
        wantsRoommate: true,
        minBedrooms: 1,
      },
      {
        userId: pablo.id,
        budgetMin: 600,
        budgetMax: 1100,
        preferredCity: 'Escazu',
        preferredZone: 'Guachipelin',
        acceptsPets: false,
        needsParking: true,
        needsFurnished: true,
        wantsRoommate: false,
        minBedrooms: 2,
      },
      {
        userId: carolina.id,
        budgetMin: 300000,
        budgetMax: 500000,
        preferredCity: 'Curridabat',
        preferredZone: 'Granadilla',
        acceptsPets: true,
        needsParking: true,
        needsFurnished: false,
        wantsRoommate: false,
        minBedrooms: 2,
      },
      {
        userId: roberto.id,
        budgetMin: 1200,
        budgetMax: 2000,
        preferredCity: 'San Jose',
        preferredZone: 'Rohrmoser',
        acceptsPets: true,
        needsParking: true,
        needsFurnished: true,
        wantsRoommate: false,
        minBedrooms: 2,
      },
    ],
  });

  const landlordCycle = [maria, carlos, laura, aurora, diego];

  const properties = [];
  for (const [index, listing] of listings.entries()) {
    const landlord = landlordCycle[index % landlordCycle.length];
    const property = await prisma.property.create({
      data: {
        landlordId: landlord.id,
        title: listing.title,
        description: listing.description,
        type: listing.type,
        status: PropertyStatus.ACTIVE,
        city: listing.city,
        zone: listing.zone,
        address: listing.address,
        monthlyPrice: listing.monthlyPrice,
        depositAmount: listing.monthlyPrice,
        currency: listing.currency,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        areaM2: listing.areaM2,
        furnished: listing.furnished,
        petsAllowed: listing.petsAllowed,
        parking: listing.parking,
        roommateOk: listing.roommateOk,
        availableFrom: new Date(),
        metadata: JSON.stringify({
          source: listing.source,
        }),
        images: {
          create: listing.images.slice(0, 5).map((url, imageIndex) => ({
            url,
            position: imageIndex,
          })),
        },
        analytics: {
          create: {
            viewCount: 25 + index * 7,
            likeCount: index % 4,
            matchCount: index % 3,
          },
        },
      },
      include: {
        images: true,
      },
    });

    if (index < 6) {
      await prisma.aIPropertyContext.create({
        data: {
          propertyId: property.id,
          context: `${listing.title}. ${listing.description}`.slice(0, 500),
        },
      });
    }

    properties.push(property);
  }

  const [propertyA, propertyB, propertyC, propertyD, propertyE] = properties;

  await prisma.paymentMethod.createMany({
    data: [
      {
        userId: andres.id,
        type: PaymentMethodType.BANK_TRANSFER,
        brand: 'SINPE',
        last4: '4421',
        isDefault: true,
      },
      {
        userId: carolina.id,
        type: PaymentMethodType.BANK_TRANSFER,
        brand: 'BAC',
        last4: '2277',
        isDefault: true,
      },
      {
        userId: roberto.id,
        type: PaymentMethodType.CARD,
        brand: 'Visa',
        last4: '9381',
        isDefault: true,
      },
    ],
  });

  const andresMethod = await prisma.paymentMethod.findFirst({
    where: { userId: andres.id, isDefault: true },
  });
  const carolinaMethod = await prisma.paymentMethod.findFirst({
    where: { userId: carolina.id, isDefault: true },
  });
  const robertoMethod = await prisma.paymentMethod.findFirst({
    where: { userId: roberto.id, isDefault: true },
  });

  await prisma.swipe.createMany({
    data: [
      { userId: andres.id, propertyId: propertyA.id, action: SwipeAction.LIKE },
      { userId: andres.id, propertyId: propertyB.id, action: SwipeAction.DISLIKE },
      { userId: andres.id, propertyId: propertyE.id, action: SwipeAction.LIKE },
      { userId: ana.id, propertyId: propertyA.id, action: SwipeAction.LIKE },
      { userId: bruno.id, propertyId: propertyC.id, action: SwipeAction.LIKE },
      { userId: pablo.id, propertyId: propertyE.id, action: SwipeAction.SUPERLIKE },
      { userId: carolina.id, propertyId: propertyB.id, action: SwipeAction.LIKE },
      { userId: roberto.id, propertyId: propertyD.id, action: SwipeAction.LIKE },
    ],
  });

  const matchAndres = await prisma.match.create({
    data: {
      tenantId: andres.id,
      landlordId: propertyA.landlordId,
      propertyId: propertyA.id,
      status: MatchStatus.ACTIVE,
      acceptedAt: new Date('2026-05-01T15:00:00.000Z'),
    },
  });
  const matchPablo = await prisma.match.create({
    data: {
      tenantId: pablo.id,
      landlordId: propertyE.landlordId,
      propertyId: propertyE.id,
      status: MatchStatus.ACTIVE,
      acceptedAt: new Date('2026-05-18T12:00:00.000Z'),
    },
  });
  const matchCarolina = await prisma.match.create({
    data: {
      tenantId: carolina.id,
      landlordId: propertyB.landlordId,
      propertyId: propertyB.id,
      status: MatchStatus.ACTIVE,
      acceptedAt: new Date('2026-04-10T10:00:00.000Z'),
    },
  });
  const matchRoberto = await prisma.match.create({
    data: {
      tenantId: roberto.id,
      landlordId: propertyD.landlordId,
      propertyId: propertyD.id,
      status: MatchStatus.ACTIVE,
      acceptedAt: new Date('2026-03-01T18:00:00.000Z'),
    },
  });

  const convoAndres = await prisma.conversation.create({
    data: { matchId: matchAndres.id },
  });
  const convoPablo = await prisma.conversation.create({
    data: { matchId: matchPablo.id },
  });
  const convoCarolina = await prisma.conversation.create({
    data: { matchId: matchCarolina.id },
  });
  const convoRoberto = await prisma.conversation.create({
    data: { matchId: matchRoberto.id },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: convoAndres.id,
        senderId: andres.id,
        content: 'Hola Maria, me interesa visitar este apartamento esta semana.',
        messageType: MessageType.TEXT,
        createdAt: new Date('2026-05-01T15:10:00.000Z'),
      },
      {
        conversationId: convoAndres.id,
        senderId: maria.id,
        content: 'Perfecto Andres. Tengo espacio el jueves a las 4pm.',
        messageType: MessageType.TEXT,
        createdAt: new Date('2026-05-01T15:18:00.000Z'),
      },
      {
        conversationId: convoPablo.id,
        senderId: pablo.id,
        content: 'Hola, sigue disponible y acepta visita por la tarde?',
        messageType: MessageType.TEXT,
        createdAt: new Date('2026-05-18T12:15:00.000Z'),
      },
      {
        conversationId: convoPablo.id,
        senderId: diego.id,
        content: 'Si, sigue disponible. Te comparto detalles hoy mismo.',
        messageType: MessageType.TEXT,
        createdAt: new Date('2026-05-18T12:40:00.000Z'),
      },
      {
        conversationId: convoCarolina.id,
        senderId: carolina.id,
        content: 'La casa nos funciona muy bien. Queremos avanzar con el contrato.',
        messageType: MessageType.TEXT,
        createdAt: new Date('2026-04-10T10:30:00.000Z'),
      },
      {
        conversationId: convoRoberto.id,
        senderId: aurora.id,
        content: 'Te recordamos el pago pendiente de este mes.',
        messageType: MessageType.TEXT,
        createdAt: new Date('2026-05-09T09:00:00.000Z'),
      },
    ],
  });

  const leaseAndres = await prisma.lease.create({
    data: {
      matchId: matchAndres.id,
      propertyId: propertyA.id,
      tenantId: andres.id,
      landlordId: propertyA.landlordId,
      status: LeaseStatus.ACTIVE,
      monthlyAmount: propertyA.monthlyPrice,
      depositAmount: propertyA.monthlyPrice,
      currency: propertyA.currency,
      dueDay: 1,
      startDate: new Date('2026-05-01T00:00:00.000Z'),
    },
  });
  const leaseCarolina = await prisma.lease.create({
    data: {
      matchId: matchCarolina.id,
      propertyId: propertyB.id,
      tenantId: carolina.id,
      landlordId: propertyB.landlordId,
      status: LeaseStatus.ACTIVE,
      monthlyAmount: propertyB.monthlyPrice,
      depositAmount: propertyB.monthlyPrice,
      currency: propertyB.currency,
      dueDay: 5,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
    },
  });
  const leaseRoberto = await prisma.lease.create({
    data: {
      matchId: matchRoberto.id,
      propertyId: propertyD.id,
      tenantId: roberto.id,
      landlordId: propertyD.landlordId,
      status: LeaseStatus.ACTIVE,
      monthlyAmount: propertyD.monthlyPrice,
      depositAmount: propertyD.monthlyPrice,
      currency: propertyD.currency,
      dueDay: 1,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
    },
  });

  await prisma.match.updateMany({
    where: {
      id: { in: [matchAndres.id, matchCarolina.id, matchRoberto.id] },
    },
    data: { status: MatchStatus.CONVERTED_TO_LEASE },
  });

  const depositAndres = await createPaymentWithEvents({
    leaseId: leaseAndres.id,
    payerId: andres.id,
    amount: leaseAndres.depositAmount,
    currency: leaseAndres.currency,
    dueDate: leaseAndres.startDate,
    status: PaymentStatus.PAID,
    type: PaymentType.DEPOSIT,
    paymentMethodId: andresMethod?.id,
    providerRef: 'seed-deposit-andres',
    paidAt: leaseAndres.startDate,
    message: 'Andres deposit paid',
  });
  const rentMayAndres = await createPaymentWithEvents({
    leaseId: leaseAndres.id,
    payerId: andres.id,
    amount: leaseAndres.monthlyAmount,
    currency: leaseAndres.currency,
    dueDate: new Date('2026-05-01T00:00:00.000Z'),
    status: PaymentStatus.PAID,
    type: PaymentType.RENT,
    paymentMethodId: andresMethod?.id,
    providerRef: 'seed-rent-andres-may',
    paidAt: new Date('2026-05-01T09:00:00.000Z'),
    message: 'Andres May rent paid',
  });
  await createPaymentWithEvents({
    leaseId: leaseAndres.id,
    payerId: andres.id,
    amount: leaseAndres.monthlyAmount,
    currency: leaseAndres.currency,
    dueDate: new Date('2026-06-01T00:00:00.000Z'),
    status: PaymentStatus.PENDING,
    type: PaymentType.RENT,
    paymentMethodId: andresMethod?.id,
    providerRef: 'seed-rent-andres-june',
    message: 'Andres June rent pending',
  });

  await createPaymentWithEvents({
    leaseId: leaseCarolina.id,
    payerId: carolina.id,
    amount: leaseCarolina.depositAmount,
    currency: leaseCarolina.currency,
    dueDate: leaseCarolina.startDate,
    status: PaymentStatus.PAID,
    type: PaymentType.DEPOSIT,
    paymentMethodId: carolinaMethod?.id,
    providerRef: 'seed-deposit-carolina',
    paidAt: leaseCarolina.startDate,
    message: 'Carolina deposit paid',
  });
  await createPaymentWithEvents({
    leaseId: leaseCarolina.id,
    payerId: carolina.id,
    amount: leaseCarolina.monthlyAmount,
    currency: leaseCarolina.currency,
    dueDate: new Date('2026-05-05T00:00:00.000Z'),
    status: PaymentStatus.PAID,
    type: PaymentType.RENT,
    paymentMethodId: carolinaMethod?.id,
    providerRef: 'seed-rent-carolina-may',
    paidAt: new Date('2026-05-05T09:30:00.000Z'),
    message: 'Carolina May rent paid',
  });

  await createPaymentWithEvents({
    leaseId: leaseRoberto.id,
    payerId: roberto.id,
    amount: leaseRoberto.depositAmount,
    currency: leaseRoberto.currency,
    dueDate: leaseRoberto.startDate,
    status: PaymentStatus.PAID,
    type: PaymentType.DEPOSIT,
    paymentMethodId: robertoMethod?.id,
    providerRef: 'seed-deposit-roberto',
    paidAt: leaseRoberto.startDate,
    message: 'Roberto deposit paid',
  });
  await createPaymentWithEvents({
    leaseId: leaseRoberto.id,
    payerId: roberto.id,
    amount: leaseRoberto.monthlyAmount,
    currency: leaseRoberto.currency,
    dueDate: new Date('2026-05-01T00:00:00.000Z'),
    status: PaymentStatus.LATE,
    type: PaymentType.RENT,
    paymentMethodId: robertoMethod?.id,
    providerRef: 'seed-rent-roberto-late',
    message: 'Roberto May rent overdue',
  });

  await prisma.rating.createMany({
    data: [
      {
        leaseId: leaseAndres.id,
        fromId: maria.id,
        toId: andres.id,
        score: 5,
        comment: 'Excelente inquilino. Puntual y muy ordenado.',
      },
      {
        leaseId: leaseCarolina.id,
        fromId: carlos.id,
        toId: carolina.id,
        score: 5,
        comment: 'Muy buena comunicacion y cuido perfecto del inmueble.',
      },
      {
        leaseId: leaseRoberto.id,
        fromId: aurora.id,
        toId: roberto.id,
        score: 3,
        comment: 'Buena comunicacion, pero varios pagos han llegado tarde.',
      },
    ],
  });

  await prisma.trustEvent.createMany({
    data: [
      {
        userId: andres.id,
        type: TrustEventType.PAYMENT_ON_TIME,
        delta: 10,
        reason: 'Deposit and first rent paid on time',
      },
      {
        userId: andres.id,
        type: TrustEventType.POSITIVE_RATING,
        delta: 5,
        reason: '5-star landlord review',
      },
      {
        userId: carolina.id,
        type: TrustEventType.POSITIVE_RATING,
        delta: 4,
        reason: 'Consistent tenant history',
      },
      {
        userId: roberto.id,
        type: TrustEventType.PAYMENT_LATE,
        delta: -12,
        reason: 'May rent overdue',
      },
    ],
  });

  await prisma.trustScoreHistory.createMany({
    data: [
      {
        userId: andres.id,
        oldScore: 71,
        newScore: 86,
        delta: 15,
        reason: 'On-time payments and positive rating',
      },
      {
        userId: roberto.id,
        oldScore: 59,
        newScore: 47,
        delta: -12,
        reason: 'Late rent payment',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: andres.id,
        type: NotificationType.LEASE_CREATED,
        title: 'Tu alquiler esta activo',
        body: `Ya quedo activo para ${propertyA.title}.`,
      },
      {
        userId: andres.id,
        type: NotificationType.PAYMENT_DUE,
        title: 'Pago proximo',
        body: 'Tu renta de junio vence pronto.',
      },
      {
        userId: maria.id,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'Nuevo mensaje',
        body: 'Andres te escribio sobre la visita.',
      },
      {
        userId: roberto.id,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Pago atrasado',
        body: 'Tu pago sigue pendiente.',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: maria.id,
        entityType: 'property',
        entityId: propertyA.id,
        action: AuditAction.PROPERTY_CREATED,
        newValues: JSON.stringify({ title: propertyA.title }),
      },
      {
        actorUserId: andres.id,
        entityType: 'lease',
        entityId: leaseAndres.id,
        action: AuditAction.LEASE_CREATED,
        newValues: JSON.stringify({ leaseId: leaseAndres.id }),
      },
      {
        actorUserId: andres.id,
        entityType: 'payment',
        entityId: rentMayAndres.id,
        action: AuditAction.PAYMENT_PAID,
        newValues: JSON.stringify({ amount: rentMayAndres.amount }),
      },
      {
        actorUserId: admin.id,
        entityType: 'seed',
        entityId: depositAndres.id,
        action: AuditAction.PAYMENT_CREATED,
        newValues: JSON.stringify({
          dataset: useLiveListings ? 'live' : 'fallback',
        }),
      },
    ],
  });

  log(
    JSON.stringify(
      {
        mode: useLiveListings ? 'live' : 'fallback',
        users: await prisma.user.count(),
        properties: await prisma.property.count(),
        leases: await prisma.lease.count(),
        conversations: await prisma.conversation.count(),
        payments: await prisma.payment.count(),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
