"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Square,
  Circle,
  Type,
  Undo,
  Redo,
  Save,
  Share,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Download
} from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  id: string;
  type: "pen" | "rectangle" | "circle" | "text";
  points?: Point[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  timestamp: number;
}

interface BlueprintViewerProps {
  blueprintUrl: string;
  initialMarkups?: string;
  onSaveMarkup?: (markupData: string) => Promise<void>;
  className?: string;
}

export function BlueprintViewer({
  blueprintUrl,
  initialMarkups = "[]",
  onSaveMarkup,
  className,
}: BlueprintViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<"pen" | "rectangle" | "circle" | "text">("pen");
  const [currentColor, setCurrentColor] = useState("#238636");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [markupName, setMarkupName] = useState("");
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 });

  // Load initial markups
  useEffect(() => {
    try {
      const markups = JSON.parse(initialMarkups);
      if (Array.isArray(markups)) {
        setElements(markups);
        setHistory([markups]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error("Error parsing initial markups:", error);
    }
  }, [initialMarkups]);

  // Draw elements on canvas
  const drawElements = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw blueprint image
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);
    ctx.drawImage(image, 0, 0, canvas.width / zoom, canvas.height / zoom);

    // Draw all elements
    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (element.type) {
        case "pen":
          if (element.points && element.points.length > 1) {
            const firstPoint = element.points[0];
            if (firstPoint) {
              ctx.beginPath();
              ctx.moveTo(firstPoint.x, firstPoint.y);
              element.points.forEach(point => {
                ctx.lineTo(point.x, point.y);
              });
              ctx.stroke();
            }
          }
          break;

        case "rectangle":
          if (element.startX !== undefined && element.startY !== undefined &&
              element.endX !== undefined && element.endY !== undefined) {
            const width = element.endX - element.startX;
            const height = element.endY - element.startY;
            ctx.strokeRect(element.startX, element.startY, width, height);
          }
          break;

        case "circle":
          if (element.startX !== undefined && element.startY !== undefined &&
              element.endX !== undefined && element.endY !== undefined) {
            const centerX = element.startX;
            const centerY = element.startY;
            const radius = Math.sqrt(
              Math.pow(element.endX - element.startX, 2) +
              Math.pow(element.endY - element.startY, 2)
            );
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;

        case "text":
          if (element.text && element.startX !== undefined && element.startY !== undefined) {
            ctx.fillStyle = element.color;
            ctx.font = `${element.strokeWidth * 6}px "Space Mono", monospace`;
            ctx.fillText(element.text, element.startX, element.startY);
          }
          break;
      }
    });

    ctx.restore();
  }, [elements, zoom, pan]);

  // Redraw when elements or viewport changes
  useEffect(() => {
    drawElements();
  }, [drawElements]);

  // Convert screen coordinates to canvas coordinates
  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x * zoom) / zoom;
    const y = (clientY - rect.top - pan.y * zoom) / zoom;
    return { x, y };
  }, [zoom, pan]);

  // Handle mouse/touch start
  const handlePointerStart = useCallback((e: React.PointerEvent) => {
    if (currentTool === "text") {
      const point = getCanvasPoint(e.clientX, e.clientY);
      setTextPosition(point);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    const point = getCanvasPoint(e.clientX, e.clientY);

    const newElement: DrawingElement = {
      id: `${Date.now()}-${Math.random()}`,
      type: currentTool,
      color: currentColor,
      strokeWidth,
      timestamp: Date.now(),
    };

    if (currentTool === "pen") {
      newElement.points = [point];
    } else {
      newElement.startX = point.x;
      newElement.startY = point.y;
      newElement.endX = point.x;
      newElement.endY = point.y;
    }

    setCurrentElement(newElement);
  }, [currentTool, currentColor, strokeWidth, getCanvasPoint]);

  // Handle mouse/touch move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !currentElement) return;

    const point = getCanvasPoint(e.clientX, e.clientY);

    if (currentTool === "pen") {
      setCurrentElement(prev => prev ? {
        ...prev,
        points: [...(prev.points || []), point]
      } : null);
    } else {
      setCurrentElement(prev => prev ? {
        ...prev,
        endX: point.x,
        endY: point.y,
      } : null);
    }
  }, [isDrawing, currentElement, currentTool, getCanvasPoint]);

  // Handle mouse/touch end
  const handlePointerEnd = useCallback(() => {
    if (!isDrawing || !currentElement) return;

    setIsDrawing(false);

    // Add element to history
    const newElements = [...elements, currentElement];
    setElements(newElements);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setCurrentElement(null);
  }, [isDrawing, currentElement, elements, history, historyIndex]);

  // Handle text input
  const handleAddText = useCallback(() => {
    if (!textInput.trim()) {
      setShowTextInput(false);
      return;
    }

    const textElement: DrawingElement = {
      id: `${Date.now()}-${Math.random()}`,
      type: "text",
      text: textInput,
      startX: textPosition.x,
      startY: textPosition.y,
      color: currentColor,
      strokeWidth,
      timestamp: Date.now(),
    };

    const newElements = [...elements, textElement];
    setElements(newElements);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTextInput("");
    setShowTextInput(false);
  }, [textInput, textPosition, currentColor, strokeWidth, elements, history, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousState = history[historyIndex - 1];
      if (previousState) {
        setElements(previousState);
      }
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      if (nextState) {
        setElements(nextState);
      }
    }
  }, [history, historyIndex]);

  // Clear all markups
  const clearAll = useCallback(() => {
    setElements([]);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Save markup
  const saveMarkup = useCallback(async () => {
    if (!onSaveMarkup || !markupName.trim()) return;

    try {
      const markupData = JSON.stringify(elements);
      await onSaveMarkup(markupData);
      setShowSaveDialog(false);
      setMarkupName("");
    } catch (error) {
      console.error("Error saving markup:", error);
    }
  }, [elements, markupName, onSaveMarkup]);

  // Tool button component
  const ToolButton = ({
    tool,
    icon: Icon,
    label
  }: {
    tool: typeof currentTool;
    icon: any;
    label: string;
  }) => (
    <Button
      variant={currentTool === tool ? "default" : "outline"}
      size="icon"
      onClick={() => setCurrentTool(tool)}
      className="touch-manipulation min-w-[40px] h-10"
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("relative w-full h-full bg-surface", className)}>
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background border-b border-border p-ds-2 md:p-ds-3">
        <div className="flex flex-col gap-ds-2 md:flex-row md:items-center md:justify-between">
          {/* Drawing Tools */}
          <div className="flex items-center gap-ds-1 flex-wrap">
            <ToolButton tool="pen" icon={Pencil} label="Draw" />
            <ToolButton tool="rectangle" icon={Square} label="Rectangle" />
            <ToolButton tool="circle" icon={Circle} label="Circle" />
            <ToolButton tool="text" icon={Type} label="Text" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-ds-1 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="touch-manipulation"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="touch-manipulation"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={clearAll}
              className="touch-manipulation"
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tool Settings */}
        <div className="flex flex-col gap-ds-2 mt-ds-2 md:flex-row md:items-center">
          <div className="flex items-center gap-ds-1">
            <Label className="text-sm font-body">Color:</Label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-8 h-8 rounded border border-input bg-background"
            />
          </div>
          <div className="flex items-center gap-ds-1">
            <Label className="text-sm font-body">Size:</Label>
            <Input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20 h-8"
            />
          </div>
          <div className="flex items-center gap-ds-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="touch-manipulation"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-body min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="touch-manipulation"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="touch-manipulation"
              title="Reset view"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-ds-1 md:ml-auto">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button className="touch-manipulation">
                  <Save className="h-4 w-4 mr-ds-1" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Markup</DialogTitle>
                </DialogHeader>
                <div className="space-y-ds-2">
                  <div>
                    <Label htmlFor="markup-name">Markup Name</Label>
                    <Input
                      id="markup-name"
                      value={markupName}
                      onChange={(e) => setMarkupName(e.target.value)}
                      placeholder="Enter markup name..."
                    />
                  </div>
                  <div className="flex justify-end gap-ds-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveMarkup}
                      disabled={!markupName.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="absolute inset-0 pt-[140px] md:pt-[100px] overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            ref={imageRef}
            src={blueprintUrl}
            alt="Blueprint"
            fill
            className="object-contain"
            onLoad={() => {
              const canvas = canvasRef.current;
              const image = imageRef.current;
              if (canvas && image) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                drawElements();
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onPointerDown={handlePointerStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            style={{ touchAction: "none" }}
          />
        </div>
      </div>

      {/* Text Input Overlay */}
      {showTextInput && (
        <div
          className="absolute z-20 bg-background border border-border rounded p-ds-2 shadow-lg max-w-xs"
          style={{
            left: Math.min(textPosition.x * zoom + pan.x * zoom, window.innerWidth - 200),
            top: textPosition.y * zoom + pan.y * zoom + (window.innerWidth < 768 ? 140 : 100),
          }}
        >
          <div className="flex items-center gap-ds-1">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddText();
                } else if (e.key === "Escape") {
                  setShowTextInput(false);
                  setTextInput("");
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleAddText}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowTextInput(false);
                setTextInput("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}