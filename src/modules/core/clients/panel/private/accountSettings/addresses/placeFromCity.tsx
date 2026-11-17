import {useEffect, useState} from "react";
import {useWatch, type FieldValues, type Path, type PathValue, type UseFormReturn} from "react-hook-form";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {City} from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";

type AddressFields = FieldValues & {city?: string; state?: string; latitude?: number; longitude?: number};

/**
 * When the user picks a city, fills its state (if none is chosen) and pins the map on it; the pin can still be moved
 * (TD-F114). An address loaded for editing keeps its pin until its city is changed.
 */
export function PlaceFromCity<TForm extends AddressFields>({form}: {form: UseFormReturn<TForm>}) {
    const city = useWatch({control: form.control, name: "city" as Path<TForm>}) as string | undefined;
    const picked = form.getFieldState("city" as Path<TForm>, form.formState).isDirty;
    const [request, setRequest] = useState({id: "", count: 0});

    useEffect(() => {
        if (city && picked) setRequest((current) => (current.id === city ? current : {id: city, count: current.count + 1}));
    }, [city, picked]);

    // Silent: a city the server cannot read just leaves the form as it is.
    const {data} = useHttpRequest<City>({method: "post", url: "/api/auxiliary/city/single", data: {_id: request.id}}, {}, request.count);

    useEffect(() => {
        if (!data || data._id !== request.id) return;
        const set = (name: string, value: unknown) =>
            form.setValue(name as Path<TForm>, value as PathValue<TForm, Path<TForm>>, {shouldDirty: true, shouldValidate: true});
        // Only an empty state: changing a chosen one would clear the city through the state's cascade.
        if (data.state?._id && !form.getValues("state" as Path<TForm>)) set("state", data.state._id);
        if (data.location) {
            set("latitude", data.location.latitude);
            set("longitude", data.location.longitude);
        }
    }, [data, request.id, form]);

    return null;
}
