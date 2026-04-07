require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Contest = require('./models/Contest');
const Problem = require('./models/Problem');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variable to track DB status
let dbConnected = false;

// Connect to MongoDB
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('MongoDB Connected');
            dbConnected = true;
            seedData();
        })
        .catch(err => console.error('MongoDB Connection Error:', err));
} else {
    console.log('No MONGO_URI found. Running in fallback mode with mock data.');
}

// ── Mock Data (Fallback) ──
const mockContests = [
    {
        id: 1,
        title: "Weekly Algorithm Challenge",
        subtitle: "Master the art of algorithms",
        description: "Put your algorithmic skills to the test with challenging problems from around the world. This week focuses on dynamic programming and graph algorithms.",
        difficulty: "medium",
        status: "active",
        startTime: new Date(Date.now() - 3600000 * 5),
        endTime: new Date(Date.now() + 3600000 * 2.75),
        prize: "$500",
        organizer: "CodeWith? Team",
        tags: ["Algorithms", "Data Structures"],
        rules: [
            "Solve all problems to win prizes",
            "No plagiarism allowed",
            "Submissions accepted until contest ends"
        ],
        participants: [1, 2, 3, 4, 5],
        problemsList: [{ id: 1, title: "Two Sum", difficulty: "easy", points: 100, solved: 10, acceptance: "50%" }],
        leaderboard: []
    },
    {
        id: 2,
        title: "Beginner Bootcamp",
        subtitle: "Perfect for newcomers",
        description: "Your first step into competitive programming! Learn the basics with simple problems designed to build confidence.",
        difficulty: "easy",
        status: "active",
        startTime: new Date(Date.now() - 3600000 * 48),
        endTime: new Date(Date.now() + 3600000 * 80),
        prize: "$200",
        organizer: "CodeWith? Team",
        tags: ["Basics", "Learning"],
        rules: [
            "Unlimited submissions",
            "No time penalty",
            "Perfect for beginners"
        ],
        participants: [],
        problemsList: [],
        leaderboard: []
    },
    {
        id: 3,
        title: "Future Championship 2024",
        subtitle: "The ultimate coding challenge of the year",
        description: "Get ready for the most exciting coding championship of the year. Top coders from around the world will compete for the grand prize and eternal glory! This contest features challenging problems across multiple domains.",
        difficulty: "hard",
        status: "upcoming",
        startTime: new Date(Date.now() + 3600000 * 72), // 3 days from now
        endTime: new Date(Date.now() + 3600000 * 96),   // 4 days from now
        prize: "$2000 + Trophy",
        organizer: "CodeWith? Team",
        tags: ["Championship", "Advanced", "Algorithms", "System Design"],
        rules: [
            "Registration required",
            "5 challenging problems",
            "Global leaderboard",
            "Live ranking updates"
        ],
        participants: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        problemsList: [],
        leaderboard: []
    },
    {
        id: 4,
        title: "Weekend Challenge: Dynamic Programming",
        subtitle: "Master DP this weekend",
        description: "A special weekend contest focused entirely on Dynamic Programming problems. Perfect for those wanting to master this crucial topic.",
        difficulty: "medium",
        status: "upcoming",
        startTime: new Date(Date.now() + 3600000 * 48), // 2 days from now
        endTime: new Date(Date.now() + 3600000 * 51),   // 2 days + 3 hours from now
        prize: "$300",
        organizer: "CodeWith? Team",
        tags: ["Dynamic Programming", "Algorithms"],
        rules: [
            "3 DP problems",
            "3 hours duration",
            "Hints available"
        ],
        participants: [1, 2, 3],
        problemsList: [],
        leaderboard: []
    },
    {
        id: 5,
        title: "Past Contest Example",
        subtitle: "This contest has ended",
        description: "This is an example of a past contest that has already ended.",
        difficulty: "hard",
        status: "past",
        startTime: new Date(Date.now() - 3600000 * 72),
        endTime: new Date(Date.now() - 3600000 * 24),
        prize: "$1000",
        organizer: "CodeWith? Team",
        tags: ["Advanced", "Algorithms"],
        rules: [
            "5 hard problems",
            "2 hours duration",
            "No partial points"
        ],
        participants: [1, 2, 3, 4, 5, 6, 7, 8],
        problemsList: [],
        leaderboard: []
    }
];

