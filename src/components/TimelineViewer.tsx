import { Change, Frontiers, LoroDoc } from "loro-crdt";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "./ui/slider";
import { debounce } from "throttle-debounce";

// - if pos = 0, empty version
// - if pos == length - 1, latest version
// - otherwise, it points to a frontiers with a certain op id
export function TimelineViewer(
    { onLengthChange, loroDoc, onNewFrontiers }:
        { onLengthChange: (length: number) => void; loroDoc: LoroDoc; onNewFrontiers: (frontiers: Frontiers) => void },
) {
    const [pos, setPos] = useState(-1);
    const [totalLength, setTotalLength] = useState(0);
    const [currentFrontiers, setCurrentFrontiers] = useState<Frontiers>([]);
    const changeIndexToChangeRef = useRef<{ c: Change, pos: number }[]>([]);
    const lengthRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    // Create a debounced checkout function
    const debouncedCheckoutRef = useRef<(newPos: number) => void>();


    // Function to actually perform the checkout
    const performCheckout = useCallback((checkoutPos: number) => {
        if (checkoutPos === -1) {
            return;
        }

        if (checkoutPos === 0) {
            loroDoc.checkout([]);
            const frontiers = loroDoc.frontiers();
            setCurrentFrontiers(frontiers);
            onNewFrontiers(frontiers);
            return;
        }

        if (checkoutPos === lengthRef.current - 1) {
            loroDoc.checkout(loroDoc.oplogFrontiers());
            const frontiers = loroDoc.frontiers();
            setCurrentFrontiers(frontiers);
            onNewFrontiers(frontiers);
            return;
        }

        const changeIndexToChange = changeIndexToChangeRef.current;
        // Binary search to find the change with the target position
        let left = 0;
        let right = changeIndexToChange.length - 1;
        let targetChange: null | { c: Change, pos: number } = null;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const current = changeIndexToChange[mid];

            // Check if checkoutPos is within this change's range
            if (checkoutPos >= current.pos && checkoutPos < current.pos + current.c.length) {
                targetChange = current;
                break;
            }

            // Adjust search boundaries
            if (checkoutPos < current.pos) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        if (targetChange) {
            // Calculate the frontiers for this position
            const counter = checkoutPos - targetChange.pos + targetChange.c.counter;
            const frontiers: Frontiers = [{ peer: targetChange.c.peer, counter }];
            loroDoc.checkout(frontiers);
            const docFrontiers = loroDoc.frontiers();
            setCurrentFrontiers(docFrontiers);
            onNewFrontiers(docFrontiers);
        }
    }, [loroDoc, onNewFrontiers]);

    useEffect(() => {
        debouncedCheckoutRef.current = debounce(300, (newPos: number) => {
            performCheckout(newPos);
        });
    }, [performCheckout]);

    useEffect(() => {
        // Basic setup
        const vv = loroDoc.oplogVersion().toJSON();
        console.log({ vv })
        const length = 2 + Array.from(vv.values()).reduce((a, b) => a + b, 0)
        lengthRef.current = length;
        console.log({ length })
        setTotalLength(length);
        onLengthChange(length);
        const changes: Change[] = [];
        loroDoc.travelChangeAncestors(loroDoc.oplogFrontiers(), (change) => {
            changes.push(change);
            return true;
        });

        changes.reverse();
        const changeIndexToChange: { c: Change, pos: number }[] = [];
        let pos = 1;
        for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            changeIndexToChange.push({ c: change, pos });
            pos += change.length;
        }
        changeIndexToChangeRef.current = changeIndexToChange;

        // Set initial frontiers
        setCurrentFrontiers(loroDoc.frontiers());
    }, [onLengthChange, loroDoc]);

    // Handle position changes with debouncing for checkout
    useEffect(() => {
        // Checkout the document to the given version (inferred from pos)
        if (pos === -1) {
            setPos(lengthRef.current - 1);
            return;
        }

        // If dragging, use debounced checkout to prevent excessive updates
        if (isDragging) {
            debouncedCheckoutRef.current?.(pos);
        } else {
            // For button clicks or direct jumps, perform checkout immediately
            performCheckout(pos);
        }
    }, [pos, isDragging, performCheckout]);

    console.log({ pos, totalLength })

    // Position label based on the current position
    const positionLabel = pos === 0
        ? "Empty Version"
        : pos === totalLength - 1
            ? "Latest Version"
            : `Operation ${pos.toLocaleString()} of ${(totalLength - 1).toLocaleString()}`;

    // Step control functions
    const stepBack = () => {
        if (pos > 0) {
            setPos(pos - 1);
        }
    };

    const stepForward = () => {
        if (pos < totalLength - 1) {
            setPos(pos + 1);
        }
    };

    const jumpToStart = () => {
        setPos(0);
    };

    const jumpToEnd = () => {
        setPos(totalLength - 1);
    };

    // Format frontiers for display
    const formatFrontiers = (frontiers: Frontiers) => {
        if (frontiers.length === 0) return "Empty";

        return frontiers.map(f => `${f.counter}@${f.peer}`).join(", ");
    };

    return (
        <div className="w-full space-y-3 p-4 bg-slate-50 rounded-lg shadow-sm dark:bg-slate-900">
            <div className="flex justify-between text-sm text-slate-500">
                <span>Empty Version</span>
                <span>Latest Version</span>
            </div>
            <div className="px-1 py-4">
                <Slider
                    value={[pos]}
                    min={0}
                    max={totalLength > 0 ? totalLength - 1 : 0}
                    step={1}
                    onValueChange={(value) => setPos(value[0])}
                    onValueCommit={() => setIsDragging(false)}
                    onPointerDown={() => setIsDragging(true)}
                />
            </div>
            <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                {positionLabel}
            </div>
            <div className="flex justify-center space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={jumpToStart}
                    disabled={pos === 0}
                >
                    <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={stepBack}
                    disabled={pos === 0}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={stepForward}
                    disabled={pos === totalLength - 1}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={jumpToEnd}
                    disabled={pos === totalLength - 1}
                >
                    <SkipForward className="h-4 w-4" />
                </Button>
            </div>

            {/* Frontiers display */}
            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono overflow-auto">
                <div className="text-slate-500 mb-1 font-semibold">Current Frontiers:</div>
                <div className="text-slate-700 dark:text-slate-300">
                    {formatFrontiers(currentFrontiers)}
                </div>
            </div>
        </div>
    );
}
