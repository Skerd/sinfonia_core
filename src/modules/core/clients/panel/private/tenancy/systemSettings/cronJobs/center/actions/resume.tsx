import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {PlayCircle} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";

type ResumeCronJobProps = WithLanguageType & {
    job: CronJob;
    onAction: (action: string) => void;
};

function ResumeCronJob({job, onAction, resolveLanguageKey}: ResumeCronJobProps) {
    const {write} = useAccess("cronjobs");
    const shortcut = "3";
    const canResume = write?.active && !job.active;

    const openDialog = () => {
        if (!canResume) return;
        onAction("resume");
    };
    useKeyboardShortcuts(shortcut, openDialog);

    if (!canResume) {
        return <></>;
    }

    return (
        <DropdownMenuItem onClick={() => { openDialog(); }}>
            <PlayCircle size={16}/>
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/cronJobs/center/actions/resume.tsx"),
    withDebug(true, true, "cronjobs"),
)(ResumeCronJob);