const mockProblems = [
    {
        id: 1,
        title: "Two Sum",
        difficulty: "easy",
        category: "Arrays",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] == 6, so we return [1, 2]." },
            { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "" }
        ],
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        tags: ["Array", "Hash Table", "Two Pointers"],
        testCases: [
            { input: "[2,7,11,15], 9", expected: "[0,1]" },
            { input: "[3,2,4], 6", expected: "[1,2]" },
            { input: "[3,3], 6", expected: "[0,1]" }
        ],
        starterCode: {
            javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    const map = new Map();\n    for(let i=0; i<nums.length; i++) {\n        const complement = target - nums[i];\n        if(map.has(complement)) return [map.get(complement), i];\n        map.set(nums[i], i);\n    }\n};",
            python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        prevMap = {} # val : index\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in prevMap:\n                return [prevMap[diff], i]\n            prevMap[n] = i",
            cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> prevMap;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (prevMap.find(diff) != prevMap.end()) return {prevMap[diff], i};\n            prevMap[nums[i]] = i;\n        }\n        return {};\n    }\n};",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> prevMap = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (prevMap.containsKey(diff)) return new int[] { prevMap.get(diff), i };\n            prevMap.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}"
        }
    },
    {
        id: 2,
        title: "Reverse String",
        difficulty: "easy",
        category: "Strings",
        description: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
        examples: [
            { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: "" },
            { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: "" }
        ],
        constraints: [
            "1 <= s.length <= 10^5",
            "s[i] is a printable ascii character."
        ],
        tags: ["String", "Two Pointers"],
        testCases: [
            { input: '["h","e","l","l","o"]', expected: '["o","l","l","e","h"]' },
            { input: '["H","a","n","n","a","h"]', expected: '["h","a","n","n","a","H"]' }
        ],
        starterCode: {
            javascript: "function reverseString(s) {\n    // Write your code here\n    \n}",
            python: "def reverseString(s):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};",
            java: "class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}"
        }
    },
    {
        id: 3,
        title: "Palindrome Number",
        difficulty: "easy",
        category: "Math",
        description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
        examples: [
            { input: "x = 121", output: "true", explanation: "121 reads as 121 from left to right and from right to left." },
            { input: "x = -121", output: "false", explanation: "From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome." }
        ],
        constraints: ["-2^31 <= x <= 2^31 - 1"],
        tags: ["Math"],
        testCases: [{ input: "121", expected: "true" }, { input: "-121", expected: "false" }],
        starterCode: { javascript: "function isPalindrome(x) {\n\n}", python: "def isPalindrome(x):\n    pass", cpp: "class Solution {\npublic:\n    bool isPalindrome(int x) {\n\n    }\n};", java: "class Solution {\n    public boolean isPalindrome(int x) {\n\n    }\n}" }
    },
    {
        id: 4,
        title: "Longest Substring Without Repeating Characters",
        difficulty: "medium",
        category: "Strings",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        examples: [{ input: "s = 'abcabcbb'", output: "3", explanation: "The answer is 'abc', with the length of 3." }],
        constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
        tags: ["Hash Table", "String", "Sliding Window"],
        testCases: [{ input: "'abcabcbb'", expected: "3" }],
        starterCode: { javascript: "function lengthOfLongestSubstring(s) {\n\n}", python: "def lengthOfLongestSubstring(s):\n    pass", cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n\n    }\n};", java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n\n    }\n}" }
    },
    {
        id: 5,
        title: "Median of Two Sorted Arrays",
        difficulty: "hard",
        category: "Arrays",
        description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
        examples: [{ input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "merged array = [1,2,3] and median is 2." }],
        constraints: ["nums1.length == m", "nums2.length == n", "0 <= m <= 1000", "0 <= n <= 1000", "1 <= m + n <= 2000"],
        tags: ["Array", "Binary Search", "Divide and Conquer"],
        testCases: [{ input: "[1,3], [2]", expected: "2.00000" }],
        starterCode: { javascript: "function findMedianSortedArrays(nums1, nums2) {\n\n}", python: "def findMedianSortedArrays(nums1, nums2):\n    pass", cpp: "class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n\n    }\n};", java: "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n\n    }\n}" }
    },
    {
        id: 6,
        title: "Longest Palindromic Substring",
        difficulty: "medium",
        category: "Strings",
        description: "Given a string s, return the longest palindromic substring in s.",
        examples: [{ input: "s = 'babad'", output: "'bab'", explanation: "'aba' is also a valid answer." }],
        constraints: ["1 <= s.length <= 1000", "s consist of only digits and English letters."],
        tags: ["String", "Dynamic Programming"],
        testCases: [{ input: "'babad'", expected: "'bab'" }],
        starterCode: { javascript: "function longestPalindrome(s) {\n\n}", python: "def longestPalindrome(s):\n    pass", cpp: "class Solution {\npublic:\n    string longestPalindrome(string s) {\n\n    }\n};", java: "class Solution {\n    public String longestPalindrome(String s) {\n\n    }\n}" }
    },
    {
        id: 7,
        title: "Zigzag Conversion",
        difficulty: "medium",
        category: "Strings",
        description: "The string 'PAYPALISHIRING' is written in a zigzag pattern on a given number of rows. Write the code that will take a string and make this conversion given a number of rows.",
        examples: [{ input: "s = 'PAYPALISHIRING', numRows = 3", output: "'PAHNAPLSIIGYIR'", explanation: "" }],
        constraints: ["1 <= s.length <= 1000", "1 <= numRows <= 1000"],
        tags: ["String"],
        testCases: [{ input: "'PAYPALISHIRING', 3", expected: "'PAHNAPLSIIGYIR'" }],
        starterCode: { javascript: "function convert(s, numRows) {\n\n}", python: "def convert(s, numRows):\n    pass", cpp: "class Solution {\npublic:\n    string convert(string s, int numRows) {\n\n    }\n};", java: "class Solution {\n    public String convert(String s, int numRows) {\n\n    }\n}" }
    },
    {
        id: 8,
        title: "String to Integer (atoi)",
        difficulty: "medium",
        category: "Math",
        description: "Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer.",
        examples: [{ input: "s = '42'", output: "42", explanation: "The parsed integer is 42." }],
        constraints: ["0 <= s.length <= 200", "s consists of English letters, digits, space, '+', '-', and '.'."],
        tags: ["String", "Math"],
        testCases: [{ input: "'42'", expected: "42" }],
        starterCode: { javascript: "function myAtoi(s) {\n\n}", python: "def myAtoi(s):\n    pass", cpp: "class Solution {\npublic:\n    int myAtoi(string s) {\n\n    }\n};", java: "class Solution {\n    public int myAtoi(String s) {\n\n    }\n}" }
    },
    {
        id: 9,
        title: "Regular Expression Matching",
        difficulty: "hard",
        category: "Dynamic Programming",
        description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where: '.' Matches any single character. '*' Matches zero or more of the preceding element.",
        examples: [{ input: "s = 'aa', p = 'a'", output: "false", explanation: "'a' does not match the entire string 'aa'." }],
        constraints: ["1 <= s.length <= 20", "1 <= p.length <= 20"],
        tags: ["String", "Dynamic Programming", "Recursion"],
        testCases: [{ input: "'aa', 'a'", expected: "false" }],
        starterCode: { javascript: "function isMatch(s, p) {\n\n}", python: "def isMatch(s, p):\n    pass", cpp: "class Solution {\npublic:\n    bool isMatch(string s, string p) {\n\n    }\n};", java: "class Solution {\n    public boolean isMatch(String s, String p) {\n\n    }\n}" }
    },
    {
        id: 10,
        title: "Container With Most Water",
        difficulty: "medium",
        category: "Arrays",
        description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.",
        examples: [{ input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49." }],
        constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
        tags: ["Array", "Two Pointers", "Greedy"],
        testCases: [{ input: "[1,8,6,2,5,4,8,3,7]", expected: "49" }],
        starterCode: { javascript: "function maxArea(height) {\n\n}", python: "def maxArea(height):\n    pass", cpp: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n\n    }\n};", java: "class Solution {\n    public int maxArea(int[] height) {\n\n    }\n}" }
    },
    {
        id: 11,
        title: "Integer to Roman",
        difficulty: "medium",
        category: "Math",
        description: "Given an integer, convert it to a roman numeral.",
        examples: [{ input: "num = 3", output: "'III'", explanation: "3 is represented as 3 ones." }],
        constraints: ["1 <= num <= 3999"],
        tags: ["Hash Table", "Math", "String"],
        testCases: [{ input: "3", expected: "'III'" }],
        starterCode: { javascript: "function intToRoman(num) {\n\n}", python: "def intToRoman(num):\n    pass", cpp: "class Solution {\npublic:\n    string intToRoman(int num) {\n\n    }\n};", java: "class Solution {\n    public String intToRoman(int num) {\n\n    }\n}" }
    },
    {
        id: 12,
        title: "Roman to Integer",
        difficulty: "easy",
        category: "Math",
        description: "Given a roman numeral, convert it to an integer.",
        examples: [{ input: "s = 'III'", output: "3", explanation: "III = 3." }],
        constraints: ["1 <= s.length <= 15", "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')."],
        tags: ["Hash Table", "Math", "String"],
        testCases: [{ input: "'III'", expected: "3" }],
        starterCode: { javascript: "function romanToInt(s) {\n\n}", python: "def romanToInt(s):\n    pass", cpp: "class Solution {\npublic:\n    int romanToInt(string s) {\n\n    }\n};", java: "class Solution {\n    public int romanToInt(String s) {\n\n    }\n}" }
    },
    {
        id: 13,
        title: "Longest Common Prefix",
        difficulty: "easy",
        category: "Strings",
        description: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string ''.",
        examples: [{ input: "strs = ['flower','flow','flight']", output: "'fl'", explanation: "" }],
        constraints: ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200"],
        tags: ["String"],
        testCases: [{ input: "['flower','flow','flight']", expected: "'fl'" }],
        starterCode: { javascript: "function longestCommonPrefix(strs) {\n\n}", python: "def longestCommonPrefix(strs):\n    pass", cpp: "class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n\n    }\n};", java: "class Solution {\n    public String longestCommonPrefix(String[] strs) {\n\n    }\n}" }
    },
    {
        id: 14,
        title: "3Sum",
        difficulty: "medium",
        category: "Arrays",
        description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
        examples: [{ input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "The distinct triplets are [-1,0,1] and [-1,-1,2]." }],
        constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
        tags: ["Array", "Two Pointers", "Sorting"],
        testCases: [{ input: "[-1,0,1,2,-1,-4]", expected: "[[-1,-1,2],[-1,0,1]]" }],
        starterCode: { javascript: "function threeSum(nums) {\n\n}", python: "def threeSum(nums):\n    pass", cpp: "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n\n    }\n};", java: "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n\n    }\n}" }
    },
    {
        id: 15,
        title: "3Sum Closest",
        difficulty: "medium",
        category: "Arrays",
        description: "Given an integer array nums of length n and an integer target, find three integers in nums such that the sum is closest to target.",
        examples: [{ input: "nums = [-1,2,1,-4], target = 1", output: "2", explanation: "The sum that is closest to the target is 2. (-1 + 2 + 1 = 2)." }],
        constraints: ["3 <= nums.length <= 500", "-1000 <= nums[i] <= 1000"],
        tags: ["Array", "Two Pointers", "Sorting"],
        testCases: [{ input: "[-1,2,1,-4], 1", expected: "2" }],
        starterCode: { javascript: "function threeSumClosest(nums, target) {\n\n}", python: "def threeSumClosest(nums, target):\n    pass", cpp: "class Solution {\npublic:\n    int threeSumClosest(vector<int>& nums, int target) {\n\n    }\n};", java: "class Solution {\n    public int threeSumClosest(int[] nums, int target) {\n\n    }\n}" }
    },
    {
        id: 16,
        title: "Letter Combinations of a Phone Number",
        difficulty: "medium",
        category: "Backtracking",
        description: "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent.",
        examples: [{ input: "digits = '23'", output: "['ad','ae','af','bd','be','bf','cd','ce','cf']", explanation: "" }],
        constraints: ["0 <= digits.length <= 4"],
        tags: ["Hash Table", "String", "Backtracking"],
        testCases: [{ input: "'23'", expected: "['ad','ae','af','bd','be','bf','cd','ce','cf']" }],
        starterCode: { javascript: "function letterCombinations(digits) {\n\n}", python: "def letterCombinations(digits):\n    pass", cpp: "class Solution {\npublic:\n    vector<string> letterCombinations(string digits) {\n\n    }\n};", java: "class Solution {\n    public List<String> letterCombinations(String digits) {\n\n    }\n}" }
    },
    {
        id: 17,
        title: "4Sum",
        difficulty: "medium",
        category: "Arrays",
        description: "Given an array nums of n integers, return an array of all the unique quadruplets [nums[a], nums[b], nums[c], nums[d]] such that: nums[a] + nums[b] + nums[c] + nums[d] == target",
        examples: [{ input: "nums = [1,0,-1,0,-2,2], target = 0", output: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]", explanation: "" }],
        constraints: ["1 <= nums.length <= 200", "-10^9 <= nums[i] <= 10^9"],
        tags: ["Array", "Two Pointers", "Sorting"],
        testCases: [{ input: "[1,0,-1,0,-2,2], 0", expected: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]" }],
        starterCode: { javascript: "function fourSum(nums, target) {\n\n}", python: "def fourSum(nums, target):\n    pass", cpp: "class Solution {\npublic:\n    vector<vector<int>> fourSum(vector<int>& nums, int target) {\n\n    }\n};", java: "class Solution {\n    public List<List<Integer>> fourSum(int[] nums, int target) {\n\n    }\n}" }
    },
    {
        id: 18,
        title: "Remove Nth Node From End of List",
        difficulty: "medium",
        category: "Linked Lists",
        description: "Given the head of a linked list, remove the nth node from the end of the list and return its head.",
        examples: [{ input: "head = [1,2,3,4,5], n = 2", output: "[1,2,3,5]", explanation: "" }],
        constraints: ["The number of nodes in the list is sz.", "1 <= sz <= 30", "0 <= Node.val <= 100", "1 <= n <= sz"],
        tags: ["Linked List", "Two Pointers"],
        testCases: [{ input: "[1,2,3,4,5], 2", expected: "[1,2,3,5]" }],
        starterCode: { javascript: "function removeNthFromEnd(head, n) {\n\n}", python: "def removeNthFromEnd(head, n):\n    pass", cpp: "class Solution {\npublic:\n    ListNode* removeNthFromEnd(ListNode* head, int n) {\n\n    }\n};", java: "class Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n\n    }\n}" }
    },
    {
        id: 19,
        title: "Valid Parentheses",
        difficulty: "easy",
        category: "Stacks",
        description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        examples: [{ input: "s = '()'", output: "true", explanation: "" }, { input: "s = '()[]{}'", output: "true", explanation: "" }],
        constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
        tags: ["String", "Stack"],
        testCases: [{ input: "'()'", expected: "true" }, { input: "'()[]{}'", expected: "true" }],
        starterCode: { javascript: "function isValid(s) {\n\n}", python: "def isValid(s):\n    pass", cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n\n    }\n};", java: "class Solution {\n    public boolean isValid(String s) {\n\n    }\n}" }
    },
    {
        id: 20,
        title: "Merge Two Sorted Lists",
        difficulty: "easy",
        category: "Linked Lists",
        description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.",
        examples: [{ input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "" }],
        constraints: ["The number of nodes in both lists is in the range [0, 50].", "-100 <= Node.val <= 100", "Both list1 and list2 are sorted in non-decreasing order."],
        tags: ["Linked List", "Recursion"],
        testCases: [{ input: "[1,2,4], [1,3,4]", expected: "[1,1,2,3,4,4]" }],
        starterCode: { javascript: "function mergeTwoLists(list1, list2) {\n\n}", python: "def mergeTwoLists(list1, list2):\n    pass", cpp: "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n\n    }\n};", java: "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n\n    }\n}" }
    }
];

// ── Seed Data ──
const seedData = async () => {
    try {
        if (!dbConnected) return;

        const contestCount = await Contest.countDocuments();
        if (contestCount === 0) {
            console.log('Seeding initial contests...');
            await Contest.insertMany(mockContests.map(c => ({
                ...c,
                participants: [],
                problemsList: c.problemsList
            })));
        }

        const problemCount = await Problem.countDocuments();
        if (problemCount === 0) {
            console.log('Seeding initial problems...');
            await Problem.insertMany(mockProblems);
        }
    } catch (err) {
        console.error('Seeding error:', err);
    }
};

// ── Helper to format time left ──
const formatTimeLeft = (end) => {
    const now = new Date();
    const diff = new Date(end) - now;
    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

// ── Helper to format time until start ──
const formatTimeUntilStart = (start) => {
    const now = new Date();
    const diff = new Date(start) - now;
    if (diff <= 0) return "Starting soon";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

// ── Helper to handle IST to UTC conversion ──
const parseIST = (dateStr) => {
    if (!dateStr) return new Date();
    // If it already ends with Z or has timezone offset like +05:30 or -05:00
    if (dateStr.endsWith('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        return new Date(dateStr);
    }
    // Otherwise assume it's IST (UTC+5:30)
    // datetime-local gives YYYY-MM-DDTHH:mm
    let formatted = dateStr;
    if (formatted.length === 16) {
        formatted += ":00.000";
    }
    const date = new Date(formatted + "+05:30");
    return date;
};

// ── Helper to determine contest status ──
const getContestStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now >= start && now <= end) return 'active';
    if (now > end) return 'past';
    return 'upcoming';
};

// ── Routes ──

app.get('/', async (req, res) => {
    try {
        let activeContestsCount = 0;
        let totalParticipants = 0;
        let contests = [];

        if (dbConnected) {
            const allDocs = await Contest.find().sort({ startTime: -1 });

            const enriched = allDocs.map(c => {
                const status = getContestStatus(c.startTime, c.endTime);
                return {
                    ...c.toObject(),
                    id: c._id,
                    status: status,
                    timeLeft: formatTimeLeft(c.endTime),
                    timeUntilStart: formatTimeUntilStart(c.startTime),
                    participantCount: c.participants.length,
                    problems: c.problemsList.length,
                    rules: c.rules ? c.rules.slice(0, 2) : ["Standard contest rules apply."]
                };
            });

            activeContestsCount = enriched.filter(c => c.status === 'active').length;

            const stats = await Contest.aggregate([
                { $project: { count: { $size: { $ifNull: ['$participants', []] } } } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ]);
            totalParticipants = stats.length > 0 ? stats[0].total : 0;

            contests = enriched.filter(c => c.status === 'active').slice(0, 6);

            const recentProblems = await Problem.find().sort({ createdAt: -1 }).limit(6);

            res.render('index', {
                currentPath: '/',
                contests,
                recentProblems,
                activeContestsCount,
                totalParticipants
            });
        } else {
            const enriched = mockContests.map(c => ({
                ...c,
                status: getContestStatus(c.startTime, c.endTime),
                timeLeft: formatTimeLeft(c.endTime),
                timeUntilStart: formatTimeUntilStart(c.startTime),
                participantCount: c.participants.length,
                problems: c.problemsList ? c.problemsList.length : 0,
                rules: c.rules ? c.rules.slice(0, 2) : ["Standard contest rules apply."]
            }));

            activeContestsCount = enriched.filter(c => c.status === 'active').length;
            totalParticipants = mockContests.reduce((acc, c) => acc + c.participants.length, 0);
            contests = enriched.filter(c => c.status === 'active').slice(0, 6);

            res.render('index', {
                currentPath: '/',
                contests,
                recentProblems: mockProblems.slice(0, 6),
                activeContestsCount,
                totalParticipants
            });
        }
    } catch (err) {
        console.error(err);
        res.render('index', {
            currentPath: '/',
            contests: [],
            recentProblems: [],
            activeContestsCount: 0,
            totalParticipants: 0
        });
    }
});

app.get('/contests', async (req, res) => {
    try {
        let contests = [];
        let activeContestsCount = 0;
        let totalParticipants = 0;

        if (dbConnected) {
            const allContestsDocs = await Contest.find().sort({ startTime: -1 });

            // Calculate global stats with dynamic status
            activeContestsCount = allContestsDocs.filter(c => {
                const status = getContestStatus(c.startTime, c.endTime);
                return status === 'active';
            }).length;

            const stats = await Contest.aggregate([
                { $project: { count: { $size: { $ifNull: ['$participants', []] } } } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ]);
            totalParticipants = stats.length > 0 ? stats[0].total : 0;

            contests = allContestsDocs.map(c => {
                const status = getContestStatus(c.startTime, c.endTime);
                return {
                    ...c.toObject(),
                    id: c._id,
                    status: status,
                    timeLeft: formatTimeLeft(c.endTime),
                    timeUntilStart: formatTimeUntilStart(c.startTime),
                    participants: c.participants,
                    problems: c.problemsList.length,
                    rules: c.rules ? c.rules.slice(0, 2) : ["Standard contest rules apply."],
                    tags: c.tags || []
                };
            });
        } else {
            // Mock data stats with dynamic status
            activeContestsCount = mockContests.filter(c => {
                const status = getContestStatus(c.startTime, c.endTime);
                return status === 'active';
            }).length;

            totalParticipants = mockContests.reduce((acc, c) => acc + c.participants.length, 0);

            contests = mockContests.map(c => {
                const status = getContestStatus(c.startTime, c.endTime);
                return {
                    ...c,
                    status: status,
                    timeLeft: formatTimeLeft(c.endTime),
                    timeUntilStart: formatTimeUntilStart(c.startTime),
                    participants: c.participants,
                    problems: c.problemsList ? c.problemsList.length : 0,
                    rules: c.rules ? c.rules.slice(0, 2) : ["Standard contest rules apply."],
                    tags: c.tags || []
                };
            });
        }

        res.render('contests', {
            currentPath: '/contests',
            contests,
            activeContestsCount,
            totalParticipants
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading contests');
    }
});

app.get('/contest/:id', async (req, res) => {
    try {
        let contest;

        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contestDoc = await Contest.findById(req.params.id);
                if (contestDoc) {
                    contest = contestDoc.toObject();
                    contest.id = contestDoc._id;
                    contest.status = getContestStatus(contestDoc.startTime, contestDoc.endTime);
                    contest.participants = contestDoc.participants.length;
                    contest.rules = contestDoc.rules || ["Standard contest rules apply."];
                    contest.tags = contestDoc.tags || [];
                    contest.organizer = contestDoc.organizer || "CodeWith? Team";
                    contest.timeLeft = formatTimeLeft(contestDoc.endTime);
                    contest.timeUntilStart = formatTimeUntilStart(contestDoc.startTime);
                }
            }
        } else {
            contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                contest = {
                    ...contest,
                    participants: contest.participants.length,
                    status: getContestStatus(contest.startTime, contest.endTime),
                    timeLeft: formatTimeLeft(contest.endTime),
                    timeUntilStart: formatTimeUntilStart(contest.startTime)
                };
            }
        }

        if (!contest) return res.status(404).render('404', { currentPath: '' });

        res.render('contest', {
            currentPath: '/contests',
            contest
        });
    } catch (err) {
        console.error(err);
        res.status(404).render('404', { currentPath: '' });
    }
});

app.get('/contest/:id/problems', async (req, res) => {
    try {
        let contest;
        let problems = [];

        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contestDoc = await Contest.findById(req.params.id);
                if (contestDoc) {
                    const status = getContestStatus(contestDoc.startTime, contestDoc.endTime);

                    // Only allow access to problems if contest is active
                    if (status !== 'active') {
                        return res.redirect(`/contest/${req.params.id}`);
                    }

                    contest = {
                        ...contestDoc.toObject(),
                        id: contestDoc._id,
                        status: status,
                        timeLeft: formatTimeLeft(contestDoc.endTime)
                    };

                    // Get full problem details for each problem in the contest
                    for (const p of contestDoc.problemsList) {
                        if (mongoose.Types.ObjectId.isValid(p.id)) {
                            const problem = await Problem.findById(p.id);
                            if (problem) {
                                problems.push({
                                    ...problem.toObject(),
                                    points: p.points,
                                    solved: p.solved,
                                    acceptance: p.acceptance
                                });
                            }
                        }
                    }
                }
            }
        }

        // Fallback or no DB scenario
        if (!contest) {
            contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                contest.status = getContestStatus(contest.startTime, contest.endTime);
                contest.timeLeft = formatTimeLeft(contest.endTime);
                if (contest.status === 'active') {
                    problems = mockProblems;
                }
            }
        }


        if (!contest) return res.status(404).render('404', { currentPath: '' });

        // Redirect if contest is not active
        if (contest.status !== 'active') {
            return res.redirect(`/contest/${req.params.id}`);
        }

        res.render('problems-list', {
            currentPath: '/contests',
            contest,
            problems
        });
    } catch (err) {
        console.error('Error loading problems-list:', err);
        res.status(500).send('Error loading problems');
    }
});

