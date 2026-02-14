// "use client";

// import React, { useState } from "react";
// import Level1 from "@/components/levels/L1";
// import Level2 from "@/components/levels/L2";
// import Level3 from "@/components/levels/L3";
// import Level4 from "@/components/levels/L4";
// import Level5 from "@/components/levels/L5";
// import Level6 from "@/components/levels/L6";
// import Level7 from "@/components/levels/L7";
// import Level8 from "@/components/levels/L8";
// import Level9 from "@/components/levels/L9";
// import Level10 from "@/components/levels/L10";
// import Level11 from "@/components/levels/L11";
// import Level12 from "@/components/levels/L12";
// import Level13 from "@/components/levels/L13";
// import Level14 from "@/components/levels/L14";
// import Level15 from "@/components/levels/L15";

// const levels = [
//   Level1,
//   Level2,
//   Level3,
//   Level4,
//   Level5,
//   Level6,
//   Level7,
//   Level8,
//   Level9,
//   Level10,
//   Level11,
//   Level12,
//   Level13,
//   Level14,
//   Level15,
// ];

// export default function Game() {
//   const [currentLevel, setCurrentLevel] = useState(1);

//   const handleLevelComplete = () => {
//     if (currentLevel < levels.length) {
//       setCurrentLevel((prev) => prev + 1);
//     }
//   };

//   const CurrentLevel = levels[currentLevel - 1];

//   return (
//     <div className="w-screen">
//       <CurrentLevel onComplete={handleLevelComplete} />
//     </div>
//   );
// }
"use client";

import React, { useState } from "react";
import Level1 from "@/components/levels/L1";
import Level2 from "@/components/levels/L2";
import Level3 from "@/components/levels/L3";
import Level4 from "@/components/levels/L4";
import Level5 from "@/components/levels/L5";
import Level6 from "@/components/levels/L6";
import Level7 from "@/components/levels/L7";
import Level8 from "@/components/levels/L8";
import Level9 from "@/components/levels/L9";
import Level10 from "@/components/levels/L10";
import Level11 from "@/components/levels/L11";
import Level12 from "@/components/levels/L12";
import Level13 from "@/components/levels/L13";
import Level14 from "@/components/levels/L14";
import Level15 from "@/components/levels/L15";

const levels = [
  Level1,
  Level2,
  Level3,
  Level4,
  Level5,
  Level6,
  Level7,
  Level8,
  Level9,
  Level10,
  Level11,
  Level12,
  Level13,
  Level14,
  Level15,
];

export default function Game() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(null);

  const handleLevelComplete = () => {
    if (currentLevelIndex !== null && currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
    } else {
      setCurrentLevelIndex(null); // back to grid view when finished
    }
  };

  if (currentLevelIndex !== null) {
    const CurrentLevel = levels[currentLevelIndex];
    return (
      <div className="w-screen p-4">
        <button
          className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={() => setCurrentLevelIndex(null)}
        >
          Back to Levels
        </button>
        <CurrentLevel onComplete={handleLevelComplete} />
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-3 gap-4">
      {levels.map((LevelComponent, index) => (
        <div
          key={index}
          className="border rounded-lg p-4 flex items-center justify-center cursor-pointer  transition"
          onClick={() => setCurrentLevelIndex(index)}
        >
          Level {index + 1}
        </div>
      ))}
    </div>
  );
}


