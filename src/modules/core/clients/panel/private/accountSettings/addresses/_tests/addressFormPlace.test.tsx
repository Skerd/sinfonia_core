import {act, render, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useForm, type UseFormReturn} from "react-hook-form";

// Like the real hook: the same answer object until the next request; nothing before the first.
const {requests, cities, pages} = vi.hoisted(() => ({
    requests: [] as unknown[],
    cities: {tirana: {_id: "tirana", name: "Tirana", state: {_id: "tr", name: "Tirana District"}, location: {latitude: 41.3275, longitude: 19.8189}}} as Record<string, object>,
    pages: [] as Record<string, unknown>[],
}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: (request: {data: {_id: string}}, _payload: unknown, count: number) => {
        if (count > 0) requests.push(request.data);
        return {loading: false, error: null, data: count > 0 ? cities[request.data._id] ?? null : null};
    },
}));
// The create page's config, as the factory receives it.
vi.mock("@coreModule/components/entityPage/pages/createGenericCreatePage.tsx", () => ({
    createGenericCreatePage: (config: Record<string, unknown>) => {
        pages.push(config);
        return () => null;
    },
}));

import {PlaceFromCity} from "../placeFromCity.tsx";
import "../createUserAddress.tsx";

type Form = {city?: string; state?: string; latitude?: number; longitude?: number};
let form: UseFormReturn<Form>;
function Harness({values}: {values: Form}) {
    form = useForm<Form>({defaultValues: values});
    return <PlaceFromCity form={form}/>;
}

// TD-F114: picking a city neither filled its state nor moved the map; the pin was silently required.
describe("address form place", () => {
    it("fills the state and pins the map on the city the user picks", async () => {
        render(<Harness values={{}}/>);
        act(() => form.setValue("city", "tirana", {shouldDirty: true}));

        await waitFor(() => expect(form.getValues()).toMatchObject({state: "tr", latitude: 41.3275, longitude: 19.8189}));
        expect(requests.at(-1)).toEqual({_id: "tirana"});
    });

    it("keeps a chosen state, and an address loaded for editing keeps its pin", async () => {
        requests.length = 0;
        render(<Harness values={{city: "durres", state: "dr", latitude: 41.31, longitude: 19.44}}/>);
        await Promise.resolve();
        expect(requests).toEqual([]);

        act(() => form.setValue("city", "tirana", {shouldDirty: true}));
        await waitFor(() => expect(form.getValues("latitude")).toBe(41.3275));
        expect(form.getValues("state")).toBe("dr");
    });

    it("starts a new address with the person's own name and email, in the company's country", () => {
        const defaults = pages[0].defaultValues as (params: URLSearchParams, context: unknown) => Record<string, unknown>;
        const user = {name: "Arta", surname: "Hoxha", email: "arta@example.com", company: {country: "al"}};
        expect(defaults(new URLSearchParams(), {timeZone: "Europe/Tirane", user})).toMatchObject({
            firstName: "Arta", lastName: "Hoxha", email: "arta@example.com", country: "al",
        });
    });
});
