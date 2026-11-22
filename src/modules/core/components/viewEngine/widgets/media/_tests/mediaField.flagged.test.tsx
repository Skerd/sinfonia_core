import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";
import {FormProvider, useForm} from "react-hook-form";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (original) => ({
    ...(await original<object>()),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key}/>,
}));
// The info of every stored file: the form holds only ids, so the verdict comes from there (D177).
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: (_request: unknown, _data: unknown, _reload: unknown, _silent: unknown, _options: unknown, props: {mediaId: string | null}) => ({
        loading: false,
        error: null,
        data: props.mediaId ? {mimeType: "video/mp4", originalName: "clip.mp4", fileSize: 10, moderation: props.mediaId === FLAGGED ? "flagged" : "passed"} : undefined,
    }),
}));

import MediaField from "../mediaField.tsx";

const FLAGGED = "6b0309d9ac433659b22b0297";
const PLAIN = "6b0309d9ac433659b22b0298";

function Form({children, values}: {children: ReactNode; values: Record<string, unknown>}) {
    const form = useForm({defaultValues: values});
    return <FormProvider {...form}>{children}</FormProvider>;
}

describe("media field with a flagged video (D177)", () => {
    it("covers the stored video and loads it only once shown", () => {
        const {container} = render(
            <Form values={{videos: [FLAGGED, PLAIN]}}>
                <MediaField name="videos" label="Videos" mode="multiple" mediaType="video" editMode/>
            </Form>,
        );
        const sources = () => [...container.querySelectorAll("video")].map((video) => video.getAttribute("src"));

        expect(screen.getAllByText("May contain nudity")).toHaveLength(1);
        expect(sources()).toEqual([`/api/auxiliary/media/${PLAIN}`]);

        fireEvent.click(screen.getByRole("button", {name: /^Show/}));

        expect(screen.queryByText("May contain nudity")).toBeNull();
        expect(sources()).toEqual([`/api/auxiliary/media/${FLAGGED}?reveal=1`, `/api/auxiliary/media/${PLAIN}`]);
    });
});
