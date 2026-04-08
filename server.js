require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Contest = require('./models/Contest');
const Problem = require('./models/Problem');
const Friendship = require('./models/Friendship');
const Activity = require('./models/Activity');

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

        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Seeding initial users...');
            const mainUser = await User.create({ username: 'alexchen', name: 'Alex Chen', email: 'alex@codewith.dev', stats: { rating: 1847, solved: 247 } });
            const dummy1 = await User.create({ username: 'sarahm', name: 'Sarah Miller', email: 'sarah@example.com', stats: { rating: 1650, solved: 189 } });
            const dummy2 = await User.create({ username: 'jordanl', name: 'Jordan Lee', email: 'jordan@example.com', stats: { rating: 1920, solved: 312 } });
            const dummy3 = await User.create({ username: 'priyas', name: 'Priya Sharma', email: 'priya@example.com', stats: { rating: 1780, solved: 256 } });
            const dummy4 = await User.create({ username: 'marcusj', name: 'Marcus Johnson', email: 'marcus@example.com', stats: { rating: 1540, solved: 143 } });
            
            // Seed a friendship and pending request
            await Friendship.create({ requester: dummy1._id, recipient: mainUser._id, status: 'accepted' });
            await Friendship.create({ requester: dummy2._id, recipient: mainUser._id, status: 'pending' });
        }

        const contestCount = await Contest.countDocuments();
        if (contestCount === 0) {
            console.log('Seeding initial contests...');
            await Contest.insertMany(mockContests.map(c => ({
                ...c,
                participants: [],
                problemsList: c.problemsList || []
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
    if (dateStr.endsWith('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        return new Date(dateStr);
    }
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

// ── API Routes ──

// Expanded Profile API
app.get('/api/user/profile', async (req, res) => {
    try {
        let user;
        if (dbConnected) {
            user = await User.findOne({ username: 'alexchen' });
        }
        
        // Fallback or Mock data
        if (!user) {
            return res.json({
                user: { username: 'guest', name: 'Guest Coder', email: 'guest@codewith.dev', stats: { rating: 1200, solved: 0 } },
                activity: [],
                achievements: [],
                heatmap: []
            });
        }

        const heatmap = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayOfWeek = d.getDay();
            let count = (dayOfWeek === 0 || dayOfWeek === 6) ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4);
            heatmap.push({ date: d.toISOString().split('T')[0], count });
        }
        res.json({
            user: { ...user.toObject(), joinedAt: user.createdAt || new Date() },
            activity: user.activity || [],
            achievements: [],
            heatmap
        });
    } catch(err) {
        console.error('Profile API error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/friends', async (req, res) => {
    try {
        let currentUser;
        if (dbConnected) {
            currentUser = await User.findOne({ username: 'alexchen' });
        }

        if (!currentUser) {
            // Return mock friends if DB/User not found
            return res.json({
                friends: [
                    { id: '1', name: 'Sarah Miller', username: 'sarahm', status: 'online', rating: 1650, solved: 189 },
                    { id: '2', name: 'Jordan Lee', username: 'jordanl', status: 'offline', rating: 1920, solved: 312 }
                ],
                onlineFriends: [{ id: '1', name: 'Sarah Miller', username: 'sarahm', status: 'online', rating: 1650, solved: 189 }],
                pendingReceived: [],
                pendingSent: [],
                suggestions: [{ id: '3', name: 'Priya Sharma', username: 'priyas', rating: 1780, solved: 256 }],
                counts: { all: 2, online: 1, pending: 0, suggestions: 1 }
            });
        }

        const friendships = await Friendship.find({
            $or: [{ requester: currentUser._id }, { recipient: currentUser._id }]
        }).populate('requester recipient');

        const allUsers = await User.find({ _id: { $ne: currentUser._id } });
        
        let friends = [];
        let pendingReceived = [];
        let pendingSent = [];
        const relatedUserIds = new Set();
        // ... same logic as before for population ...
        friendships.forEach(f => {
            if (f.status === 'accepted') {
                const friend = f.requester._id.equals(currentUser._id) ? f.recipient : f.requester;
                if (friend) {
                    friends.push({ id: friend._id, name: friend.name, username: friend.username, status: 'online', rating: friend.stats?.rating || 1200, solved: friend.stats?.solved || 0 });
                    relatedUserIds.add(friend._id.toString());
                }
            } else if (f.status === 'pending') {
                if (f.requester._id.equals(currentUser._id)) {
                    if (f.recipient) {
                        pendingSent.push({ id: f.recipient._id, name: f.recipient.name, username: f.recipient.username, rating: f.recipient.stats?.rating || 1200 });
                        relatedUserIds.add(f.recipient._id.toString());
                    }
                } else {
                    if (f.requester) {
                        pendingReceived.push({ id: f.requester._id, name: f.requester.name, username: f.requester.username, rating: f.requester.stats?.rating || 1200 });
                        relatedUserIds.add(f.requester._id.toString());
                    }
                }
            }
        });

        let suggestions = allUsers.filter(u => !relatedUserIds.has(u._id.toString())).map(u => ({
            id: u._id, name: u.name, username: u.username, rating: u.stats?.rating || 1200, solved: u.stats?.solved || 0
        }));

        res.json({
            friends, onlineFriends: friends.filter(f => f.status === 'online'), pendingReceived, pendingSent, suggestions,
            counts: { all: friends.length, online: friends.filter(f => f.status === 'online').length, pending: pendingReceived.length + pendingSent.length, suggestions: suggestions.length }
        });
    } catch(err) {
        console.error('Friends API error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/friends/request', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.create({ requester: currentUser._id, recipient: userId, status: 'pending' });
        res.json({ success: true, message: 'Friend request sent' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/friends/accept', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.findOneAndUpdate(
            { requester: userId, recipient: currentUser._id },
            { status: 'accepted' }
        );
        res.json({ success: true, message: 'Friend request accepted' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/friends/reject', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.findOneAndDelete({
            $or: [
                { requester: currentUser._id, recipient: userId },
                { requester: userId, recipient: currentUser._id }
            ]
        });
        res.json({ success: true, message: 'Request cancelled' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/friends/remove', async (req, res) => {
    try {
        if (!dbConnected) return res.status(400).json({error: 'DB disconnected'});
        const { userId } = req.body;
        const currentUser = await User.findOne({ username: 'alexchen' });
        await Friendship.findOneAndDelete({
            $or: [
                { requester: currentUser._id, recipient: userId, status: 'accepted' },
                { requester: userId, recipient: currentUser._id, status: 'accepted' }
            ]
        });
        res.json({ success: true, message: 'Friend removed' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── Page Routes ──

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

            // Fetch Recent Activity (Global)
            const globalActivity = await Activity.find()
                .sort({ timestamp: -1 })
                .limit(10)
                .populate('userId');
            
            const solvers = globalActivity.map(a => ({
                name: a.username,
                problem: a.problemTitle,
                time: formatTimeUntilStart(a.timestamp).replace('Starting soon', 'Just now'), // basic hack for "2m ago" style
                difficulty: a.difficulty
            }));

            // Fetch Popular Topics (By Problem Categories)
            const topicAgg = await Problem.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 6 }
            ]);
            const topics = topicAgg.map(t => ({
                name: t._id || "General",
                count: t.count
            }));

            // Fetch Friends for Sidebar/Dashboard
            const currentUser = await User.findOne({ username: 'alexchen' });
            let friends = [];
            if (currentUser) {
                const friendships = await Friendship.find({
                    $or: [{ requester: currentUser._id }, { recipient: currentUser._id }],
                    status: 'accepted'
                }).populate('requester recipient');
                
                friends = friendships.map(f => {
                    const friend = f.requester._id.equals(currentUser._id) ? f.recipient : f.requester;
                    return {
                        name: friend.name,
                        avatar: friend.name.split(' ').map(n => n[0]).join(''),
                        mode: 'online', // Mocked as online for now
                        desc: 'Available',
                        color: 'bg-[#515f74]'
                    };
                });
            }

            res.render('index', { 
                currentPath: '/', 
                contests, 
                recentProblems, 
                activeContestsCount, 
                totalParticipants,
                solvers: solvers.length > 0 ? solvers : null,
                topics: topics.length > 0 ? topics : null,
                friends: friends.length > 0 ? friends : null
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
            res.render('index', { currentPath: '/', contests, recentProblems: mockProblems.slice(0, 6), activeContestsCount, totalParticipants });
        }
    } catch (err) {
        console.error(err);
        res.render('index', { currentPath: '/', contests: [], recentProblems: [], activeContestsCount: 0, totalParticipants: 0 });
    }
});

app.get('/contests', async (req, res) => {
    try {
        let contests = [];
        let activeContestsCount = 0;
        let totalParticipants = 0;
        if (dbConnected) {
            const allContestsDocs = await Contest.find().sort({ startTime: -1 });
            activeContestsCount = allContestsDocs.filter(c => getContestStatus(c.startTime, c.endTime) === 'active').length;
            const stats = await Contest.aggregate([
                { $project: { count: { $size: { $ifNull: ['$participants', []] } } } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ]);
            totalParticipants = stats.length > 0 ? stats[0].total : 0;
            contests = allContestsDocs.map(c => ({
                ...c.toObject(),
                id: c._id,
                status: getContestStatus(c.startTime, c.endTime),
                timeLeft: formatTimeLeft(c.endTime),
                timeUntilStart: formatTimeUntilStart(c.startTime),
                participants: c.participants,
                problems: c.problemsList.length,
                rules: c.rules ? c.rules.slice(0, 2) : ["Standard contest rules apply."],
                tags: c.tags || []
            }));
        } else {
            activeContestsCount = mockContests.filter(c => getContestStatus(c.startTime, c.endTime) === 'active').length;
            totalParticipants = mockContests.reduce((acc, c) => acc + c.participants.length, 0);
            contests = mockContests.map(c => ({
                ...c,
                status: getContestStatus(c.startTime, c.endTime),
                timeLeft: formatTimeLeft(c.endTime),
                timeUntilStart: formatTimeUntilStart(c.startTime),
                participants: c.participants,
                problems: c.problemsList ? c.problemsList.length : 0,
                rules: c.rules ? c.rules.slice(0, 2) : ["Standard contest rules apply."],
                tags: c.tags || []
            }));
        }
        res.render('contests', { currentPath: '/contests', contests, activeContestsCount, totalParticipants });
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
        res.render('contest', { currentPath: '/contests', contest });
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
                    if (status !== 'active') return res.redirect(`/contest/${req.params.id}`);
                    contest = { ...contestDoc.toObject(), id: contestDoc._id, status, timeLeft: formatTimeLeft(contestDoc.endTime) };
                    for (const p of contestDoc.problemsList) {
                        const problem = await Problem.findById(p.id);
                        if (problem) problems.push({ ...problem.toObject(), points: p.points, solved: p.solved, acceptance: p.acceptance });
                    }
                }
            }
        }
        if (!contest) {
            contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                contest.status = getContestStatus(contest.startTime, contest.endTime);
                contest.timeLeft = formatTimeLeft(contest.endTime);
                if (contest.status === 'active') problems = mockProblems;
            }
        }
        if (!contest) return res.status(404).render('404', { currentPath: '' });
        if (contest.status !== 'active') return res.redirect(`/contest/${req.params.id}`);
        res.render('problems-list', { currentPath: '/contests', contest, problems });
    } catch (err) {
        console.error('Error loading problems-list:', err);
        res.status(500).send('Error loading problems');
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
        res.json({ participants: count, recentJoins: [] });
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
        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (!contest) return res.status(404).json({ error: 'Contest not found' });
                if (getContestStatus(contest.startTime, contest.endTime) === 'past') return res.json({ success: false, error: 'Contest has ended' });
                const updated = await Contest.findByIdAndUpdate(req.params.id, { $addToSet: { participants: userId } }, { new: true });
                return res.json({ success: true, participants: updated.participants.length });
            }
        } else {
            const contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                if (getContestStatus(contest.startTime, contest.endTime) === 'past') return res.json({ success: false, error: 'Contest has ended' });
                if (!contest.participants.includes(userId)) contest.participants.push(userId);
                return res.json({ success: true, participants: contest.participants.length });
            }
        }
    } catch (err) {
        res.status(500).json({ error: 'Join failed' });
    }
});

app.post('/api/contest/:id/leave', async (req, res) => {
    try {
        const { userId } = req.body;
        if (dbConnected) {
            if (mongoose.Types.ObjectId.isValid(req.params.id)) {
                const contest = await Contest.findById(req.params.id);
                if (getContestStatus(contest.startTime, contest.endTime) !== 'upcoming') return res.json({ success: false, error: 'Cannot leave' });
                const updated = await Contest.findByIdAndUpdate(req.params.id, { $pull: { participants: userId } }, { new: true });
                return res.json({ success: true, participants: updated.participants.length });
            }
        } else {
            const contest = mockContests.find(c => c.id == req.params.id);
            if (contest) {
                if (getContestStatus(contest.startTime, contest.endTime) !== 'upcoming') return res.json({ success: false, error: 'Cannot leave' });
                contest.participants = contest.participants.filter(p => p !== userId);
                return res.json({ success: true, participants: contest.participants.length });
            }
        }
    } catch (err) {
        res.status(500).json({ error: 'Leave failed' });
    }
});

app.get('/practice', async (req, res) => {
    try {
        let categories = [
            { name: "Arrays", count: 0, icon: "📊", solved: 0 },
            { name: "Strings", count: 0, icon: "📝", solved: 0 },
            { name: "Math", count: 0, icon: "🔢", solved: 0 },
            { name: "DP", count: 0, icon: "⚡", solved: 0 },
        ];
        let problems = mockProblems;
        let stats = { solved: 0, streak: 0, submissions: 0, time: '0h' };

        if (dbConnected) {
            const user = await User.findOne({ username: 'alexchen' });
            if (user) {
                stats.solved = user.stats.solved || 0;
                stats.streak = user.stats.streak || 0;
                stats.submissions = user.activity ? user.activity.length : 0;
            }

            // Aggregate dynamic categories from DB
            const agg = await Problem.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]);
            
            const icons = {
                "Arrays": "📊", "Strings": "📝", "Linked Lists": "🔗", "Trees": "🌳", 
                "DP": "⚡", "Dynamic Programming": "⚡", "Math": "🔢", "Stacks": "📚", "Queues": "⏳"
            };

            if (agg.length > 0) {
                categories = agg.map(a => ({
                    name: a._id || "General",
                    count: a.count,
                    icon: icons[a._id] || "🧩",
                    solved: 0 // In a full implementation, we'd join with user submissions
                }));
            }
            problems = await Problem.find().sort({ createdAt: -1 });
        }
        
        const totalProblems = problems.length;
        
        res.render('practice', { 
            currentPath: '/practice', 
            categories, 
            problems, 
            totalProblems, 
            totalSolved: stats.solved,
            userStats: stats
        });
    } catch (err) {
        console.error(err);
        res.render('practice', { currentPath: '/practice', categories: [], problems: [], totalProblems: 0, totalSolved: 0, userStats: { solved: 0, streak: 0, submissions: 0, time: '0h' } });
    }
});

const COMPILER_URL = process.env.COMPILER_URL || 'http://localhost:3001/api/compile';

app.post('/api/compiler/run', async (req, res) => {
    try {
        const { code, language, problemId } = req.body;
        let problem = dbConnected ? await Problem.findById(problemId) : mockProblems.find(p => p.id == problemId);
        if (!problem) return res.status(404).json({ error: 'Problem not found' });
        const visibleCases = problem.testCases.filter(tc => !tc.isHidden);
        const results = [];
        let allPassed = true;
        for (const tc of visibleCases) {
            const resp = await axios.post(COMPILER_URL, { code, language, input: tc.input }, { headers: { 'compiler-internal-key': 'secret' } });
            const passed = (resp.data.output || '').trim() === (tc.expected || '').trim();
            if (!passed) allPassed = false;
            results.push({ input: tc.input, expected: tc.expected, output: resp.data.output, status: passed ? 'pass' : 'fail', time: resp.data.executionTime + 'ms' });
        }
        res.json({ success: allPassed, results });
    } catch (err) {
        res.status(500).json({ error: 'Compiler error' });
    }
});

app.post('/api/compiler/submit', async (req, res) => {
    try {
        const { code, language, problemId } = req.body;
        let problem = dbConnected ? await Problem.findById(problemId) : mockProblems.find(p => p.id == problemId);
        if (!problem) return res.status(404).json({ error: 'Problem not found' });
        
        // In real submit, we check ALL test cases including hidden ones
        const allCases = problem.testCases;
        const results = [];
        let allPassed = true;
        
        for (const tc of allCases) {
            try {
                const resp = await axios.post(COMPILER_URL, { code, language, input: tc.input }, { headers: { 'compiler-internal-key': 'secret' } });
                const actualOutput = (resp.data.output || '').trim();
                const expectedOutput = (tc.expected || '').trim();
                const passed = actualOutput === expectedOutput;
                
                if (!passed) allPassed = false;
                
                results.push({ 
                    input: tc.isHidden ? 'Hidden' : tc.input, 
                    expected: tc.isHidden ? 'Hidden' : tc.expected, 
                    output: tc.isHidden ? (passed ? 'Correct' : 'Incorrect') : resp.data.output, 
                    status: passed ? 'pass' : 'fail', 
                    time: resp.data.executionTime + 'ms',
                    isHidden: tc.isHidden
                });
            } catch (compilerErr) {
                allPassed = false;
                results.push({ status: 'error', error: 'Execution failed' });
            }
        }

        if (allPassed && dbConnected) {
            const user = await User.findOne({ username: 'alexchen' });
            if (user) {
                // Prevent duplicate activity for same problem if you want, but here we just record
                await Activity.create({
                    userId: user._id,
                    username: user.username,
                    type: 'solved',
                    problemId: problem._id,
                    problemTitle: problem.title,
                    difficulty: problem.difficulty
                });
                
                // Update user stats
                await User.findByIdAndUpdate(user._id, { 
                    $inc: { 'stats.solved': 1 }, 
                    $push: { activity: { title: `Solved ${problem.title}` } } 
                });
            }
        }

        res.json({ success: allPassed, results });
    } catch (err) {
        console.error('Submit API error:', err);
        res.status(500).json({ error: 'Global submission error' });
    }
});

app.get('/problem/:id', async (req, res) => {
    try {
        let problem = dbConnected ? await Problem.findById(req.params.id) : mockProblems.find(p => p.id == req.params.id);
        if (!problem) return res.status(404).render('404', { currentPath: '' });
        const allProblems = dbConnected ? await Problem.find().limit(50) : mockProblems;
        res.render('code', { currentPath: '/problem', problem, contest: null, contestProblems: allProblems });
    } catch (err) {
        res.status(500).render('404', { currentPath: '' });
    }
});

// Admin routes
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

        // Final Registry Assembly (Strict Order: Active > Upcoming > Past)
        const activeList = contests.filter(c => c.status === 'active').sort((a,b) => new Date(b.startTime) - new Date(a.startTime));
        const upcomingList = contests.filter(c => c.status === 'upcoming').sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
        const pastList = contests.filter(c => c.status === 'past').sort((a,b) => new Date(b.startTime) - new Date(a.startTime));
        
        const finalizedContests = [...activeList, ...upcomingList, ...pastList];

        res.render('admin', { currentPath: '/admin', contests: finalizedContests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading admin panel');
    }
});

app.post('/admin/contest', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database not connected');
        const { title, subtitle, description, prize, organizer, startTime, endTime, tags, rules, problemCount } = req.body;
        
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        const rulesArray = rules ? rules.split('\n').filter(rule => rule.trim() !== '') : ["Solve all problems", "No plagiarism"];
        
        const start = parseIST(startTime);
        const end = parseIST(endTime);
        const pCount = parseInt(problemCount) || 3;
        const difficulty = req.body.difficulty || 'medium'; // Default if missing
        const allProblems = await Problem.find();
        
        const shuffledProblems = [...allProblems].sort(() => 0.5 - Math.random());
        const selectedProblems = shuffledProblems.slice(0, Math.min(pCount, 20)).map(p => ({
            id: p._id.toString(),
            title: p.title,
            difficulty: p.difficulty,
            points: 100,
            solved: 0,
            acceptance: '0%'
        }));

        await Contest.create({
            title, subtitle, description, difficulty,
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

app.get('/admin/contest/:id', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database required');
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).send('Contest not found');
        const availableProblems = await Problem.find();
        res.render('admin-contest', {
            currentPath: '/admin',
            contest: { ...contest.toObject(), status: getContestStatus(contest.startTime, contest.endTime) },
            availableProblems
        });
    } catch (err) {
        res.status(500).send('Error loading contest details');
    }
});

app.post('/admin/contest/:id/problem', async (req, res) => {
    try {
        const { problemId, points } = req.body;
        const problem = await Problem.findById(problemId);
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
        res.status(500).send('Error adding problem');
    }
});

app.post('/admin/contest/:id/remove-problem', async (req, res) => {
    try {
        const { problemId } = req.body;
        await Contest.findByIdAndUpdate(req.params.id, { $pull: { problemsList: { id: problemId } } });
        res.redirect(`/admin/contest/${req.params.id}`);
    } catch (err) {
        res.status(500).send('Error removing problem');
    }
});

app.post('/admin/contest/:id/delete', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).json({ error: 'DB disconnected' });
        await Contest.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Deletion failed' });
    }
});

app.get('/admin/problems', async (req, res) => {
    try {
        const problems = dbConnected ? await Problem.find().sort({ createdAt: -1 }) : mockProblems;
        res.render('admin-problems', { currentPath: '/admin/problems', problems });
    } catch (err) {
        res.status(500).send('Error loading problems');
    }
});

app.post('/admin/problems', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).send('Database required');
        const { title, difficulty, category, tags, description, constraints } = req.body;
        const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const constraintsArray = constraints ? constraints.split(',').map(c => c.trim()).filter(Boolean) : [];
        await Problem.create({ title, difficulty, category, tags: tagsArray, description, constraints: constraintsArray });
        res.redirect('/admin/problems');
    } catch (err) {
        res.status(500).send('Error creating problem');
    }
});

app.post('/admin/problem/:id/delete', async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).json({ error: 'DB disconnected' });
        await Problem.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Deletion failed' });
    }
});

app.get('/settings', (req, res) => res.render('settings', { currentPath: '/settings' }));
app.get('/profile', (req, res) => res.render('profile', { currentPath: '/profile' }));
app.get('/friends', (req, res) => res.render('friends', { currentPath: '/friends' }));

app.use((req, res) => res.status(404).render('404', { currentPath: '' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));