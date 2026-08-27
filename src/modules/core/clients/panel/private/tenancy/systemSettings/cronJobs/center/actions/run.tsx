import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Play} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";

type RunCronJobProps = WithLanguageType & {
    job: CronJob;
    onAction: (action: string) => void;
};

function RunCronJob({job, onAction, resolveLanguageKey}: RunCronJobProps) {
    const {write} = useAccess("cronjobs");
    const shortcut = "1";
    const canRun = write?.active && job.active;

    const openDialog = () => {
        if (!canRun) return;
        onAction( "run");
    };
    useKeyboardShortcuts(shortcut, openDialog);

    if (!canRun) {
        return <></>;
    }

    return (
        <DropdownMenuItem onClick={(e) => { openDialog(); }}>
            <Play size={16}/>
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/actions/run.tsx"),
    withDebug(true, true, "cronjobs"),
)(RunCronJob);
