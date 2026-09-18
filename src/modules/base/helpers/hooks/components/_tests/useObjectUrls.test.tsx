import {render} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {useObjectUrls} from "@baseModule/helpers/hooks/components/useObjectUrls.ts";

const created: string[] = [];
const revoked: string[] = [];

beforeEach(() => {
    created.length = 0;
    revoked.length = 0;
    let n = 0;
    vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: vi.fn(() => {
            const url = `blob:test/${n++}`;
            created.push(url);
            return url;
        }),
        revokeObjectURL: vi.fn((url: string) => {
            revoked.push(url);
        }),
    });
});

const fileA = new File(["a"], "a.png", {type: "image/png"});
const fileB = new File(["b"], "b.png", {type: "image/png"});

function Probe({items}: {items: unknown[]}) {
    const urlFor = useObjectUrls(items);
    return (
        <>
            {items.filter((i): i is File => i instanceof File).map((f, i) => (
                <img key={i} src={urlFor(f)} alt=""/>
            ))}
        </>
    );
}

describe("useObjectUrls", () => {
    it("creates one URL per File and reuses it across re-renders", () => {
        const {rerender} = render(<Probe items={[fileA]}/>);
        rerender(<Probe items={[fileA]}/>);
        rerender(<Probe items={[fileA]}/>);
        expect(created).toHaveLength(1);
    });

    it("revokes a URL once its File leaves the list", () => {
        const {rerender} = render(<Probe items={[fileA, fileB]}/>);
        expect(created).toHaveLength(2);
        rerender(<Probe items={[fileA]}/>);
        expect(revoked).toEqual([created[1]]);
    });

    it("revokes every outstanding URL on unmount", () => {
        const {unmount} = render(<Probe items={[fileA, fileB]}/>);
        expect(revoked).toHaveLength(0);
        unmount();
        expect(revoked.sort()).toEqual([...created].sort());
    });

    it("ignores non-File entries in a mixed File | string list", () => {
        render(<Probe items={["existing-media-id", fileA, null]}/>);
        expect(created).toHaveLength(1);
    });
});
