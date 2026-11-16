import {describe, expect, it} from "vitest";
import type {ChannelUser} from "armonia/src/modules/core/dto/channel.dto";
import {
    mentionsMarkupToPlainDisplay,
    mentionsMarkupToWire,
    recordMentionDisplay,
    recordMentionId,
    recordRefOfMentionId,
    wireTextToMentionsMarkup,
    wireTextWithResolvedMentions,
} from "../mentionWire.ts";

const USER = "665f1c2b3a4d5e6f7a8b9c0d";
const PRODUCT = "665f1c2b3a4d5e6f7a8b9c0e";
const users: ChannelUser[] = [{_id: USER, name: "Ana", surname: "Hoxha"}];
const label = () => "ARIA";

describe("composer markup and stored text (D162)", () => {
    it("stores mentions and records as their tokens", () => {
        const markup = `Hi @[Ana Hoxha](${USER}), see @{products:${PRODUCT}|ARIA [DEMO]} now`;
        expect(mentionsMarkupToWire(markup)).toBe(`Hi @${USER}, see @{products:${PRODUCT}} now`);
        expect(mentionsMarkupToPlainDisplay(markup)).toBe("Hi @Ana Hoxha, see @ARIA [DEMO] now");
    });

    it("turns stored text back into markup for editing", () => {
        const wire = `Hi @${USER}, see @{products:${PRODUCT}}`;
        expect(wireTextToMentionsMarkup(wire, undefined, users, label)).toBe(`Hi @[Ana Hoxha](${USER}), see @{products:${PRODUCT}|ARIA}`);
        expect(mentionsMarkupToWire(wireTextToMentionsMarkup(wire, undefined, users, label))).toBe(wire);
    });

    it("previews stored text with names", () => {
        const wire = `@${USER} shared @{products:${PRODUCT}} and @${"0".repeat(24)}`;
        expect(wireTextWithResolvedMentions(wire, undefined, users, "Unknown", label)).toBe("@Ana Hoxha shared @ARIA and @Unknown");
    });

    it("keeps a label from closing the markup early", () => {
        expect(recordMentionDisplay("Unit {A} [B]\nnorth")).toBe("Unit {A  [B] north");
        expect(recordMentionDisplay("  ")).toBe("…");
    });

    it("tells a record's react-mentions id from a user's", () => {
        const ref = {collection: "products", id: PRODUCT};
        expect(recordRefOfMentionId(recordMentionId(ref))).toEqual(ref);
        expect(recordRefOfMentionId(USER)).toBeNull();
    });
});
