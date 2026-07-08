import {RefObject, useEffect, useRef, useState} from "react";
import useIsInViewport from "@coreModule/helpers/hooks/useIsInViewPort.ts";

type OffsetIncrementerProps = {
    total: number,
    limit: number,
    offset: number,
    setOffset: (offset: number) => void,
    scrollRoot: RefObject<HTMLElement>,
    ready: boolean
}

function OffsetIncrementer({
    total,
    limit,
    offset,
    setOffset,
    scrollRoot,
    ready
} : OffsetIncrementerProps) {

    const [internalReady, setInternalReady] = useState(false);
    const ref= useRef<HTMLDivElement>(null);
    const inView = useIsInViewport(ref, scrollRoot);

    useEffect(() => {
        // Guard: only increment when there is actually more data to load.
        // Must check here because internalReady can be stale when offset changes
        // (effect 2 runs after this one, so we'd otherwise fire multiple times).
        if (inView && internalReady && offset + limit < total) {
            setOffset(offset + limit);
        }
    }, [inView, internalReady, offset, limit, total, setOffset]);

    useEffect(() => {
        if( ready ){
            if( offset + limit < total ){
                setInternalReady(true);
            }
        }
        else{
            setInternalReady(false);
        }
    }, [ready, offset, limit, total]);

    return (
        <div ref={ref} style={{border: "0px dashed gray"}}>
             {`Offset: ${offset}, Limit: ${limit}, Total: ${total}, Ready: ${ready ? "true" : "false"}`}
        </div>
    )
}

export default OffsetIncrementer;