// Redirect for /problem/ to the first problem if available
app.get('/contest/:contestId/problem/', async (req, res) => {
    try {
        if (dbConnected && mongoose.Types.ObjectId.isValid(req.params.contestId)) {
            const contest = await Contest.findById(req.params.contestId);
            if (contest && contest.problemsList && contest.problemsList.length > 0) {
                return res.redirect(`/contest/${req.params.contestId}/problem/${contest.problemsList[0].id}`);
            }
        }
        res.redirect(`/contest/${req.params.contestId}/problems`);
    } catch (err) {
        res.redirect('/contests');
    }
});

app.get('/contest/:contestId/problem/:problemId', async (req, res) => {
    try {
        let contest;
        let problem;

        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.contestId) && mongoose.Types.ObjectId.isValid(req.params.problemId)) {
                const contestDoc = await Contest.findById(req.params.contestId);
                if (contestDoc) {
                    const status = getContestStatus(contestDoc.startTime, contestDoc.endTime);

                    // Only allow access if contest is active
                    if (status !== 'active') {
                        return res.redirect(`/contest/${req.params.contestId}`);
                    }

                    contest = {
                        ...contestDoc.toObject(),
                        id: contestDoc._id,
                        status: status,
                        timeLeft: formatTimeLeft(contestDoc.endTime)
                    };

                    problem = await Problem.findById(req.params.problemId);
                }
            }

            // Fallback for mock IDs even if DB is connected
            if (!contest || !problem) {
                contest = mockContests.find(c => c.id == req.params.contestId);
                problem = mockProblems.find(p => p.id == req.params.problemId);
                if (contest) {
                    contest.status = getContestStatus(contest.startTime, contest.endTime);
                    contest.timeLeft = formatTimeLeft(contest.endTime);
                }
            }

            if (!contest || !problem) return res.status(404).render('404', { currentPath: '' });

            // Redirect if contest is not active
            if (contest.status !== 'active') {
                return res.redirect(`/contest/${req.params.contestId}`);
            }

            // Fetch all problems in this contest for the switcher
            let contestProblems = [];
            if (dbConnected) {
                for (const p of contest.problemsList) {
                    const prob = await Problem.findById(p.id);
                    if (prob) contestProblems.push(prob);
                }
            } else {
                contestProblems = mockProblems;
            }

            res.render('code', {
                currentPath: '/contests',
                contest,
                problem,
                contestProblems
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading problem');
    }
});

