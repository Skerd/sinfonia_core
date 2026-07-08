import { Input } from "@coreModule/components/ui/input.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import {
    Dispatch,
    SetStateAction,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState, HTMLAttributes, KeyboardEvent
} from "react";
import {
    useDropzone,
    DropzoneState,
    FileRejection,
    DropzoneOptions,
} from "react-dropzone";
import { toast } from "sonner";
import { Trash2 as RemoveIcon } from "lucide-react";
import { buttonVariants } from "@coreModule/components/ui/button.tsx";

type DirectionOptions = "rtl" | "ltr" | undefined;

type FileUploaderContextType = {
    dropzoneState: DropzoneState;
    isLOF: boolean;
    isFileTooBig: boolean;
    removeFileFromSet: (index: number) => void;
    activeIndex: number;
    setActiveIndex: Dispatch<SetStateAction<number>>;
    orientation: "horizontal" | "vertical";
    direction: DirectionOptions;
};

const FileUploaderContext = createContext<FileUploaderContextType | null>(null);

export const useFileUpload = () => {
    const context = useContext(FileUploaderContext);
    if (!context) {
        throw new Error("useFileUpload must be used within a FileUploaderProvider");
    }
    return context;
};

type FileUploaderProps = {
    value: File[] | null;
    reSelect?: boolean;
    onValueChange: (value: File[] | null) => void;
    dropzoneOptions: DropzoneOptions;
    orientation?: "horizontal" | "vertical";
};

/**
 * File upload Docs: {@link: https://localhost:3000/docs/file-upload}
 */

export const FileUploader = forwardRef<
    HTMLDivElement,
    FileUploaderProps & HTMLAttributes<HTMLDivElement>
>(
    (
        {
            className,
            dropzoneOptions,
            value,
            onValueChange,
            reSelect = false,
            orientation = "vertical",
            children,
            dir,
            ...props
        },
        ref,
    ) => {
        const [isFileTooBig, setIsFileTooBig] = useState(false);
        const [isLOF, setIsLOF] = useState(false);
        const [activeIndex, setActiveIndex] = useState(-1);
        const {
            accept = {
                "image/*": [".jpg", ".jpeg", ".png", ".gif"],
            },
            maxFiles = 0,
            maxSize = 4 * 1024 * 1024,
            multiple = true,
        } = dropzoneOptions;

        const reSelectAll = maxFiles === 1 ? true : reSelect;
        const direction: DirectionOptions = dir === "rtl" ? "rtl" : "ltr";

        const removeFileFromSet = useCallback(
            (i: number) => {
                if (!value) return;
                const newFiles = value.filter((_, index) => index !== i);
                onValueChange(newFiles);
            },
            [value, onValueChange],
        );

        const onDrop = useCallback(
            (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
                const newValues: File[] = reSelectAll ? [] : value ? [...value] : [];

                const limit = maxFiles > 0 ? maxFiles : Infinity;
                for (const file of acceptedFiles) {
                    if (newValues.length < limit) newValues.push(file);
                }

                onValueChange(newValues);

                if (rejectedFiles.length > 0) {
                    const first = rejectedFiles[0];
                    const err = first.errors[0];
                    const message =
                        err?.code === "file-too-large"
                            ? `File is too large. Max size is ${maxSize / 1024 / 1024}MB`
                            : err?.message ?? "File rejected";
                    toast.error(message);
                }
            },
            [reSelectAll, value, maxFiles, maxSize, onValueChange],
        );

        useEffect(() => {
            if (!value) return;
            if (value.length === maxFiles && maxFiles > 0 && multiple) {
                setIsLOF(true);
                return;
            }
            setIsLOF(false);
        }, [value, maxFiles, multiple]);

        useEffect(() => {
            if (!value || value.length === 0) {
                setActiveIndex(-1);
            } else {
                setActiveIndex((prev) =>
                    prev >= value.length ? value.length - 1 : prev,
                );
            }
        }, [value]);

        const dropzoneState = useDropzone({
            accept,
            maxFiles,
            maxSize,
            multiple,
            ...dropzoneOptions,
            onDrop,
            onDropRejected: () => setIsFileTooBig(true),
            onDropAccepted: () => setIsFileTooBig(false),
        });

        const handleKeyDown = useCallback(
            (e: KeyboardEvent<HTMLDivElement>) => {
                e.preventDefault();
                e.stopPropagation();

                if (!value) return;

                const moveNext = () => {
                    const nextIndex = activeIndex + 1;
                    setActiveIndex(nextIndex > value.length - 1 ? 0 : nextIndex);
                };

                const movePrev = () => {
                    const nextIndex = activeIndex - 1;
                    setActiveIndex(nextIndex < 0 ? value.length - 1 : nextIndex);
                };

                const prevKey =
                    orientation === "horizontal"
                        ? direction === "ltr"
                            ? "ArrowLeft"
                            : "ArrowRight"
                        : "ArrowUp";

                const nextKey =
                    orientation === "horizontal"
                        ? direction === "ltr"
                            ? "ArrowRight"
                            : "ArrowLeft"
                        : "ArrowDown";

                if (e.key === nextKey) {
                    moveNext();
                } else if (e.key === prevKey) {
                    movePrev();
                } else if (e.key === "Enter" || e.key === " ") {
                    if (activeIndex === -1) {
                        dropzoneState.inputRef.current?.click();
                    }
                } else if (e.key === "Delete" || e.key === "Backspace") {
                    if (activeIndex !== -1) {
                        removeFileFromSet(activeIndex);
                        if (value.length - 1 === 0) {
                            setActiveIndex(-1);
                            return;
                        }
                        movePrev();
                    }
                } else if (e.key === "Escape") {
                    setActiveIndex(-1);
                }
            },
            [value, activeIndex, removeFileFromSet, dropzoneState, orientation, direction],
        );

        return (
            <FileUploaderContext.Provider
                value={{
                    dropzoneState,
                    isLOF,
                    isFileTooBig,
                    removeFileFromSet,
                    activeIndex,
                    setActiveIndex,
                    orientation,
                    direction,
                }}
            >
                <div
                    ref={ref}
                    role="group"
                    tabIndex={0}
                    aria-label="File upload"
                    onKeyDownCapture={handleKeyDown}
                    className={cn(
                        "grid w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
                        className,
                        { "gap-2": value && value.length > 0 },
                    )}
                    dir={dir}
                    {...props}
                >
                    {children}
                </div>
            </FileUploaderContext.Provider>
        );
    },
);

