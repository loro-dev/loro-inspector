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
    const [currentChange, setCurrentChange] = useState<Change | null>(null);
    const [currentLamport, setCurrentLamport] = useState<number>(0);
    const changeIndexToChangeRef = useRef<{ c: Change, pos: number }[]>([]);
    const lengthRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const actualCheckout = useCallback(debounce(300, (frontiers: Frontiers) => {
        loroDoc.checkout(frontiers);
    }), [loroDoc]);

    // Function to actually perform the checkout
    const performCheckout = useCallback((checkoutPos: number) => {
        if (checkoutPos === -1) {
            return;
        }

        if (checkoutPos === 0) {
            actualCheckout([]);
            const frontiers: Frontiers = [];
            setCurrentFrontiers(frontiers);
            setCurrentChange(null);
            setCurrentLamport(0);
            onNewFrontiers(frontiers);
            return;
        }

        if (checkoutPos === lengthRef.current - 1) {
            const frontiers = loroDoc.oplogFrontiers();
            if (frontiers.length > 0) {
                actualCheckout(frontiers);
                setCurrentFrontiers(frontiers);
                const c = loroDoc.getChangeAt(frontiers[0]);
                setCurrentChange(c);
                setCurrentLamport(c.lamport + c.length - 1);
                onNewFrontiers(frontiers);
            } else {
                actualCheckout([]);
                const frontiers: Frontiers = [];
                setCurrentFrontiers(frontiers);
                setCurrentChange(null);
                setCurrentLamport(0);
                onNewFrontiers(frontiers);
            }
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
            actualCheckout(frontiers);
            const docFrontiers = frontiers;
            setCurrentFrontiers(docFrontiers);
            setCurrentChange(loroDoc.getChangeAt(frontiers[0]));
            setCurrentLamport(targetChange.c.lamport + checkoutPos - targetChange.pos);
            onNewFrontiers(docFrontiers);
        }
    }, [loroDoc, onNewFrontiers, actualCheckout]);

    useEffect(() => {
        // Basic setup
        const vv = loroDoc.oplogVersion().toJSON();
        const length = 2 + Array.from(vv.values()).reduce((a, b) => a + b, 0)
        lengthRef.current = length;
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
            if (frontiersEq(loroDoc.oplogFrontiers(), loroDoc.frontiers())) {
                setPos(lengthRef.current - 1);
            } else {
                const frontiers = loroDoc.frontiers();
                if (frontiers.length === 0) {
                    setPos(0);
                } else if (frontiers.length > 1) {
                    setPos(lengthRef.current - 1);
                } else {
                    // Find the position by going through all the changes
                    const frontier = frontiers[0];
                    const changes = changeIndexToChangeRef.current;
                    let foundPos = 0;

                    for (let i = 0; i < changes.length; i++) {
                        const change = changes[i];
                        const { c } = change;

                        // Check if this change contains the frontier
                        if (c.peer === frontier.peer &&
                            c.counter <= frontier.counter &&
                            c.counter + c.length > frontier.counter) {
                            // Calculate the exact position within the change
                            const offset = frontier.counter - c.counter;
                            foundPos = change.pos + offset;
                            break;
                        }
                    }

                    setPos(foundPos);
                }
            }

            return;
        }

        // If dragging, use debounced checkout to prevent excessive updates
        if (isDragging) {
            performCheckout(pos);
        } else {
            // For button clicks or direct jumps, perform checkout immediately
            performCheckout(pos);
        }
    }, [pos, isDragging, performCheckout, loroDoc]);

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
        <div className="w-full space-y-4 p-6 rounded-lg shadow-lg border border-slate-700/50 backdrop-blur-sm mb-8 mt-4">
            <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-slate-400 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${pos === 0 ? 'bg-indigo-400' : 'bg-slate-600'}`}></div>
                    <span>Empty Version</span>
                </div>
                <div className="text-sm font-medium text-slate-400 flex items-center space-x-2">
                    <span>Latest Version</span>
                    <div className={`w-2 h-2 rounded-full ${pos === totalLength - 1 ? 'bg-indigo-400' : 'bg-slate-600'}`}></div>
                </div>
            </div>

            <div className="relative">
                {/* Ticker marks */}
                <div className="absolute w-full flex justify-between px-1 top-0">
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} className="w-px h-1 bg-slate-600"></div>
                    ))}
                </div>

                <div className="px-1 py-6">
                    <Slider
                        value={[pos]}
                        min={0}
                        max={totalLength > 0 ? totalLength - 1 : 0}
                        step={1}
                        onValueChange={(value) => setPos(value[0])}
                        onValueCommit={() => setIsDragging(false)}
                        onPointerDown={() => setIsDragging(true)}
                        className="py-1"
                    />
                </div>
            </div>

            <div className="text-center text-base font-medium text-indigo-100">
                {positionLabel}
            </div>

            <div className="flex justify-center space-x-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={jumpToStart}
                    disabled={pos === 0}
                    className="bg-slate-800/80 border-slate-600 hover:bg-slate-700 text-slate-200"
                >
                    <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={stepBack}
                    disabled={pos === 0}
                    className="bg-slate-800/80 border-slate-600 hover:bg-slate-700 text-slate-200"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={stepForward}
                    disabled={pos === totalLength - 1}
                    className="bg-slate-800/80 border-slate-600 hover:bg-slate-700 text-slate-200"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={jumpToEnd}
                    disabled={pos === totalLength - 1}
                    className="bg-slate-800/80 border-slate-600 hover:bg-slate-700 text-slate-200"
                >
                    <SkipForward className="h-4 w-4" />
                </Button>
            </div>

            {/* Frontiers display */}
            <div className="mt-4 p-4 bg-slate-800 border border-slate-700/50 rounded-md text-xs font-mono overflow-auto">
                <div className="text-indigo-400 mb-2 font-semibold uppercase tracking-wider text-xs">Current Frontiers:</div>
                <div className="text-slate-300">
                    {formatFrontiers(currentFrontiers)}
                </div>
                {currentChange && (
                    <>
                        <div className="text-indigo-400 mt-3 mb-2 font-semibold uppercase tracking-wider text-xs">Info:</div>
                        <div className="text-slate-300 grid gap-1">
                            <div>Timestamp: {new Date(currentChange.timestamp * 1000).toLocaleString()}</div>
                            <div>Lamport: {currentLamport}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function frontiersEq(a: Frontiers, b: Frontiers): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i].peer !== b[i].peer || a[i].counter !== b[i].counter) {
            return false;
        }
    }

    return true;
}
