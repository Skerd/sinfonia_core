import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Pause} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";

type PauseCronJobProps = WithLanguageType & {
    job: CronJob;
    onAction: (action: string) => void;
};

function PauseCronJob({job, onAction, resolveLanguageKey}: PauseCronJobProps) {
    const {write} = useAccess("cronjobs");
    const shortcut = "2";
    const canPause = write?.active && job.active;

    const openDialog = () => {
        if (!canPause) return;
        onAction("pause");
    };
    useKeyboardShortcuts(shortcut, openDialog);

    if (!canPause) {
        return <></>;
    }

    return (
        <DropdownMenuItem onClick={() => { openDialog(); }}>
            <Pause size={16}/>
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/actions/pause.tsx"),
    withDebug(true, true, "cronjobs"),
)(PauseCronJob);
