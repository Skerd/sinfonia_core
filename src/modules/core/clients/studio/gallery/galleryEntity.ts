/** Valid ObjectId shape so ref widgets and `/single` fetches do not reject the stub. */
export const GALLERY_OBJECT_ID = "000000000000000000000001";

/**
 * Tokens that are list/reference entity cards (`#CategoryCard`, `#UnitCard`, …).
 *
 * They take a named entity prop (`category`, `unit`) and go through `EntityCard`,
 * which reads `entity.deletedAt` on mount. The ViewRenderer fallthrough only
 * spreads `widgetProps`, so a gallery field node with no stub crashes.
 *
 * `#DisplayCard` / `#EmbeddedAddressCard` are sheet field widgets, not entity cards.
 */
const NOT_ENTITY_CARDS = new Set(["#DisplayCard", "#EmbeddedAddressCard"]);

export function isEntityCardToken(token: string): boolean {
    return token.endsWith("Card") && !NOT_ENTITY_CARDS.has(token);
}

const PROP_BY_TOKEN: Record<string, string> = {
    "#TenancyCountryCard": "country",
    "#TenancyStateCard": "state",
    "#TenancyCityCard": "city",
    "#TenancyCurrencyCard": "currency",
    "#UnitSaleCard": "sale",
    "#UnitReservationCard": "reservation",
    "#UnitPaymentPlanCard": "paymentPlan",
};

/**
 * Prop name the card component actually reads (`category` on `#CategoryCard`).
 *
 * Prefer the registry's `referencesDefaultItemProps`, then the handful of
 * tenancy/unit aliases, then the token with `Card` stripped.
 */
export function entityPropName(
    token: string,
    registered: string | undefined,
): string {
    if (registered) return registered;
    const mapped = PROP_BY_TOKEN[token];
    if (mapped) return mapped;
    const raw = token.replace(/^#/, "").replace(/SheetView$/, "").replace(/Card$/, "");
    if (!raw) return "item";
    return raw.charAt(0).toLowerCase() + raw.slice(1);
}

/**
 * A stub every `EntityCard` (and most nested `entity.foo.bar` reads) can survive.
 *
 * `deletedAt` must be present as a key-on-an-object — passing `undefined` as the
 * whole entity is what throws `Cannot read properties of undefined (reading 'deletedAt')`.
 */
export function galleryEntityStub(): Record<string, unknown> {
    const geo = {
        _id: GALLERY_OBJECT_ID,
        name: "Sample",
        code: "AL",
        deletedAt: undefined,
        deletedBy: undefined,
    };
    return {
        _id: GALLERY_OBJECT_ID,
        name: "Sample",
        title: "Sample",
        slug: "sample",
        code: "SMP",
        abbreviation: "EUR",
        symbol: "€",
        phoneCode: "+355",
        order: 1,
        status: "active",
        unitNumber: "A-101",
        deletedAt: undefined,
        deletedBy: undefined,
        isAvailable: true,
        isActive: true,
        isAccessible: true,
        hasEmergencyExit: false,
        price: 100000,
        area: 85,
        numberOfRooms: 2,
        numberOfBathrooms: 1,
        hasBalcony: true,
        hasTerrace: false,
        constructionStatus: "completed",
        imageGallery: [],
        videoGallery: [],
        parent: {_id: GALLERY_OBJECT_ID, name: "Parent"},
        project: {_id: GALLERY_OBJECT_ID, name: "Sample project"},
        edifice: {_id: GALLERY_OBJECT_ID, name: "Sample edifice"},
        floor: {_id: GALLERY_OBJECT_ID, name: "Floor 1"},
        unitType: {_id: GALLERY_OBJECT_ID, name: "Apartment"},
        paymentType: "cash",
        soldAt: "2026-03-01T00:00:00.000Z",
        saleDate: "2026-03-01T00:00:00.000Z",
        handoverDate: "2026-06-01T00:00:00.000Z",
        finalPrice: 100000,
        soldBy: {name: "Lira", surname: "Hoxha"},
        priceCurrency: {symbol: "€", abbreviation: "EUR"},
        unit: {
            _id: GALLERY_OBJECT_ID,
            name: "Sample",
            unitNumber: "A-101",
            unitType: {_id: GALLERY_OBJECT_ID, name: "Apartment"},
            deletedAt: undefined,
            deletedBy: undefined,
        },
        country: geo,
        state: {_id: GALLERY_OBJECT_ID, name: "Tirana"},
        city: {_id: GALLERY_OBJECT_ID, name: "Tirana"},
        address: {
            street: "Rruga e Durrësit",
            postalCode: "1001",
            latitude: 41.3275,
            longitude: 19.8189,
            city: {_id: GALLERY_OBJECT_ID, name: "Tirana"},
            state: {_id: GALLERY_OBJECT_ID, name: "Tirana"},
            country: geo,
        },
        agent: {name: "Ada", surname: "Kola"},
        statistics: {
            totalArea: 85,
            totalInvestmentValue: [],
            unitsByStatus: [],
        },
        currency: {symbol: "€", abbreviation: "EUR", name: "Euro"},
        customer: {_id: GALLERY_OBJECT_ID, name: "Ada", surname: "Kola"},
        buyer: {_id: GALLERY_OBJECT_ID, name: "Ada", surname: "Kola"},
    };
}

/**
 * Extra props list cards read besides the named entity (`unitId` on `#SaleCard`).
 *
 * Never pass `fetchId` — that would hit `/single` with the stub id.
 */
export function galleryCardExtraProps(): Record<string, unknown> {
    return {
        hideActions: true,
        unitId: GALLERY_OBJECT_ID,
        unitName: "Sample",
    };
}
