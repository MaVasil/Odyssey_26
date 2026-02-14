"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../ui/use-toast";

const ITEMS = {
  wolf: { emoji: "🐺", label: "Wolf" },
  goat: { emoji: "🐐", label: "Goat" },
  cabbage: { emoji: "🥬", label: "Cabbage" },
};

// Dangerous pairs: if left alone on the same bank without the player
const DANGER_PAIRS = [
  { predator: "wolf", prey: "goat", msg: "The Wolf ate the Goat! 🐺💀🐐" },
  { predator: "goat", prey: "cabbage", msg: "The Goat ate the Cabbage! 🐐💀🥬" },
];

const Level5 = ({ onComplete }) => {
  const [inputValue, setInputValue] = useState("");
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [playerSide, setPlayerSide] = useState("left"); // "left" or "right"
  const [leftBank, setLeftBank] = useState(["wolf", "goat", "cabbage"]);
  const [rightBank, setRightBank] = useState([]);
  const [boatItem, setBoatItem] = useState(null); // item being carried
  const [crossing, setCrossing] = useState(false); // animation state
  const [moveCount, setMoveCount] = useState(0);
  const { toast } = useToast();

  // Check win condition
  useEffect(() => {
    if (
      rightBank.length === 3 &&
      leftBank.length === 0 &&
      playerSide === "right" &&
      !isSuccess
    ) {
      setIsSuccess(true);
    }
  }, [rightBank, leftBank, playerSide, isSuccess]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Level Completed! 🎉",
        description: `All items crossed safely in ${moveCount} moves!`,
        variant: "success",
        className:
          "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white opacity-100 border-0 shadow-lg",
      });
      setTimeout(() => {
        onComplete(4);
      }, 2000);
    }
  }, [isSuccess, onComplete, toast, moveCount]);

  // Check for dangerous situation on banks
  const checkDanger = (left, right, side) => {
    // Check the bank the player is NOT on
    const unattendedBank = side === "left" ? right : left;
    for (const pair of DANGER_PAIRS) {
      if (
        unattendedBank.includes(pair.predator) &&
        unattendedBank.includes(pair.prey)
      ) {
        return pair.msg;
      }
    }
    return null;
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      handleCommandSubmit();
    }
  };

  const performCrossing = (item) => {
    if (crossing) return;
    setCrossing(true);

    const fromSide = playerSide;
    const toSide = fromSide === "left" ? "right" : "left";

    let newLeft = [...leftBank];
    let newRight = [...rightBank];

    // Remove item from source bank
    if (item) {
      if (fromSide === "left") {
        newLeft = newLeft.filter((i) => i !== item);
      } else {
        newRight = newRight.filter((i) => i !== item);
      }
    }

    // After a short delay (boat animation), complete the crossing
    setTimeout(() => {
      // Add item to destination bank
      if (item) {
        if (toSide === "left") {
          newLeft = [...newLeft, item];
        } else {
          newRight = [...newRight, item];
        }
      }

      // Check danger on the bank we're leaving
      const danger = checkDanger(newLeft, newRight, toSide);
      if (danger) {
        setFailMessage(danger);
        setIsFailed(true);
        setLeftBank(newLeft);
        setRightBank(newRight);
        setPlayerSide(toSide);
        setCrossing(false);

        toast({
          title: "Game Over! 💀",
          description: danger,
          variant: "destructive",
          className:
            "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white opacity-100 shadow-lg",
        });
        return;
      }

      setLeftBank(newLeft);
      setRightBank(newRight);
      setPlayerSide(toSide);
      setBoatItem(null);
      setMoveCount((prev) => prev + 1);
      setCrossing(false);

      toast({
        title: item
          ? `Crossed with ${ITEMS[item].label} ${ITEMS[item].emoji}`
          : "Crossed alone 🚣",
        description: `You are now on the ${toSide} bank.`,
        variant: "default",
        className:
          "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-[#2D1B4B] opacity-100 shadow-lg",
      });
    }, 800);
  };

  const handleCommandSubmit = () => {
    const cmd = inputValue.trim().toLowerCase();

    const crossWithMatch = cmd.match(
      /^\/cross\s+with\s+(wolf|goat|cabbage)$/i
    );
    const crossAloneMatch = cmd.match(/^\/cross\s+alone$/i);
    const resetMatch = cmd.match(/^\/reset$/i);
    const helpMatch = cmd.match(/^\/help$/i);

    if (isFailed && !resetMatch && !helpMatch) {
      toast({
        title: "Game Over",
        description: "Use /reset to try again.",
        variant: "destructive",
        className:
          "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white opacity-100 shadow-lg",
      });
      setInputValue("");
      return;
    }

    if (crossWithMatch) {
      const item = crossWithMatch[1].toLowerCase();
      const currentBank = playerSide === "left" ? leftBank : rightBank;

      if (!currentBank.includes(item)) {
        toast({
          title: "Item Not Here",
          description: `The ${ITEMS[item].label} is not on the ${playerSide} bank.`,
          variant: "destructive",
          className:
            "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white opacity-100 shadow-lg",
        });
      } else {
        setBoatItem(item);
        performCrossing(item);
      }
    } else if (crossAloneMatch) {
      performCrossing(null);
    } else if (resetMatch) {
      setPlayerSide("left");
      setLeftBank(["wolf", "goat", "cabbage"]);
      setRightBank([]);
      setBoatItem(null);
      setIsSuccess(false);
      setIsFailed(false);
      setFailMessage("");
      setMoveCount(0);
      toast({
        title: "Level Reset",
        description: "Back to the left bank with all items.",
        variant: "default",
        className:
          "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-[#2D1B4B] opacity-100 shadow-lg",
      });
    } else if (helpMatch) {
      setHelpModalOpen(true);
    } else {
      toast({
        title: "Unknown Command",
        description: "Type /help to see available commands",
        variant: "destructive",
        className:
          "fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white opacity-100 shadow-lg",
      });
    }

    setInputValue("");
  };

  const closeHelpModal = () => {
    setHelpModalOpen(false);
  };

  // Render items on a bank
  const renderBankItems = (items, side) => {
    return items.map((item, i) => {
      const xBase = side === "left" ? 30 : 310;
      const xOffset = i * 28;
      return (
        <motion.text
          key={`${side}-${item}`}
          x={xBase + xOffset}
          y={195}
          fontSize="26"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="select-none"
        >
          {ITEMS[item].emoji}
        </motion.text>
      );
    });
  };

  const boatX = playerSide === "left" ? 120 : 230;

  return (
    <div className="flex flex-col items-center mt-8 max-w-4xl mx-auto px-4">
      {/* Level title badge */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 py-3 text-2xl font-bold text-[#2D1B4B] dark:text-[#1A0F2E] bg-gradient-to-r from-[#F9DC34] to-[#F5A623] rounded-full shadow-lg"
      >
        Level 5
      </motion.h1>

      {/* Question */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 text-xl font-semibold mb-4 text-center text-purple-900 dark:text-[#F9DC34]"
      >
        Cross the river with all three items safely.
      </motion.p>

      {/* Scene */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-b from-[#87CEEB] to-[#5BA3D9] dark:from-[#1a2744] dark:to-[#0f1d33] rounded-2xl p-0 shadow-lg border border-purple-200 dark:border-purple-700/30 w-full max-w-md relative overflow-hidden"
      >
        <svg viewBox="0 0 400 250" className="w-full">
          {/* Sky */}
          <rect x="0" y="0" width="400" height="130" fill="transparent" />

          {/* Clouds */}
          <g opacity="0.6">
            <ellipse cx="80" cy="30" rx="25" ry="10" fill="white" />
            <ellipse cx="65" cy="26" rx="16" ry="8" fill="white" />
            <ellipse cx="95" cy="27" rx="14" ry="7" fill="white" />
          </g>
          <g opacity="0.4">
            <ellipse cx="300" cy="40" rx="20" ry="8" fill="white" />
            <ellipse cx="285" cy="37" rx="14" ry="7" fill="white" />
            <ellipse cx="315" cy="38" rx="12" ry="6" fill="white" />
          </g>

          {/* River (drawn first, behind banks) */}
          <rect x="100" y="130" width="200" height="120" fill="#1976D2" opacity="0.7" />
          <rect x="108" y="130" width="184" height="120" fill="#2196F3" opacity="0.6" />

          {/* Left bank (earth) — drawn on top of river */}
          <path
            d="M0,120 Q55,115 115,135 L115,250 L0,250 Z"
            fill="#5D8C3E"
          />
          <path
            d="M0,128 Q55,123 112,140 L112,250 L0,250 Z"
            fill="#4A7A2E"
          />

          {/* Right bank (earth) — drawn on top of river */}
          <path
            d="M285,135 Q345,115 400,120 L400,250 L285,250 Z"
            fill="#5D8C3E"
          />
          <path
            d="M288,140 Q345,123 400,128 L400,250 L288,250 Z"
            fill="#4A7A2E"
          />

          {/* River waves */}
          <motion.path
            d="M115,160 Q145,153 175,160 Q205,167 235,160 Q265,153 285,160"
            fill="none"
            stroke="#64B5F6"
            strokeWidth="2"
            opacity="0.5"
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          <motion.path
            d="M115,180 Q145,173 175,180 Q205,187 235,180 Q265,173 285,180"
            fill="none"
            stroke="#64B5F6"
            strokeWidth="1.5"
            opacity="0.4"
            animate={{ x: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M115,200 Q145,193 175,200 Q205,207 235,200 Q265,193 285,200"
            fill="none"
            stroke="#90CAF9"
            strokeWidth="1"
            opacity="0.3"
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          />

          {/* Bank labels */}
          <text x="55" y="170" textAnchor="middle" fontSize="11" fill="#2E7D32" fontWeight="bold">
            LEFT
          </text>
          <text x="55" y="182" textAnchor="middle" fontSize="11" fill="#2E7D32" fontWeight="bold">
            BANK
          </text>
          <text x="345" y="170" textAnchor="middle" fontSize="11" fill="#2E7D32" fontWeight="bold">
            RIGHT
          </text>
          <text x="345" y="182" textAnchor="middle" fontSize="11" fill="#2E7D32" fontWeight="bold">
            BANK
          </text>

          {/* Boat */}
          <motion.g
            animate={{ x: crossing ? (playerSide === "left" ? 110 : -110) : 0 }}
            transition={{ type: "tween", duration: 0.8, ease: "easeInOut" }}
          >
            <motion.g
              animate={{ x: playerSide === "left" ? 0 : 110 }}
              transition={{ duration: 0 }}
            >
              {/* Boat body */}
              <path
                d={`M${120},220 L${125},235 L${175},235 L${180},220 Z`}
                fill="#8D6E63"
                stroke="#5D4037"
                strokeWidth="1.5"
              />
              {/* Boat interior */}
              <path
                d={`M${125},220 L${128},232 L${172},232 L${175},220 Z`}
                fill="#A1887F"
              />
              {/* Player in boat */}
              <text x="143" y="218" fontSize="22" className="select-none">
                🧑
              </text>
              {/* Item in boat during crossing */}
              {crossing && boatItem && (
                <text x="158" y="218" fontSize="18" className="select-none">
                  {ITEMS[boatItem].emoji}
                </text>
              )}
            </motion.g>
          </motion.g>

          {/* Items on banks */}
          <AnimatePresence>
            {renderBankItems(leftBank, "left")}
            {renderBankItems(rightBank, "right")}
          </AnimatePresence>

          {/* Failure overlay */}
          {isFailed && (
            <g>
              <rect x="0" y="0" width="400" height="250" fill="red" opacity="0.15" />
              <text
                x="200"
                y="70"
                textAnchor="middle"
                fontSize="14"
                fill="#FF4444"
                fontWeight="bold"
              >
                GAME OVER
              </text>
              <text
                x="200"
                y="90"
                textAnchor="middle"
                fontSize="11"
                fill="#FF6666"
              >
                {failMessage}
              </text>
              <text
                x="200"
                y="110"
                textAnchor="middle"
                fontSize="10"
                fill="#FF8888"
              >
                Type /reset to try again
              </text>
            </g>
          )}

          {/* Status */}
          {!isFailed && (
            <text
              x="200"
              y="20"
              textAnchor="middle"
              fontSize="11"
              fill="#FFFFFF"
              fontWeight="bold"
              opacity="0.8"
            >
              You are on the {playerSide} bank • Moves: {moveCount}
            </text>
          )}
        </svg>
      </motion.div>

      {/* Item status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-md mt-3 flex justify-between px-2"
      >
        <div className="flex gap-2">
          {Object.entries(ITEMS).map(([key, item]) => {
            const onLeft = leftBank.includes(key);
            const onRight = rightBank.includes(key);
            return (
              <div
                key={key}
                className={`text-xs px-2 py-1 rounded-full border ${onRight
                  ? "bg-green-500/20 text-green-400 border-green-500/40"
                  : "bg-purple-900/30 text-purple-300 border-purple-500/30"
                  }`}
              >
                {item.emoji} {onLeft ? "Left" : onRight ? "Right ✓" : "???"}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Help prompt */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mx-10 my-6 text-center cursor-pointer text-purple-700 dark:text-purple-300 hover:text-[#F5A623] dark:hover:text-[#F9DC34] transition-colors"
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

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#2D1B4B] rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-800 dark:text-[#F9DC34]">
                Available Commands:
              </h2>
              <div className="space-y-1 mb-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /cross with
                  </span>{" "}
                  <span className="text-blue-600 dark:text-blue-300">
                    [wolf|goat|cabbage]
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Cross the river carrying the specified item.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /cross alone
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Cross the river without carrying anything.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /reset
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Reset the level to the beginning.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-[#F5A623]">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    /help
                  </span>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    Show available commands and hints.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-purple-800 dark:text-[#F9DC34]">
                Rules:
              </h3>
              <div className="space-y-2 mb-4 text-gray-600 dark:text-gray-300 text-sm">
                <p>• The boat can carry you and <strong>one</strong> item.</p>
                <p>
                  • 🐺 + 🐐 left alone = Wolf eats Goat
                </p>
                <p>
                  • 🐐 + 🥬 left alone = Goat eats Cabbage
                </p>
              </div>

              <h3 className="text-xl font-bold mb-2 text-purple-800 dark:text-[#F9DC34]">
                Hint:
              </h3>
              <p className="text-gray-600 dark:text-gray-300 italic">
                Sometimes you have to bring something back to make progress.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/30 px-6 py-4 text-center">
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

export default Level5;