/**
 * How well a label answers what was typed: the whole label, then its start, then the start of one of its words, then
 * anywhere in it; 0 when it does not contain the text. Search lists rank by it so an exact name comes first (TD-F110).
 */
export function labelMatchRank(label: string, query: string): number {
    const text = label.trim().toLocaleLowerCase();
    const typed = query.trim().toLocaleLowerCase();
    if (!typed) return 1;
    if (text === typed) return 4;
    if (text.startsWith(typed)) return 3;
    if (text.split(/[\s/._-]+/).some((word) => word.startsWith(typed))) return 2;
    if (text.includes(typed)) return 1;
    return 0;
}

/** The items ordered by how well their label matches what was typed; ties keep their order. */
export function rankByLabel<T>(items: T[], query: string, labelOf: (item: T) => string): T[] {
    if (!query.trim()) return items;
    return items
        .map((item, index) => ({item, index, rank: labelMatchRank(labelOf(item), query)}))
        .sort((a, b) => b.rank - a.rank || a.index - b.index)
        .map(({item}) => item);
}

/**
 * The command palette's score for a page (cmdk `filter`, 0 hides it): its title as {@link labelMatchRank} ranks it;
 * below any title match, a page whose title, group or address holds every typed word. cmdk's own fuzzy score ranked
 * "Website chats › Waiting" above "Cities" for "cities".
 */
export function commandItemScore(title: string, search: string, keywords: readonly string[] = []): number {
    const rank = labelMatchRank(title, search);
    if (rank > 0) return rank / 4;
    const haystack = [title, ...keywords].join(" ").toLocaleLowerCase();
    const words = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return words.length > 0 && words.every((word) => haystack.includes(word)) ? 0.1 : 0;
}
