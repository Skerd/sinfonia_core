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
