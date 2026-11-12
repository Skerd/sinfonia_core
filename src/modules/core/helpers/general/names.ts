/** Anything with the user name fields: channel users, message senders, `deletedBy`, populated refs. */
export type NamedUser = {
    name?: string | null;
    surname?: string | null;
};

/** "Name Surname", or whichever of the two is set; `""` when the user is missing or unnamed. */
export function getName(user: NamedUser | null | undefined): string {
    if (!user) return "";
    return [user.name, user.surname].filter(Boolean).join(" ").trim();
}

/** `submissionDeadline` → `Submission Deadline`; the last resort when nothing is translated. */
export function humanizeKey(key: string): string {
    const leaf = key.split(".").pop() ?? key;
    return leaf
        .replace(/[_-]+/g, " ")
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        /* Title-cases every word, so the fallback reads right on its own rather than
           leaning on a `capitalize` class the popover copy of the badge might not have. */
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
