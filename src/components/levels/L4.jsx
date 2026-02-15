"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../ui/use-toast";

const GRID_SIZE = 6;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Valid L-shaped knight moves
const KNIGHT_DELTAS = [
  { dx: 2, dy: 1 },
  { dx: 2, dy: -1 },
  { dx: -2, dy: 1 },
  { dx: -2, dy: -1 },
  { dx: 1, dy: 2 },
  { dx: 1, dy: -2 },
  { dx: -1, dy: 2 },
  { dx: -1, dy: -2 },
];

const isInBounds = (x, y) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

const isValidKnightMove = (from, to) => {
  return KNIGHT_DELTAS.some(
    (d) => from.x + d.dx === to.x && from.y + d.dy === to.y
  );
};

// Parse chess notation like "A1" -> { x: 0, y: 5 } (A=col0, 1=bottom row)
const parseNotation = (str) => {
  const cleaned = str.trim().toUpperCase();
  if (cleaned.length < 2) return null;
  const col = LETTERS.indexOf(cleaned[0]);
  const row = parseInt(cleaned.slice(1));
  if (col < 0 || isNaN(row) || row < 1 || row > GRID_SIZE) return null;
  return { x: col, y: GRID_SIZE - row };
};

// Convert { x, y } to notation like "A6"
const toNotation = (x, y) => `${LETTERS[x]}${GRID_SIZE - y}`;

