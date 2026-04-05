const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: '../.env' }); // Make sure we hit the correct .env, let's just connect using env or default

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) { console.error('ERROR: MONGO_URI not set in .env'); process.exit(1); }

// Problem Schema
const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [String],
    tags: [String],
    starterCode: { type: Map, of: String, default: {} },
    testCases: [{ input: String, expected: String, isHidden: { type: Boolean, default: false } }],
    stats: { likes: { type: Number, default: 0 }, acceptance: { type: String, default: "0%" }, solved: { type: Boolean, default: false } }
}, { timestamps: true });

const Problem = mongoose.models.Problem || mongoose.model('Problem', problemSchema);
const Contest = mongoose.models.Contest || mongoose.model('Contest', new mongoose.Schema({
    title: String, duration: Number, startTime: Date, status: String,
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    problemsList: [{ problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }, points: Number }],
    participants: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, score: Number, submitTime: Date, problemScores: [{ problemId: mongoose.Schema.Types.ObjectId, score: Number }] }]
}));

// Questions Definition
const questions = [
    {
        title: "Two Sum",
        difficulty: "easy",
        category: "Arrays",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        examples: [
            { input: "nums = [2,7,11,15]\ntarget = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4]\ntarget = 6", output: "[1,2]", explanation: "" }
        ],
        constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
        tags: ["Array", "Hash Table"],
        testCases: [
            { input: "[2,7,11,15]\n9", expected: "[0,1]", isHidden: false },
            { input: "[3,2,4]\n6", expected: "[1,2]", isHidden: false },
            { input: "[3,3]\n6", expected: "[0,1]", isHidden: true },
            { input: "[0,4,3,0]\n0", expected: "[0,3]", isHidden: true }
        ],
        starterCode: {
            javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    \n}",
            python: "def twoSum(nums, target):\n    \"\"\"\n    :type nums: List[int]\n    :type target: int\n    :rtype: List[int]\n    \"\"\"\n    pass",
            cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}"
        }
    },
    {
        title: "Trapping Rain Water",
        difficulty: "hard",
        category: "Arrays",
        description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.\n\nWater is trapped in the valleys between the elevation peaks. The total amount is the sum of units of trapped water across all blocks.",
        examples: [
            { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped." }
        ],
        constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
        tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
        testCases: [
            { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expected: "6", isHidden: false },
            { input: "[4,2,0,3,2,5]", expected: "9", isHidden: false },
            { input: "[0]", expected: "0", isHidden: true },
            { input: "[5,4,1,2]", expected: "1", isHidden: true },
            { input: "[5,2,1,2,1,5]", expected: "14", isHidden: true }
        ],
        starterCode: {
            javascript: "function trap(height) {\n    \n}",
            python: "def trap(height):\n    pass",
            cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
            java: "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}"
        }
    },
    {
        title: "Longest Substring Without Repeating Characters",
        difficulty: "medium",
        category: "Strings",
        description: "Given a string `s`, find the length of the longest substring without repeating characters.",
        examples: [
            { input: "s = \"abcabcbb\"", output: "3", explanation: "The answer is \"abc\", with the length of 3." },
            { input: "s = \"bbbbb\"", output: "1", explanation: "The answer is \"b\", with the length of 1." }
        ],
        constraints: ["0 <= s.length <= 5 * 10^4", "`s` consists of English letters, digits, symbols and spaces."],
        tags: ["Hash Table", "String", "Sliding Window"],
        testCases: [
            { input: "abcabcbb", expected: "3", isHidden: false },
            { input: "bbbbb", expected: "1", isHidden: false },
            { input: "pwwkew", expected: "3", isHidden: true },
            { input: " ", expected: "1", isHidden: true },
            { input: "dvdf", expected: "3", isHidden: true }
        ],
        starterCode: {
            javascript: "function lengthOfLongestSubstring(s) {\n    \n}",
            python: "def lengthOfLongestSubstring(s):\n    pass",
            cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
            java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}"
        }
    },
    {
        title: "Valid Anagram",
        difficulty: "easy",
        category: "Strings",
        description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
        examples: [
            { input: "s = \"anagram\", t = \"nagaram\"", output: "true", explanation: "t is formed exactly with the same letters as s." }
        ],
        constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
        tags: ["Hash Table", "String", "Sorting"],
        testCases: [
            { input: "anagram\nnagaram", expected: "true", isHidden: false },
            { input: "rat\ncar", expected: "false", isHidden: false },
            { input: "a\nab", expected: "false", isHidden: true },
            { input: "loremipsum\nsmupimerol", expected: "true", isHidden: true }
        ],
        starterCode: {
            javascript: "function isAnagram(s, t) {\n    \n}",
            python: "def isAnagram(s, t):\n    pass",
            cpp: "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        \n    }\n};",
            java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}"
        }
    },
    {
        title: "Container With Most Water",
        difficulty: "medium",
        category: "Two Pointers",
        description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `ith` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
        examples: [
            { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The max water is bound by height 8 and height 7 with distance 7, returning 49." }
        ],
        constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
        tags: ["Array", "Two Pointers", "Greedy"],
        testCases: [
            { input: "[1,8,6,2,5,4,8,3,7]", expected: "49", isHidden: false },
            { input: "[1,1]", expected: "1", isHidden: false },
            { input: "[1,2,1]", expected: "2", isHidden: true },
            { input: "[10,9,8,7,6,5,4,3,2,1]", expected: "25", isHidden: true }
        ],
        starterCode: {
            javascript: "function maxArea(height) {\n    \n}",
            python: "def maxArea(height):\n    pass",
            cpp: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};",
            java: "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}"
        }
    },
    {
        title: "Maximum Subarray",
        difficulty: "medium",
        category: "Dynamic Programming",
        description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
        examples: [
            { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." }
        ],
        constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
        testCases: [
            { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6", isHidden: false },
            { input: "[1]", expected: "1", isHidden: false },
            { input: "[5,4,-1,7,8]", expected: "23", isHidden: false },
            { input: "[-1]", expected: "-1", isHidden: true },
            { input: "[-2,-1]", expected: "-1", isHidden: true },
            { input: "[-5,1,2,3,-2,4]", expected: "8", isHidden: true }
        ],
        starterCode: {
            javascript: "function maxSubArray(nums) {\n    \n}",
            python: "def maxSubArray(nums):\n    pass",
            cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
            java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}"
        }
    },
    {
        title: "Climbing Stairs",
        difficulty: "easy",
        category: "Dynamic Programming",
        description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        examples: [
            { input: "n = 2", output: "2", explanation: "There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps" },
            { input: "n = 3", output: "3", explanation: "Three ways:\n1. 1+1+1\n2. 1+2\n3. 2+1" }
        ],
        constraints: ["1 <= n <= 45"],
        tags: ["Math", "Dynamic Programming", "Memoization"],
        testCases: [
            { input: "2", expected: "2", isHidden: false },
            { input: "3", expected: "3", isHidden: false },
            { input: "10", expected: "89", isHidden: true },
            { input: "45", expected: "1836311903", isHidden: true }
        ],
        starterCode: {
            javascript: "function climbStairs(n) {\n    \n}",
            python: "def climbStairs(n):\n    pass",
            cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
            java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}"
        }
    },
    {
        title: "Product of Array Except Self",
        difficulty: "medium",
        category: "Arrays",
        description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in `O(n)` time and without using the division operation.",
        examples: [
            { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "" },
            { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]", explanation: "" }
        ],
        constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
        tags: ["Array", "Prefix Sum"],
        testCases: [
            { input: "[1,2,3,4]", expected: "[24,12,8,6]", isHidden: false },
            { input: "[-1,1,0,-3,3]", expected: "[0,0,9,0,0]", isHidden: false },
            { input: "[0,0]", expected: "[0,0]", isHidden: true },
            { input: "[1,1,1,1]", expected: "[1,1,1,1]", isHidden: true },
            { input: "[9,0,-2]", expected: "[0,-18,0]", isHidden: true }
        ],
        starterCode: {
            javascript: "function productExceptSelf(nums) {\n    \n}",
            python: "def productExceptSelf(nums):\n    pass",
            cpp: "class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        \n    }\n};",
            java: "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}"
        }
    },
    {
        title: "Best Time to Buy and Sell Stock",
        difficulty: "easy",
        category: "Arrays",
        description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `ith` day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
        examples: [
            { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." }
        ],
        constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
        tags: ["Array", "Dynamic Programming"],
        testCases: [
            { input: "[7,1,5,3,6,4]", expected: "5", isHidden: false },
            { input: "[7,6,4,3,1]", expected: "0", isHidden: false },
            { input: "[1,2]", expected: "1", isHidden: true },
            { input: "[2,4,1]", expected: "2", isHidden: true },
            { input: "[3,2,6,5,0,3]", expected: "4", isHidden: true }
        ],
        starterCode: {
            javascript: "function maxProfit(prices) {\n    \n}",
            python: "def maxProfit(prices):\n    pass",
            cpp: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
            java: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}"
        }
    },
    {
        title: "Find Minimum in Rotated Sorted Array",
        difficulty: "medium",
        category: "Binary Search",
        description: "Suppose an array of length `n` sorted in ascending order is rotated between `1` and `n` times. For example, the array `nums = [0,1,2,4,5,6,7]` might become:\n- `[4,5,6,7,0,1,2]` if it was rotated 4 times.\n\nGiven the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in `O(log n)` time.",
        examples: [
            { input: "nums = [3,4,5,1,2]", output: "1", explanation: "The original array was [1,2,3,4,5] rotated 3 times." }
        ],
        constraints: ["n == nums.length", "1 <= n <= 5000", "-5000 <= nums[i] <= 5000", "All the integers of nums are unique."],
        tags: ["Array", "Binary Search"],
        testCases: [
            { input: "[3,4,5,1,2]", expected: "1", isHidden: false },
            { input: "[4,5,6,7,0,1,2]", expected: "0", isHidden: false },
            { input: "[11,13,15,17]", expected: "11", isHidden: false },
            { input: "[2,1]", expected: "1", isHidden: true },
            { input: "[1]", expected: "1", isHidden: true },
            { input: "[5,1,2,3,4]", expected: "1", isHidden: true }
        ],
        starterCode: {
            javascript: "function findMin(nums) {\n    \n}",
            python: "def findMin(nums):\n    pass",
            cpp: "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        \n    }\n};",
            java: "class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}"
        }
    }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to Database. Wiping Collections...');
        
        await Problem.deleteMany({});
        await Contest.deleteMany({});

        console.log('Inserting 10 deep Competitive Programming Questions...');
        
        // Add random stats generator
        const insertedProblems = await Problem.insertMany(questions.map(q => ({
            ...q,
            stats: {
                likes: Math.floor(Math.random() * 5000) + 100,
                acceptance: Math.floor(Math.random() * 40 + 35) + '%',
                solved: false
            }
        })));

        console.log(`Successfully seeded ${insertedProblems.length} dynamic problems!`);

        console.log('Inserting multiple sample contests...');
        const contests = [
            {
                title: "Weekly Algorithm Challenge",
                subtitle: "Master the art of algorithms",
                description: "Put your algorithmic skills to the test with challenging problems from around the world. This week focuses on dynamic programming and graph algorithms.",
                difficulty: "medium",
                status: "active",
                startTime: new Date(Date.now() - 3600000 * 5),
                endTime: new Date(Date.now() + 3600000 * 43),  // 48h total
                prize: "$500",
                organizer: "CodeWith? Team",
                tags: ["Algorithms", "Data Structures"],
                rules: ["Solve all problems to win prizes", "No plagiarism", "Submissions accepted until end"],
                participants: [],
                problemsList: insertedProblems.slice(0, 4).map((p, i) => ({
                    id: p._id.toString(), title: p.title, difficulty: p.difficulty,
                    points: (i + 1) * 100, solved: 15, acceptance: "64%"
                }))
            },
            {
                title: "Future Championship 2024",
                subtitle: "The ultimate coding challenge",
                description: "Top coders compete for the grand prize and eternal glory! Advanced problems across multiple domains.",
                difficulty: "hard",
                status: "upcoming",
                startTime: new Date(Date.now() + 3600000 * 72),
                endTime: new Date(Date.now() + 3600000 * 96),
                prize: "$2000 + Trophy",
                organizer: "CodeWith? Team",
                tags: ["Championship", "Advanced"],
                rules: ["Registration required", "5 challenging problems", "Global leaderboard"],
                participants: [],
                problemsList: insertedProblems.slice(5, 9).map((p, i) => ({
                    id: p._id.toString(), title: p.title, difficulty: p.difficulty,
                    points: (i + 1) * 200, solved: 0, acceptance: "0%"
                }))
            },
            {
                title: "Beginner's Logic Sprint",
                subtitle: "Start your journey here",
                description: "A past contest perfect for practicing basic logic and problem-solving skills.",
                difficulty: "easy",
                status: "past",
                startTime: new Date(Date.now() - 3600000 * 168),
                endTime: new Date(Date.now() - 3600000 * 144),
                prize: "Badge + Credits",
                organizer: "CodeWith? Team",
                tags: ["Basics", "Warmup"],
                rules: ["Unlimited attempts", "Solution hints available"],
                participants: [],
                problemsList: insertedProblems.slice(0, 3).map((p, i) => ({
                    id: p._id.toString(), title: p.title, difficulty: p.difficulty,
                    points: 50, solved: 120, acceptance: "88%"
                }))
            }
        ];

        await Contest.insertMany(contests);
        console.log('Successfully seeded 3 rich contests!');

        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
}

seed();
