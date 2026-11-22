import {useState} from "react";
import {compose} from "redux";
import {
    IconBuilding,
    IconCalendar,
    IconCheck,
    IconEye,
    IconFile,
    IconFileDescription,
    IconFingerprint,
    IconLink,
    IconRoute,
    IconTrash,
    IconUser,
    IconUserCheck,
    IconWorld,
} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {FLOATING_SHEET_CONTENT_CLASS, ENTITY_SHEET_WIDTH_CLASS} from "@coreModule/components/viewEngine/sheet/widgets/sheetFloatingChrome.ts";
import {SheetGroup} from "@coreModule/components/viewEngine/widgets/layout/sheet/group.tsx";
import {SheetGrid} from "@coreModule/components/viewEngine/widgets/layout/sheet/grid.tsx";
import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import {TextBadge} from "@coreModule/components/entityPage/list/table/tableCellPrimitives.tsx";
import {toneClass} from "@coreModule/components/entityPage/list/table/columnConfigToColumnDef.tsx";
import MediaPreviewContent from "@coreModule/components/viewEngine/widgets/media/mediaPreviewContent.tsx";
import {formatFileSize} from "@coreModule/components/viewEngine/widgets/media/mediaPreviewKind.ts";
import {isHeldModerationStatus} from "@coreModule/components/viewEngine/widgets/media/flaggedMedia.tsx";
import UploadReviewDecisionDialog from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewDecisionDialog.tsx";
import {UPLOAD_REVIEW_STATUS_TONES} from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewCard.tsx";
import type {UploadReviewItem, UploadReviewScores} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

const SCORE_NAMES: (keyof UploadReviewScores)[] = ["porn", "hentai", "sexy", "neutral", "drawing"];
const percent = (value: number | undefined) => (value === undefined ? undefined : `${Math.round(value * 100)}%`);

export type UploadReviewSheetOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: UploadReviewItem;
    /** After a decision: the lists and their counts change. */
    onDecided: () => void;
};

/**
 * Everything the review knows about one file (D177), in the sheet order of UX-03: its state and decisions with the file
 * itself, then the upload, the content check's scores, the file's details, and the review last.
 */
function UploadReviewSheet({open, onOpenChange, item: given, onDecided, resolveLanguageKey}: UploadReviewSheetOwnProps & WithLanguageType) {
    const text = resolveLanguageKey;
    // A decision moves the file to another list; the sheet keeps showing it with its new state.
    const [item, setItem] = useState(given);
    const [decision, setDecision] = useState<"approve" | "remove" | null>(null);
    const src = `/api/auxiliary/media/review/${item._id}`;
    const stored = item.kind === "media";
    const canApprove = stored && (item.status === "flagged" || item.status === "rejected");
    const canRemove = stored && (item.status === "flagged" || item.status === "approved");
    const card = (title: string, Icon: typeof IconFile, value: unknown, type?: "dateTime") => (
        <DisplayCard show={value !== undefined && value !== ""} title={title} tooltip={title} Icon={Icon} value={value} type={type} />
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className={cn(FLOATING_SHEET_CONTENT_CLASS, ENTITY_SHEET_WIDTH_CLASS, "overflow-y-auto")}>
                <SheetHeader>
                    <SheetTitle className="break-all pe-8">{item.fileName}</SheetTitle>
                    <SheetDescription>{item.company.name}</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 px-4 pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <TextBadge label={text(`status.${item.status}`)} className={toneClass(UPLOAD_REVIEW_STATUS_TONES[item.status])} />
                        {canApprove && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setDecision("approve")}>
                                <IconCheck /> {text("approve")}
                            </Button>
                        )}
                        {canRemove && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => setDecision("remove")}>
                                <IconTrash /> {text("remove")}
                            </Button>
                        )}
                    </div>

                    {stored ? (
                        <div className="relative h-[min(55vh,32rem)] w-full overflow-hidden rounded-lg border bg-muted/30">
                            <MediaPreviewContent mode="dialog" src={src} mime={item.mimeType} filename={item.fileName} flagged={isHeldModerationStatus(item.status)} className="h-full w-full" />
                        </div>
                    ) : (
                        <p className="rounded-lg border bg-muted p-4 text-center text-sm text-muted-foreground">{text("notStored")}</p>
                    )}

                    <SheetGroup title={text("groups.upload")} collapsible={false}>
                        <SheetGrid columns={2}>
                            {card(text("company"), IconBuilding, item.company.name)}
                            {card(text("uploadedBy"), IconUser, item.uploadedBy?.name)}
                            {card(text("uploadedAt"), IconCalendar, item.uploadedAt, "dateTime")}
                            {stored && card(text("record"), IconLink, text(item.inUse ? "inUse.yes" : "inUse.no"))}
                        </SheetGrid>
                    </SheetGroup>

                    {item.scores && (
                        <SheetGroup title={text("groups.contentCheck")} collapsible={false}>
                            <SheetGrid columns={3}>
                                {SCORE_NAMES.map((name) => (
                                    <DisplayCard key={name} show title={text(`scores.${name}`)} tooltip={text(`scoreHints.${name}`)} Icon={IconEye} value={percent(item.scores?.[name])} />
                                ))}
                                {card(text("checkedAt"), IconCalendar, item.checkedAt, "dateTime")}
                            </SheetGrid>
                        </SheetGroup>
                    )}

                    <SheetGroup title={text("groups.file")} collapsible={false}>
                        <SheetGrid columns={2}>
                            {card(text("fileName"), IconFile, item.fileName)}
                            {card(text("fileType"), IconFileDescription, item.fileType ? text(`fileTypes.${item.fileType}`) : undefined)}
                            {card(text("fileSize"), IconFile, item.fileSize !== undefined ? formatFileSize(item.fileSize) : undefined)}
                            {card(text("mimeType"), IconFileDescription, item.mimeType)}
                            {stored && card(text("visibility"), IconWorld, text(item.isPublic ? "public" : "private"))}
                            {card(text("refusedAs"), IconTrash, item.refusalCode ? text(`refusalCodes.${item.refusalCode}`) : undefined)}
                            {card(text("route"), IconRoute, item.route)}
                            {card(text("fingerprint"), IconFingerprint, item.fileHash)}
                        </SheetGrid>
                    </SheetGroup>

                    {item.reviewedBy?.name && (
                        <SheetGroup title={text("groups.review")} collapsible={false} accent="neutral">
                            <SheetGrid columns={2}>
                                {card(text("reviewedBy"), IconUserCheck, item.reviewedBy.name)}
                                {card(text("reviewedAt"), IconCalendar, item.reviewedAt, "dateTime")}
                            </SheetGrid>
                        </SheetGroup>
                    )}
                </div>
            </SheetContent>
            {decision && (
                <UploadReviewDecisionDialog
                    open
                    onOpenChange={(next) => { if (!next) setDecision(null); }}
                    item={item}
                    decision={decision}
                    onDone={(decided) => {
                        if (decided) setItem(decided);
                        onDecided();
                    }}
                />
            )}
        </Sheet>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/uploadReview/uploadReviewSheet.tsx"),
)(UploadReviewSheet);