const Level4 = ({ onComplete }) => {
  const [inputValue, setInputValue] = useState("");
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [knightPos, setKnightPos] = useState({ x: 0, y: 0 }); // A6 top-left
  const [visitedOrder, setVisitedOrder] = useState({ "0,0": 1 }); // maps "x,y" -> step number
  const [moveCount, setMoveCount] = useState(0);
  const [moveHistory, setMoveHistory] = useState([{ x: 0, y: 0 }]);
  const [isStuck, setIsStuck] = useState(false);
  const [message, setMessage] = useState("Visit every square on the board using the knight.");
  const { toast } = useToast();

  const totalSquares = GRID_SIZE * GRID_SIZE;
  const visitedCount = Object.keys(visitedOrder).length;

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Knight's Tour Complete! ♞",
        description: `You visited all ${totalSquares} squares in ${moveCount} moves!`,
        variant: "success",
      });
      setTimeout(() => {
        onComplete(4);
      }, 2000);
    }
  }, [isSuccess, onComplete, toast, totalSquares, moveCount]);

  // Check win condition
  useEffect(() => {
    if (visitedCount === totalSquares && !isSuccess) {
      setIsSuccess(true);
      setMessage("🎉 All squares visited! The lonely knight is no longer alone!");
    }
  }, [visitedCount, totalSquares, isSuccess]);

  // Check if stuck (no valid unvisited moves)
  useEffect(() => {
    if (visitedCount < totalSquares && !isSuccess) {
      const hasValidMove = KNIGHT_DELTAS.some((d) => {
        const nx = knightPos.x + d.dx;
        const ny = knightPos.y + d.dy;
        return isInBounds(nx, ny) && !visitedOrder[`${nx},${ny}`];
      });
      if (!hasValidMove && visitedCount > 0) {
        setIsStuck(true);
        setMessage("😔 No more valid moves! Use /undo or /reset to try again.");
      } else {
        setIsStuck(false);
      }
    }
  }, [knightPos, visitedOrder, visitedCount, totalSquares, isSuccess]);

  const validMoves = KNIGHT_DELTAS.map((d) => ({
    x: knightPos.x + d.dx,
    y: knightPos.y + d.dy,
  })).filter((m) => isInBounds(m.x, m.y) && !visitedOrder[`${m.x},${m.y}`]);

  const handleInputChange = (e) => setInputValue(e.target.value);
  const handleEnter = (e) => {
    if (e.key === "Enter") handleCommandSubmit();
  };

  const handleCommandSubmit = () => {
    const cmd = inputValue.trim().toLowerCase();

    const moveMatch = cmd.match(/^\/move\s+([a-f]\d)$/i);
    const resetMatch = cmd.match(/^\/reset$/i);
    const helpMatch = cmd.match(/^\/help$/i);
    const undoMatch = cmd.match(/^\/undo$/i);

    if (moveMatch) {
      const target = parseNotation(moveMatch[1]);
      if (!target) {
        toast({
          title: "Invalid Square",
          description: `Use format like /move A1 or /move C4 (columns A-${LETTERS[GRID_SIZE - 1]}, rows 1-${GRID_SIZE}).`,
          variant: "destructive",
        });
      } else if (!isValidKnightMove(knightPos, target)) {
        toast({
          title: "Invalid Move ❌",
          description: `A knight can't reach ${toNotation(target.x, target.y)} from ${toNotation(knightPos.x, knightPos.y)}. Knights move in an L-shape.`,
          variant: "destructive",
        });
      } else if (visitedOrder[`${target.x},${target.y}`]) {
        toast({
          title: "Already Visited",
          description: `${toNotation(target.x, target.y)} was visited on step ${visitedOrder[`${target.x},${target.y}`]}. Each square can only be visited once!`,
          variant: "destructive",
        });
      } else {
        const newCount = moveCount + 1;
        const newVisited = { ...visitedOrder, [`${target.x},${target.y}`]: newCount + 1 };
        setKnightPos(target);
        setMoveCount(newCount);
        setVisitedOrder(newVisited);
        setMoveHistory((prev) => [...prev, target]);
        setIsStuck(false);
        const remaining = totalSquares - Object.keys(newVisited).length;
        setMessage(
          remaining === 0
            ? "🎉 All squares visited!"
            : `Moved to ${toNotation(target.x, target.y)}. ${remaining} square${remaining !== 1 ? "s" : ""} remaining.`
        );
      }
    } else if (undoMatch) {
      if (moveHistory.length > 1) {
        const newHistory = moveHistory.slice(0, -1);
        const prevPos = newHistory[newHistory.length - 1];
        const lastPos = moveHistory[moveHistory.length - 1];
        const newVisited = { ...visitedOrder };
        delete newVisited[`${lastPos.x},${lastPos.y}`];
        setMoveHistory(newHistory);
        setKnightPos(prevPos);
        setMoveCount(moveCount - 1);
        setVisitedOrder(newVisited);
        setIsStuck(false);
        setMessage(`Undone. Back to ${toNotation(prevPos.x, prevPos.y)}.`);
      } else {
        toast({
          title: "Nothing to Undo",
          description: "You're at the starting position.",
          variant: "default",
        });
      }
    } else if (resetMatch) {
      setKnightPos({ x: 0, y: 0 });
      setMoveHistory([{ x: 0, y: 0 }]);
      setVisitedOrder({ "0,0": 1 });
      setMoveCount(0);
      setIsSuccess(false);
      setIsStuck(false);
      setMessage("Visit every square on the board using the knight.");
      toast({
        title: "Level Reset",
        description: "Knight returned to A6. Try again!",
        variant: "default",
      });
    } else if (helpMatch) {
      setHelpModalOpen(true);
    } else {
      toast({
        title: "Unknown Command",
        description: "Type /help to see available commands",
        variant: "destructive",
      });
    }

    setInputValue("");
  };

  const closeHelpModal = () => setHelpModalOpen(false);

  const CELL_SIZE = 60;
  const LABEL_SIZE = 24;
  const SVG_W = GRID_SIZE * CELL_SIZE + LABEL_SIZE;
  const SVG_H = GRID_SIZE * CELL_SIZE + LABEL_SIZE;

  return (
    <div className="flex flex-col items-center mt-8 max-w-4xl mx-auto px-4">
      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`mt-8 text-base sm:text-lg font-semibold mb-4 text-center ${
          isStuck
            ? "text-red-500 dark:text-red-400"
            : isSuccess
            ? "text-green-600 dark:text-green-400"
            : "text-purple-900 dark:text-[#F9DC34]"
        }`}
      >
        {message}
      </motion.p>

      {/* Board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-[#1a1a2e] dark:bg-[#1a1a2e] rounded-2xl p-3 shadow-lg border border-purple-700/30 w-full max-w-sm relative"
      >
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
          {/* Column labels (A-F) */}
          {LETTERS.map((letter, i) => (
            <text
              key={`col-${i}`}
              x={LABEL_SIZE + i * CELL_SIZE + CELL_SIZE / 2}
              y={SVG_H - 4}
              textAnchor="middle"
              fontSize="12"
              fill="#8888BB"
              fontWeight="bold"
            >
              {letter}
            </text>
          ))}

          {/* Row labels (6-1 top to bottom) */}
          {Array.from({ length: GRID_SIZE }, (_, i) => (
            <text
              key={`row-${i}`}
              x={10}
              y={i * CELL_SIZE + CELL_SIZE / 2 + 5}
              textAnchor="middle"
              fontSize="12"
              fill="#8888BB"
              fontWeight="bold"
            >
              {GRID_SIZE - i}
            </text>
          ))}

          {/* Grid cells */}
          {Array.from({ length: GRID_SIZE }, (_, row) =>
            Array.from({ length: GRID_SIZE }, (_, col) => {
              const x = col;
              const y = row;
              const key = `${x},${y}`;
              const step = visitedOrder[key];
              const isKnight = x === knightPos.x && y === knightPos.y;
              const isValid = validMoves.some((m) => m.x === x && m.y === y);
              const isDark = (row + col) % 2 === 1;
              const isVisited = !!step && !isKnight;

              let fillColor;
              if (isKnight) {
                fillColor = "#7C3AED";
              } else if (isVisited) {
                fillColor = isDark ? "#1a3a20" : "#1e4a28";
              } else if (isValid) {
                fillColor = isDark ? "#3a2060" : "#4a2878";
              } else {
                fillColor = isDark ? "#2D1B4B" : "#3D2060";
              }

              const cellX = LABEL_SIZE + col * CELL_SIZE;
              const cellY = row * CELL_SIZE;
              const centerX = cellX + CELL_SIZE / 2;
              const centerY = cellY + CELL_SIZE / 2;

              return (
                <g key={key}>
                  <motion.rect
                    x={cellX}
                    y={cellY}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    fill={fillColor}
                    stroke="#6B21A8"
                    strokeWidth="1"
                    rx="2"
                    animate={{ fill: fillColor }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Valid move dot */}
                  {isValid && !isKnight && (
                    <motion.circle
                      cx={centerX}
                      cy={centerY}
                      r="8"
                      fill="#F9DC34"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3], scale: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  {/* Visited step number */}
                  {isVisited && (
                    <motion.text
                      x={centerX}
                      y={centerY + 5}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#4ade80"
                      fontWeight="bold"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.7, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {step}
                    </motion.text>
                  )}
                </g>
              );
            })
          )}

          {/* Move trail lines */}
          {moveHistory.length > 1 &&
            moveHistory.slice(0, -1).map((pos, i) => {
              const next = moveHistory[i + 1];
              const x1 = LABEL_SIZE + pos.x * CELL_SIZE + CELL_SIZE / 2;
              const y1 = pos.y * CELL_SIZE + CELL_SIZE / 2;
              const x2 = LABEL_SIZE + next.x * CELL_SIZE + CELL_SIZE / 2;
              const y2 = next.y * CELL_SIZE + CELL_SIZE / 2;
              return (
                <line
                  key={`trail-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#F9DC34"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.3"
                />
              );
            })}

          {/* Knight piece */}
          <AnimatePresence mode="popLayout">
            <motion.text
              key={`knight-${knightPos.x}-${knightPos.y}`}
              x={LABEL_SIZE + knightPos.x * CELL_SIZE + CELL_SIZE / 2}
              y={knightPos.y * CELL_SIZE + CELL_SIZE / 2 + 12}
              textAnchor="middle"
              fontSize="34"
              className="select-none"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              ♞
            </motion.text>
          </AnimatePresence>
        </svg>

        {/* Progress bar */}
        <div className="mt-2 px-2">
          <div className="flex justify-between text-xs text-purple-300 mb-1">
            <span>
              Visited: <span className="text-[#F9DC34] font-bold">{visitedCount}/{totalSquares}</span>
            </span>
            <span>
              Moves: <span className="text-[#F9DC34] font-bold">{moveCount}</span>
            </span>
            <span>
              At: <span className="text-[#F9DC34] font-bold">{toNotation(knightPos.x, knightPos.y)}</span>
            </span>
          </div>
          <div className="w-full bg-purple-900/40 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-[#F9DC34] to-[#F5A623]"
              animate={{ width: `${(visitedCount / totalSquares) * 100}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Sticky Command Panel */}
      <div className="sticky bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#1A0F2E] via-[#1A0F2E]/95 to-transparent backdrop-blur-sm border-t border-purple-500/20 py-4 mt-8">
        <div className="flex flex-col items-center gap-3 max-w-4xl mx-auto px-4">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-center cursor-pointer text-purple-700 dark:text-purple-300 hover:text-[#F5A623] dark:hover:text-[#F9DC34] transition-colors"
            onClick={() => setHelpModalOpen(true)}
          >
            Type{" "}
            <span className="font-mono bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
              /help
            </span>{" "}
            to get commands and hints
          </motion.span>

          {/* Command input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex gap-2 w-full max-w-md"
          >
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleEnter}
              placeholder="Enter command..."
              className="border-purple-300 dark:border-purple-600/50 bg-white dark:bg-[#1A0F2E]/70 shadow-inner focus:ring-[#F5A623] focus:border-[#F9DC34]"
            />
            <button
              onClick={handleCommandSubmit}
              className="bg-gradient-to-r from-[#F9DC34] to-[#F5A623] hover:from-[#FFE55C] hover:to-[#FFBD4A] p-2 rounded-lg shadow-md transition-transform hover:scale-105"
            >
              <Image
                src="/runcode.png"
                alt="Run"
                height={20}
                width={20}
                className="rounded-sm"
              />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#2D1B4B] rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
          >
            <div className="p-6 overflow-y-auto flex-grow">
              <h2 className="text-2xl font-bold mb-4 text-purple-800 dark:text-[#F9DC34]">
                The Lonely Knight ♞
              </h2>
              <div className="space-y-1 mb-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /move
                  </span>{" "}
                  <span className="text-blue-600 dark:text-blue-300">[square]</span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Move the knight to a square (e.g., <code>/move B4</code>).
                    <br />
                    Columns: A–{LETTERS[GRID_SIZE - 1]}, Rows: 1–{GRID_SIZE}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /undo
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Take back your last move.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /reset
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Start over from square A{GRID_SIZE}.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /help
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Show commands and hints.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-purple-800 dark:text-[#F9DC34]">
                Rules:
              </h3>
              <div className="space-y-1 text-gray-600 dark:text-gray-300 text-sm mb-4">
                <p>• The knight moves in an <strong>L-shape</strong>: 2 squares in one direction + 1 square perpendicular.</p>
                <p>• Visit every square on the {GRID_SIZE}×{GRID_SIZE} board <strong>exactly once</strong>.</p>
                <p>• <span className="text-[#F9DC34]">●</span> Yellow dots show valid moves.</p>
                <p>• <span className="text-green-400">Green numbers</span> show your path order.</p>
              </div>

              <h3 className="text-xl font-bold mb-2 text-purple-800 dark:text-[#F9DC34]">
                Hint:
              </h3>
              <p className="text-gray-600 dark:text-gray-300 italic">
                Try to stay near the edges first and work inward. Avoid getting trapped in corners!
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/30 px-6 py-4 text-center flex-shrink-0">
              <button
                onClick={closeHelpModal}
                className="bg-gradient-to-r from-[#F9DC34] to-[#F5A623] hover:from-[#FFE55C] hover:to-[#FFBD4A] px-6 py-2 rounded-lg text-purple-900 font-medium shadow-md transition-transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Level4;