FileUploader.displayName = "FileUploader";

export const FileUploaderContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
    const { orientation } = useFileUpload();
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className={cn("w-full px-1")}
            ref={containerRef}
            aria-description="content file holder"
        >
            <div
                {...props}
                ref={ref}
                className={cn(
                    "flex rounded-xl gap-1",
                    orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
});

FileUploaderContent.displayName = "FileUploaderContent";

export const FileUploaderItem = forwardRef<
    HTMLDivElement,
    { index: number } & HTMLAttributes<HTMLDivElement>
>(({ className, index, children, ...props }, ref) => {
    const { removeFileFromSet, activeIndex, direction } = useFileUpload();
    const isSelected = index === activeIndex;
    return (
        <div
            ref={ref}
            className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-6 p-1 justify-between cursor-pointer relative",
                className,
                isSelected ? "bg-muted" : "",
            )}
            {...props}
        >
            <div className="font-medium leading-none tracking-tight flex items-center gap-1.5 h-full w-full">
                {children}
            </div>
            <button
                type="button"
                className={cn(
                    "absolute",
                    direction === "rtl" ? "top-1 left-1" : "top-1 right-1",
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    removeFileFromSet(index);
                }}
            >
                <span className="sr-only">remove item {index}</span>
                <RemoveIcon className="w-4 h-4 hover:stroke-destructive duration-200 ease-in-out" />
            </button>
        </div>
    );
});

FileUploaderItem.displayName = "FileUploaderItem";

export const FileInput = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { dropzoneState, isFileTooBig, isLOF } = useFileUpload();
    const rootProps = isLOF ? {} : dropzoneState.getRootProps();
    return (
        <div
            ref={ref}
            {...props}
            role={isLOF ? "presentation" : undefined}
            aria-disabled={isLOF ? true : undefined}
            className={cn(
                "relative w-full",
                isLOF ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            )}
        >
            <div
                className={cn(
                    "w-full rounded-lg duration-300 ease-in-out border",
                    dropzoneState.isDragAccept
                        ? "border-green-500"
                        : dropzoneState.isDragReject || isFileTooBig
                            ? "border-red-500"
                            : "border-gray-300",
                    className,
                )}
                {...rootProps}
            >
                {children}
            </div>
            <Input
                ref={dropzoneState.inputRef}
                disabled={isLOF}
                {...dropzoneState.getInputProps()}
                className={cn(isLOF && "cursor-not-allowed")}
            />
        </div>
    );
});

FileInput.displayName = "FileInput";