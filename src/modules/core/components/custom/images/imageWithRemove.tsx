import {X, Eye} from "lucide-react";
import {useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";

type ImageWithRemoveProps = {
    src: string;
    alt: string;
    onRemove: () => void;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
    aspectSquare?: boolean;
}

export function ImageWithRemove({
    src,
    alt,
    onRemove,
    disabled = false,
    className,
    size = "md",
    aspectSquare = false
}: ImageWithRemoveProps) {
    const [open, setOpen] = useState(false);
    const sizeClasses = {
        sm: "w-32 h-32",
        md: "w-40 h-40",
        lg: "w-48 h-48"
    };

    return (
        <>
            <div className={cn("relative group", className)}>
                <div className={cn(
                    "relative rounded-lg overflow-hidden border-2 border-border",
                    aspectSquare ? "w-full aspect-square" : sizeClasses[size]
                )}>
                    <img 
                        src={src} 
                        alt={alt} 
                        className="w-full h-full object-cover"
                    />
                    {/* Remove overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setOpen(true)}
                            disabled={disabled}
                        >
                            <Eye className="h-5 w-5" />
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10"
                            onClick={onRemove}
                            disabled={disabled}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dialog for larger image view */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="min-w-3xl p-2">
                    <div className="flex items-center justify-center">
                        <img 
                            src={src} 
                            alt={alt} 
                            className="max-h-[85vh] max-w-full object-contain rounded-lg"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