app.get('/api/contest/:id/members', async (req, res) => {
    try {
        let count = 0;
        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (contest) count = contest.participants.length;
            }
        } else {
            const contest = mockContests.find(c => c.id == req.params.id);
            if (contest) count = contest.participants.length;
        }

        res.json({
            participants: count,
            recentJoins: []
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/contest/:id/status', async (req, res) => {
    try {
        const { userId } = req.query;
        let joined = false;
        let contestStatus = 'unknown';

        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (contest) {
                    contestStatus = getContestStatus(contest.startTime, contest.endTime);
                    joined = contest.participants.includes(userId);
                }
            }
        } else {
            const contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                contestStatus = getContestStatus(contest.startTime, contest.endTime);
                joined = contest.participants.includes(userId);
            }
        }
        res.json({ joined, contestStatus });
    } catch (err) {
        res.status(500).json({ error: 'Check failed' });
    }
});

app.post('/api/contest/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        // Check if contest is ended before allowing join
        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (!contest) {
                    return res.status(404).json({ error: 'Contest not found' });
                }

                const status = getContestStatus(contest.startTime, contest.endTime);
                if (status === 'past') {
                    return res.json({ success: false, error: 'This contest has ended. Registration is closed.' });
                }

                const updatedContest = await Contest.findByIdAndUpdate(req.params.id, {
                    $addToSet: { participants: userId }
                }, { new: true });

                return res.json({
                    success: true,
                    participants: updatedContest.participants.length,
                    message: 'Successfully joined the contest!'
                });
            }
        } else {
            const contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                const status = getContestStatus(contest.startTime, contest.endTime);
                if (status === 'past') {
                    return res.json({ success: false, error: 'This contest has ended. Registration is closed.' });
                }
                if (!contest.participants.includes(userId)) contest.participants.push(userId);
                return res.json({
                    success: true,
                    participants: contest.participants.length,
                    message: 'Successfully joined the contest!'
                });
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Join error:', err);
        res.status(500).json({ error: 'Join failed' });
    }
});

