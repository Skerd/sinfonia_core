import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {readGuideRun, writeGuideRun, type GuideRun} from "./guideRun.ts";

type GuideContextValue = {
    run: GuideRun | null;
    /** Starts a setup step's tips; the caller opens the step's page. */
    startStep: (stepKey: string) => void;
    startTour: () => void;
    setRun: (run: GuideRun | null) => void;
    end: () => void;
};

const GuideContext = createContext<GuideContextValue | null>(null);

/** Holds the guided first run (D179) for the panel's private pages, so it carries on from page to page. */
export function GuideProvider({children}: {children: ReactNode}) {
    const companyId = useSelector((state: RootState) => state.authentication.user.company._id);
    const [run, setRunState] = useState<GuideRun | null>(() => readGuideRun(companyId));

    // Another company: its own run, if this tab had one there.
    useEffect(() => setRunState(readGuideRun(companyId)), [companyId]);

    const setRun = useCallback((next: GuideRun | null) => {
        writeGuideRun(next);
        setRunState(next);
    }, []);

    const value = useMemo<GuideContextValue>(() => ({
        run,
        startStep: (stepKey) => setRun({kind: "step", companyId, stepKey, tip: 0, seenPage: false}),
        startTour: () => setRun({kind: "tour", companyId, stop: 0}),
        setRun,
        end: () => setRun(null),
    }), [run, companyId, setRun]);

    return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

/** The guided first run; outside the provider (e.g. a test of one page) it does nothing. */
export function useGuide(): GuideContextValue {
    return useContext(GuideContext) ?? NO_GUIDE;
}

const NO_GUIDE: GuideContextValue = {run: null, startStep: () => undefined, startTour: () => undefined, setRun: () => undefined, end: () => undefined};
