export interface AptitudeTopic {
  id: string;
  title: string;
  emoji: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface AptitudeCategory {
  category: string;
  icon: string;
  color: string; // tailwind bg color class
  topics: AptitudeTopic[];
}

export const APTITUDE_CATEGORIES: AptitudeCategory[] = [
  {
    category: "Speed Maths Tricks",
    icon: "⚡",
    color: "bg-amber-500",
    topics: [
      { id: "multiply-by-11", title: "Multiply by 11 Instantly", emoji: "✖️", difficulty: "easy" },
      { id: "multiply-by-99-101", title: "Multiply by 99 & 101", emoji: "🚀", difficulty: "easy" },
      { id: "square-ending-in-5", title: "Square Any Number Ending in 5", emoji: "5️⃣", difficulty: "easy" },
      { id: "multiply-near-100", title: "Multiply Numbers Near 100", emoji: "💯", difficulty: "easy" },
      { id: "fast-addition-subtraction", title: "Lightning Fast Addition & Subtraction", emoji: "⚡", difficulty: "easy" },
      { id: "vedic-multiplication", title: "Vedic Maths Multiplication", emoji: "🧠", difficulty: "medium" },
      { id: "mental-percentage-calc", title: "Calculate Percentages Mentally", emoji: "🧮", difficulty: "easy" },
      { id: "fast-square-roots", title: "Estimate Square Roots Fast", emoji: "√", difficulty: "medium" },
      { id: "multiply-by-25-50-75", title: "Multiply by 25, 50 & 75", emoji: "🎯", difficulty: "easy" },
      { id: "digit-sum-casting-9", title: "Digit Sum & Casting Out 9s", emoji: "🔢", difficulty: "medium" },
      { id: "cube-roots-fast", title: "Find Cube Roots Fast", emoji: "3️⃣", difficulty: "medium" },
    ],
  },
  {
    category: "Number System",
    icon: "🔢",
    color: "bg-blue-500",
    topics: [
      { id: "types-of-numbers", title: "Types of Numbers", emoji: "1️⃣", difficulty: "easy" },
      { id: "prime-composite-numbers", title: "Prime & Composite Numbers", emoji: "🔑", difficulty: "easy" },
      { id: "divisibility-rules", title: "Divisibility Rules (2 to 13)", emoji: "➗", difficulty: "easy" },
      { id: "hcf-and-lcm", title: "HCF & LCM", emoji: "🧩", difficulty: "medium" },
      { id: "fractions-and-decimals", title: "Fractions & Decimals", emoji: "½", difficulty: "easy" },
      { id: "surds-and-indices", title: "Surds & Indices (Powers)", emoji: "🔣", difficulty: "hard" },
      { id: "number-series-patterns", title: "Number Series & Patterns", emoji: "📈", difficulty: "medium" },
      { id: "unit-digit-problems", title: "Unit Digit Problems", emoji: "0️⃣", difficulty: "medium" },
    ],
  },
  {
    category: "Percentage & Profit",
    icon: "💰",
    color: "bg-green-500",
    topics: [
      { id: "percentages", title: "Percentages", emoji: "💯", difficulty: "easy" },
      { id: "profit-and-loss", title: "Profit & Loss", emoji: "💹", difficulty: "medium" },
      { id: "discount-and-markup", title: "Discount & Selling Price", emoji: "🏷️", difficulty: "easy" },
      { id: "successive-discounts", title: "Successive Discounts", emoji: "🎁", difficulty: "medium" },
    ],
  },
  {
    category: "Interest & Finance",
    icon: "🏦",
    color: "bg-emerald-600",
    topics: [
      { id: "simple-interest", title: "Simple Interest", emoji: "🏦", difficulty: "easy" },
      { id: "compound-interest", title: "Compound Interest", emoji: "📊", difficulty: "medium" },
      { id: "emi-installments", title: "EMI & Installments", emoji: "💳", difficulty: "hard" },
    ],
  },
  {
    category: "Ratio & Averages",
    icon: "⚖️",
    color: "bg-purple-500",
    topics: [
      { id: "ratio-and-proportion", title: "Ratio & Proportion", emoji: "⚖️", difficulty: "easy" },
      { id: "averages", title: "Averages", emoji: "📉", difficulty: "easy" },
      { id: "weighted-average", title: "Weighted Average", emoji: "⚖️", difficulty: "medium" },
      { id: "mixture-and-alligation", title: "Mixtures & Alligation", emoji: "🧪", difficulty: "hard" },
      { id: "partnership-problems", title: "Partnership & Profit Sharing", emoji: "🤝", difficulty: "medium" },
    ],
  },
  {
    category: "Time-Based Problems",
    icon: "⏱️",
    color: "bg-orange-500",
    topics: [
      { id: "time-and-work", title: "Time & Work", emoji: "👷", difficulty: "medium" },
      { id: "work-wages", title: "Work & Wages", emoji: "💵", difficulty: "medium" },
      { id: "pipes-and-cisterns", title: "Pipes & Cisterns", emoji: "🚰", difficulty: "medium" },
      { id: "time-speed-distance", title: "Time, Speed & Distance", emoji: "🚗", difficulty: "medium" },
      { id: "problems-on-trains", title: "Problems on Trains", emoji: "🚂", difficulty: "medium" },
      { id: "boats-and-streams", title: "Boats & Streams", emoji: "⛵", difficulty: "medium" },
      { id: "relative-speed", title: "Relative Speed", emoji: "💨", difficulty: "medium" },
    ],
  },
  {
    category: "Algebra & Advanced",
    icon: "🧮",
    color: "bg-red-500",
    topics: [
      { id: "simplification-bodmas", title: "Simplification & BODMAS", emoji: "🧮", difficulty: "easy" },
      { id: "problems-on-ages", title: "Problems on Ages", emoji: "👴", difficulty: "medium" },
      { id: "linear-equations", title: "Linear Equations", emoji: "📏", difficulty: "medium" },
      { id: "quadratic-equations", title: "Quadratic Equations", emoji: "📐", difficulty: "hard" },
      { id: "permutation-combination", title: "Permutation & Combination", emoji: "🔀", difficulty: "hard" },
      { id: "probability", title: "Probability", emoji: "🎲", difficulty: "hard" },
      { id: "logarithms", title: "Logarithms", emoji: "📝", difficulty: "hard" },
      { id: "inequalities", title: "Inequalities", emoji: "≥", difficulty: "medium" },
    ],
  },
  {
    category: "Geometry & Mensuration",
    icon: "📐",
    color: "bg-teal-500",
    topics: [
      { id: "triangles", title: "Triangles & Their Properties", emoji: "🔺", difficulty: "medium" },
      { id: "circles", title: "Circles — Area & Circumference", emoji: "⭕", difficulty: "medium" },
      { id: "quadrilaterals-polygons", title: "Quadrilaterals & Polygons", emoji: "⬛", difficulty: "medium" },
      { id: "3d-shapes-volume", title: "3D Shapes, Volume & Surface Area", emoji: "📦", difficulty: "hard" },
      { id: "coordinate-geometry", title: "Coordinate Geometry", emoji: "📍", difficulty: "hard" },
      { id: "pythagoras-theorem", title: "Pythagoras Theorem", emoji: "📐", difficulty: "medium" },
    ],
  },
  {
    category: "Data Interpretation",
    icon: "📊",
    color: "bg-sky-500",
    topics: [
      { id: "data-tables", title: "Data Tables", emoji: "📋", difficulty: "medium" },
      { id: "bar-graphs", title: "Bar Graphs", emoji: "📊", difficulty: "medium" },
      { id: "pie-charts", title: "Pie Charts", emoji: "🥧", difficulty: "medium" },
      { id: "line-graphs", title: "Line Graphs & Trends", emoji: "📈", difficulty: "medium" },
      { id: "caselet-di", title: "Caselet Data Interpretation", emoji: "📄", difficulty: "hard" },
    ],
  },
  {
    category: "Logical Reasoning",
    icon: "🧩",
    color: "bg-indigo-500",
    topics: [
      { id: "calendar-problems", title: "Calendar Problems", emoji: "📅", difficulty: "medium" },
      { id: "clock-problems", title: "Clock Problems", emoji: "🕐", difficulty: "medium" },
      { id: "coding-decoding", title: "Coding & Decoding", emoji: "🔐", difficulty: "medium" },
      { id: "blood-relations", title: "Blood Relations", emoji: "👨‍👩‍👧", difficulty: "medium" },
      { id: "direction-sense", title: "Direction Sense", emoji: "🧭", difficulty: "easy" },
      { id: "seating-arrangement", title: "Seating Arrangement", emoji: "💺", difficulty: "hard" },
      { id: "syllogisms", title: "Syllogisms", emoji: "💭", difficulty: "hard" },
      { id: "input-output", title: "Input-Output Problems", emoji: "🔄", difficulty: "hard" },
    ],
  },
];

export function getAllTopics(): (AptitudeTopic & { category: string; categoryIcon: string; categoryColor: string })[] {
  return APTITUDE_CATEGORIES.flatMap((cat) =>
    cat.topics.map((t) => ({ ...t, category: cat.category, categoryIcon: cat.icon, categoryColor: cat.color }))
  );
}

export function findTopic(id: string): (AptitudeTopic & { category: string; categoryIcon: string; categoryColor: string }) | null {
  for (const cat of APTITUDE_CATEGORIES) {
    const topic = cat.topics.find((t) => t.id === id);
    if (topic) return { ...topic, category: cat.category, categoryIcon: cat.icon, categoryColor: cat.color };
  }
  return null;
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};