app.post('/api/contest/:id/leave', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (!contest) {
                    return res.status(404).json({ error: 'Contest not found' });
                }

                const status = getContestStatus(contest.startTime, contest.endTime);
                if (status !== 'upcoming') {
                    return res.json({
                        success: false,
                        error: 'Cannot leave an active or ended contest'
                    });
                }

                const updatedContest = await Contest.findByIdAndUpdate(req.params.id, {
                    $pull: { participants: userId }
                }, { new: true });
                return res.json({ success: true, participants: updatedContest.participants.length });
            }
        } else {
            const contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                const status = getContestStatus(contest.startTime, contest.endTime);
                if (status !== 'upcoming') {
                    return res.json({
                        success: false,
                        error: 'Cannot leave an active or ended contest'
                    });
                }
                contest.participants = contest.participants.filter(p => p !== userId);
                return res.json({ success: true, participants: contest.participants.length });
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Leave failed' });
    }
});

app.get('/admin', async (req, res) => {
    try {
        let contests = [];
        if (dbConnected) {
            const contestDocs = await Contest.find().sort({ createdAt: -1 });
            contests = contestDocs.map(c => ({
                ...c.toObject(),
                status: getContestStatus(c.startTime, c.endTime),
                _id: c._id
            }));
        } else {
            contests = mockContests.map(c => ({
                ...c,
                status: getContestStatus(c.startTime, c.endTime),
                _id: c.id
            }));
        }
        res.render('admin', { currentPath: '/admin', contests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading admin panel');
    }
});

app.post('/admin/contest', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database not connected');

        const { title, subtitle, description, difficulty, prize, organizer, startTime, endTime, tags, rules, problemCount } = req.body;

        // Parse rules (one per line) - ensure we only take first 2 for display but store all
        const rulesArray = rules ? rules.split('\n').filter(rule => rule.trim() !== '') : [
            "Solve problems to earn points",
            "Follow the contest guidelines"
        ];

        // Parse tags
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const start = parseIST(startTime);
        const end = parseIST(endTime);

        // Randomly select problems
        const pCount = parseInt(problemCount) || 3;
        const allProblems = await Problem.find();

        // Fisher-Yates shuffle
        const shuffledProblems = [...allProblems];
        for (let i = shuffledProblems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledProblems[i], shuffledProblems[j]] = [shuffledProblems[j], shuffledProblems[i]];
        }

        // Pick the requested number (max 20)
        const selectedProblems = shuffledProblems.slice(0, Math.min(pCount, 20)).map(p => ({
            id: p._id.toString(),
            title: p.title,
            difficulty: p.difficulty,
            points: 100, // Default points
            solved: 0,
            acceptance: '0%'
        }));

        await Contest.create({
            title,
            subtitle,
            description,
            difficulty,
            prize: prize || "No prize",
            organizer: organizer || "CodeWith? Team",
            startTime: start,
            endTime: end,
            rules: rulesArray,
            tags: tagsArray,
            problemsList: selectedProblems,
            participants: []
        });

        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating contest');
    }
});

