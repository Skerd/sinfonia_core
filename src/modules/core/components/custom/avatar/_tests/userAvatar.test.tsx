import {act, fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import UserAvatar from "@coreModule/components/custom/avatar/userAvatar.tsx";

const ada = {_id: "u1", name: "Ada", surname: "Lovelace", photo: ""};

/** The avatar root, wherever it ends up in the tree. */
const avatarRoot = (container: HTMLElement) => container.querySelector("[data-slot='avatar']");

describe("UserAvatar", () => {
    /**
     * The regression this suite exists for: a wrapper `div` used to sit between the tooltip
     * trigger and the avatar, so `avatarClassName` landed on the avatar while the *div* was the
     * flex item. `messageAvatar()` passes the same "shrink-0 self-end" down both of its branches,
     * and they laid out differently depending on whether a sender was known.
     */
    it("puts the caller's layout classes on the element that is laid out", () => {
        const withUser = render(<UserAvatar user={ada} avatarClassName="size-10 shrink-0 self-end"/>);
        const withoutUser = render(<UserAvatar avatarClassName="size-10 shrink-0 self-end"/>);

        for (const {container} of [withUser, withoutUser]) {
            // The avatar is the first element rendered, so it is the flex item the parent positions.
            expect(container.firstElementChild).toBe(avatarRoot(container));
            expect(container.firstElementChild?.className).toContain("self-end");
        }
    });

    it("shows the person's initials rather than an anonymous icon", () => {
        render(<UserAvatar user={ada}/>);
        expect(screen.getByText("AL")).toBeInTheDocument();
    });

    it("builds initials from whichever name parts exist", () => {
        const {container} = render(<UserAvatar user={{...ada, surname: ""}}/>);
        expect(container.textContent).toBe("A");
    });

    /** `Array.from`, so an astral first character is not split into half a surrogate pair. */
    it("does not split an astral first character", () => {
        const {container} = render(<UserAvatar user={{...ada, name: "𝒜da", surname: ""}}/>);
        expect(container.textContent).toBe("𝒜".toUpperCase());
    });

    it("falls back to the person icon when there is no name at all", () => {
        const {container} = render(<UserAvatar user={{...ada, name: "", surname: ""}}/>);
        expect(container.textContent).toBe("");
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders a plain placeholder when no user is given", () => {
        const {container} = render(<UserAvatar/>);
        expect(container.querySelector("button")).not.toBeInTheDocument();
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    describe("when clickable", () => {
        it("is a real button that fires on click", () => {
            const onClick = vi.fn();
            render(<UserAvatar user={ada} onClick={onClick}/>);
            fireEvent.click(screen.getByRole("button"));
            expect(onClick).toHaveBeenCalledOnce();
        });

        /**
         * The fallback is initials or an icon, never alt text, so without an explicit label the
         * button reached assistive tech unnamed whenever the photo was missing or failed to load.
         */
        it("is named for the person even with no photo", () => {
            render(<UserAvatar user={ada} onClick={() => {}}/>);
            expect(screen.getByRole("button", {name: "Ada Lovelace"})).toBeInTheDocument();
        });

        it("is reachable by keyboard", () => {
            render(<UserAvatar user={ada} onClick={() => {}}/>);
            const button = screen.getByRole("button");
            // Focus opens the tooltip, which is a state update of its own.
            act(() => button.focus());
            // A <div onClick> — what this used to be before it became a button — cannot take focus.
            expect(button).toHaveFocus();
        });
    });
});
