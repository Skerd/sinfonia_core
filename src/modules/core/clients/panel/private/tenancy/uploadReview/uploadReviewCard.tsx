import {useReducer, useState} from "react";
import {compose} from "redux";
import {IconBuilding, IconCalendar, IconCheck, IconFileOff, IconGauge, IconListDetails, IconMaximize, IconTrash, IconUser, IconUserCheck} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {TextBadge} from "@coreModule/components/entityPage/list/table/tableCellPrimitives.tsx";
import {toneClass} from "@coreModule/components/entityPage/list/table/columnConfigToColumnDef.tsx";
import MediaPreviewContent from "@coreModule/components/viewEngine/widgets/media/mediaPreviewContent.tsx";
import {isHeldModerationStatus, wasShownThisVisit} from "@coreModule/components/viewEngine/widgets/media/flaggedMedia.tsx";
import UploadReviewDecisionDialog from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewDecisionDialog.tsx";
import type {EnumTone} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import type {UploadReviewItem} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

export const UPLOAD_REVIEW_STATUS_TONES: Record<UploadReviewItem["status"], EnumTone> = {
    flagged: "warning",
    rejected: "danger",
    approved: "success",
    refused: "danger",
    passed: "neutral",
    not_checked: "neutral",
};

/** The file's highest explicit score, as a percentage. */
function nudityScore(item: UploadReviewItem): string | undefined {
    if (!item.scores) return undefined;
    return `${Math.round(Math.max(item.scores.porn, item.scores.hentai) * 100)}%`;
}

type UploadReviewCardProps = WithLanguageType & {
    item: UploadReviewItem;
    /** After a decision: the lists and their counts change. */
    onDecided: () => void;
    /** Opens the file's sheet, with everything the review knows about it. */
    onOpenDetails: () => void;
};

/**
 * One file of the upload review: what it is, whose, the nudity score, and the decisions it can still take. A stored
 * file shows under the cover until the reviewer chooses to see it; a refused upload was never stored.
 */
function UploadReviewCard({item, onDecided, onOpenDetails, resolveLanguageKey}: UploadReviewCardProps) {
    const [decision, setDecision] = useState<"approve" | "remove" | null>(null);
    const [enlarged, setEnlarged] = useState(false);
    const src = `/api/auxiliary/media/review/${item._id}`;
    const held = isHeldModerationStatus(item.status);
    // Showing a flagged file changes only the shared "shown this visit" memory, so the card redraws by hand.
    const [, redraw] = useReducer((count: number) => count + 1, 0);
    const covered = held && !wasShownThisVisit(src);
    const canApprove = item.kind === "media" && (item.status === "flagged" || item.status === "rejected");
    const canRemove = item.kind === "media" && (item.status === "flagged" || item.status === "approved");

    return (
        <Card className="gap-3 py-3">
            <CardHeader className="px-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="min-w-0 text-sm">
                        <Button variant="bare" type="button" className="block max-w-full truncate text-start hover:underline" title={item.fileName} onClick={onOpenDetails}>
                            {item.fileName}
                        </Button>
                    </CardTitle>
                    <TextBadge label={resolveLanguageKey(`status.${item.status}`)} className={toneClass(UPLOAD_REVIEW_STATUS_TONES[item.status])} />
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-3">
                {item.kind === "media" && covered ? (
                    // Under the cover its own Show reveals the file in place; a button around it would nest buttons.
                    <div className="relative aspect-video overflow-hidden rounded-md border">
                        <MediaPreviewContent mode="thumb" src={src} mime={item.mimeType} filename={item.fileName} flagged={held} onFlaggedShown={redraw} />
                    </div>
                ) : item.kind === "media" ? (
                    <Button
                        variant="bare"
                        type="button"
                        className="relative block aspect-video w-full cursor-zoom-in overflow-hidden rounded-md border"
                        aria-label={`${resolveLanguageKey("view")}: ${item.fileName}`}
                        onClick={() => setEnlarged(true)}
                    >
                        <MediaPreviewContent mode="thumb" src={src} mime={item.mimeType} filename={item.fileName} flagged={held} />
                    </Button>
                ) : (
                    <div
                        className="flex aspect-video flex-col items-center justify-center gap-1 rounded-md border bg-muted p-3 text-center text-xs text-muted-foreground"
                        title={item.fileHash ? `SHA-256 ${item.fileHash}` : undefined}
                    >
                        <IconFileOff className="size-5" aria-hidden />
                        {resolveLanguageKey("notStored")}
                    </div>
                )}
                {/* Who → when → how much (UX-02); once decided, who decided replaces when it was uploaded. */}
                <InfoRowGroup>
                    <EntityCardRow show icon={IconBuilding} label={resolveLanguageKey("company")} value={item.company.name} />
                    <EntityCardRow show={!!item.uploadedBy?.name} icon={IconUser} label={resolveLanguageKey("uploadedBy")} value={item.uploadedBy?.name} />
                    {item.reviewedBy?.name ? (
                        <EntityCardRow show icon={IconUserCheck} label={resolveLanguageKey("reviewedBy")} value={item.reviewedBy.name} />
                    ) : (
                        <EntityCardRow show icon={IconCalendar} label={resolveLanguageKey("uploadedAt")} value={item.uploadedAt} type="dateTime" />
                    )}
                    <EntityCardRow show={!!item.scores} icon={IconGauge} label={resolveLanguageKey("score")} value={nudityScore(item)} />
                </InfoRowGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 px-3">
                <Button type="button" variant="outline" size="sm" onClick={onOpenDetails}>
                    <IconListDetails /> {resolveLanguageKey("details")}
                </Button>
                {item.kind === "media" && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setEnlarged(true)}>
                        <IconMaximize /> {resolveLanguageKey("view")}
                    </Button>
                )}
                    {canApprove && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setDecision("approve")}>
                            <IconCheck /> {resolveLanguageKey("approve")}
                        </Button>
                    )}
                {canRemove && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => setDecision("remove")}>
                        <IconTrash /> {resolveLanguageKey("remove")}
                    </Button>
                )}
            </CardFooter>

            {item.kind === "media" && (
                <Dialog open={enlarged} onOpenChange={setEnlarged}>
                    {/* As large as the gallery's viewer: a reviewer judges the file, so it fills the screen. */}
                    <DialogContent
                        className="w-[min(96vw,80rem)] max-w-[min(96vw,80rem)] p-2 sm:max-w-[min(96vw,80rem)]"
                        aria-describedby={undefined}
                    >
                        <DialogTitle className="sr-only">{item.fileName}</DialogTitle>
                        <div className="flex h-[min(85vh,56rem)] w-full items-center justify-center">
                            <MediaPreviewContent mode="dialog" src={src} mime={item.mimeType} filename={item.fileName} flagged={held} className="h-full w-full" onFlaggedShown={redraw} />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            {decision && (
                <UploadReviewDecisionDialog
                    open
                    onOpenChange={(open) => { if (!open) setDecision(null); }}
                    item={item}
                    decision={decision}
                    onDone={onDecided}
                />
            )}
        </Card>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/uploadReview/uploadReviewCard.tsx"),
)(UploadReviewCard);