// Admin Contest Detail & Problem Management
app.get('/admin/contest/:id', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database for admin required');

        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).send('Contest not found');

        // Add dynamic status
        const contestWithStatus = {
            ...contest.toObject(),
            status: getContestStatus(contest.startTime, contest.endTime)
        };

        // Fetch all available problems
        const availableProblems = await Problem.find();

        res.render('admin-contest', {
            currentPath: '/admin',
            contest: contestWithStatus,
            availableProblems
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading contest details');
    }
});

app.post('/admin/contest/:id/problem', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database required');

        const { problemId, points } = req.body;
        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).send('Problem not found');

        await Contest.findByIdAndUpdate(req.params.id, {
            $push: {
                problemsList: {
                    id: problem._id.toString(),
                    title: problem.title,
                    difficulty: problem.difficulty,
                    points: parseInt(points) || 100,
                    solved: 0,
                    acceptance: '0%'
                }
            }
        });

        res.redirect(`/admin/contest/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding problem');
    }
});

app.post('/admin/contest/:id/remove-problem', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database required');

        const { problemId } = req.body;

        await Contest.findByIdAndUpdate(req.params.id, {
            $pull: { problemsList: { id: problemId } }
        });

        res.redirect(`/admin/contest/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error removing problem');
    }
});

