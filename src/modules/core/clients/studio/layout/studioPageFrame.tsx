import type {ReactNode} from "react";
import {Link} from "react-router-dom";
import {IconArrowLeft} from "@tabler/icons-react";
import ThemeSwitch from "@coreModule/components/custom/preferences/themeSwitch.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

/** The header a module's Studio page (D124) sits under: back to the editor, the page title, the theme switch. */
export default function StudioPageFrame({title, children}: {title: string; children: ReactNode}) {
    return (
        <div className="flex h-svh max-h-svh min-h-0 flex-col overflow-hidden">
            <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/">
                        <IconArrowLeft />
                        Studio
                    </Link>
                </Button>
                <span className="text-sm font-semibold">{title}</span>
                <div className="ml-auto">
                    <ThemeSwitch />
                </div>
            </header>
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
    );
}