app.post('/admin/contest/:id/update-rules', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database required');

        const { rules } = req.body;
        const rulesArray = rules.split('\n').filter(rule => rule.trim() !== '');

        await Contest.findByIdAndUpdate(req.params.id, {
            rules: rulesArray
        });

        res.redirect(`/admin/contest/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating rules');
    }
});

// --- Admin Problems Management ---
app.get('/admin/problems', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database for admin required');

        // Fetch all available problems
        const problems = await Problem.find().sort({ createdAt: -1 });

        res.render('admin-problems', {
            currentPath: '/admin/problems',
            problems
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading problems');
    }
});

app.post('/admin/problems', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database required');

        const { title, difficulty, category, tags, description, constraints } = req.body;

        const maxIdProblem = await Problem.findOne().sort({ id: -1 });
        const nextId = maxIdProblem ? maxIdProblem.id + 1 : 1;

        const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const constraintsArray = constraints ? constraints.split(',').map(c => c.trim()).filter(Boolean) : [];

        await Problem.create({
            id: nextId,
            title,
            difficulty,
            category,
            tags: tagsArray,
            description,
            constraints: constraintsArray,
            examples: [],
            testCases: [],
            starterCode: {
                javascript: "function solution() {\n\n}",
                python: "def solution():\n    pass",
                cpp: "class Solution {\npublic:\n    void solution() {\n\n    }\n};",
                java: "class Solution {\n    public void solution() {\n\n    }\n}"
            }
        });

        res.redirect('/admin/problems');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating problem');
    }
});

app.get('/practice', async (req, res) => {
    const categories = [
        { name: "Arrays", count: 156, icon: "📊", solved: 45 },
        { name: "Strings", count: 98, icon: "📝", solved: 23 },
        { name: "Linked Lists", count: 67, icon: "🔗", solved: 12 },
        { name: "Trees", count: 89, icon: "🌳", solved: 8 },
        { name: "Dynamic Programming", count: 124, icon: "⚡", solved: 3 },
    ];
    let problems = [];
    if (dbConnected) {
        problems = await Problem.find();
    } else {
        problems = mockProblems;
    }
    res.render('practice', { currentPath: '/practice', categories, problems });
});

// ── Compiler Integration ──
// In your main server.js (outside compiler folder)
const COMPILER_URL = process.env.COMPILER_URL ||
    'http://localhost:3001/api/compile';
app.post('/api/compiler/run', async (req, res) => {
    try {
        const { code, language, problemId } = req.body;

        let problem;
        if (mongoose.connection.readyState === 1) {
            problem = await mongoose.model('Problem').findById(problemId);
        } else {
            problem = mockProblems.find(p => p.id == problemId);
        }

        if (!problem || !problem.testCases) {
            return res.status(404).json({ error: 'Problem or test cases not found' });
        }

        const visibleCases = problem.testCases.filter(tc => !tc.isHidden);
        if (visibleCases.length === 0) {
            const response = await axios.post(COMPILER_URL, {
                code,
                language,
                input: ""
            }, {
                headers: { 'compiler-internal-key': 'secret' }
            });
            return res.json({
                success: response.data.exitCode === 0,
                results: [{
                    input: 'Standard Input',
                    expected: 'N/A',
                    output: response.data.output || 'No output',
                    status: response.data.exitCode === 0 ? 'success' : 'error',
                    error: response.data.error,
                    time: response.data.executionTime + 'ms',
                    cached: response.data.cached
                }]
            });
        }

        const results = [];
        let allPassed = true;

        for (const tc of visibleCases) {
            try {
                const response = await axios.post(COMPILER_URL, {
                    code,
                    language,
                    input: tc.input
                }, {
                    headers: { 'compiler-internal-key': 'secret' }
                });

                const actualOutput = (response.data.output || '').trim();
                const expectedOutput = (tc.expected || '').trim();
                const passed = actualOutput === expectedOutput;

                if (!passed) allPassed = false;

                results.push({
                    input: tc.input,
                    expected: tc.expected,
                    output: actualOutput,
                    status: passed ? 'pass' : 'fail',
                    error: response.data.error,
                    time: response.data.executionTime + 'ms',
                    cached: response.data.cached
                });
            } catch (tcErr) {
                allPassed = false;
                results.push({
                    input: tc.input,
                    expected: tc.expected,
                    status: 'error',
                    error: tcErr.message
                });
            }
        }

        res.json({
            success: allPassed,
            results,
            message: allPassed ? 'All sample test cases passed!' : 'Some sample test cases failed.'
        });
    } catch (err) {
        console.error("Run Error:", err.response?.data || err.message);
        res.status(err.response?.status || 500).json({
            error: (err.response?.data?.error || err.response?.data?.message) ?
                (err.response?.data?.error || err.response?.data?.message) :
                "Compiler microservice is currently unreachable.",
            details: err.response?.data || err.message,
            status: 'error'
        });
    }
});

app.post('/api/compiler/submit', async (req, res) => {
    try {
        const { code, language, problemId } = req.body;

        let problem;
        if (mongoose.connection.readyState === 1) {
            problem = await mongoose.model('Problem').findById(problemId);
        } else {
            problem = mockProblems.find(p => p.id == problemId);
        }

        if (!problem || !problem.testCases) {
            return res.status(404).json({ error: 'Problem or test cases not found' });
        }

        const results = [];
        let allPassed = true;

        for (const tc of problem.testCases) {
            try {
                const response = await axios.post(COMPILER_URL, {
                    code,
                    language,
                    input: tc.input
                }, {
                    headers: { 'compiler-internal-key': 'secret' }
                });

                const actualOutput = (response.data.output || '').trim();
                const expectedOutput = (tc.expected || '').trim();
                const passed = actualOutput === expectedOutput;

                if (!passed) allPassed = false;

                results.push({
                    input: tc.isHidden ? 'Hidden test case' : tc.input,
                    expected: tc.isHidden ? 'Hidden expected output' : tc.expected,
                    output: tc.isHidden ? (passed ? 'Execution matched hidden expected output.' : 'Execution failed against hidden parameters.') : actualOutput,
                    status: passed ? 'pass' : 'fail',
                    error: tc.isHidden ? (response.data.error ? 'Hidden error traceback.' : '') : response.data.error,
                    time: response.data.executionTime + 'ms',
                    cached: response.data.cached
                });
            } catch (tcErr) {
                allPassed = false;
                results.push({
                    input: tc.isHidden ? 'Hidden test case' : tc.input,
                    expected: tc.isHidden ? 'Hidden expected output' : tc.expected,
                    status: 'error',
                    error: tc.isHidden ? 'Hidden system error.' : tcErr.message
                });
            }
        }

        res.json({
            success: allPassed,
            results,
            message: allPassed ? 'All test cases passed!' : 'Some test cases failed.'
        });
    } catch (err) {
        console.error('Submission proxy error:', err);
        res.status(500).json({ error: 'Submission failed' });
    }
});

app.get('/problem/:id', async (req, res) => {
    try {
        let problem;
        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                problem = await Problem.findById(req.params.id);
            }
        } else {
            problem = mockProblems.find(p => p.id == req.params.id);
        }

        if (!problem) {
            // Check if it's a contest ID instead
            if (dbConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (contest && contest.problems && contest.problems.length > 0) {
                    return res.redirect(`/contest/${contest._id}/problem/${contest.problems[0]}`);
                }
            }
            return res.status(404).render('404', { currentPath: '' });
        }

        // Fetch all problems for the sidebar drawer in practice mode
        const allProblems = await Problem.find({}, 'title difficulty _id').limit(50);

        res.render('code', {
            currentPath: '/problem',
            problem: problem,
            contest: null,
            contestProblems: allProblems // Now shows all problems in the sidebar
        });
    } catch (err) {
        console.error("Error in /problem/:id:", err);
        res.status(500).render('404', { currentPath: '' });
    }
});

app.get('/settings', (req, res) => res.render('settings', { currentPath: '/settings' }));
app.get('/profile', (req, res) => res.render('profile', { currentPath: '/profile' }));
app.get('/friends', (req, res) => res.render('friends', { currentPath: '/friends' }));

app.get('/api/user/profile', (req, res) => {
    res.json({
        user: { name: "Alex Chen", username: "alexchen", stats: { solved: 247 } }
    });
});

app.use((req, res) => res.status(404).render('404', { currentPath: '' }));

app.listen(PORT, (err) => {
    if (err) console.error("Error starting server:", err);
    console.log(`CodeWith? server running on port ${PORT}`);
});