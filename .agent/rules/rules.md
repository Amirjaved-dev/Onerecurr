---
trigger: always_on
---

One Recurr: The Rules of Engagement

This document outlines the core principles, strategic decisions, and technical guidelines for the One Recurr project. It is the source of truth for why we are making certain choices. Adherence to these rules is critical for success within the tight hackathon timeline.




1. Core Philosophy: Architect, Not Artisan

•
Your Role is Decisive, Not Technical: You are the project architect and the AI conductor. Your primary job is to make strategic decisions, direct your AI assistants with precise prompts, and validate the output. Do not waste time writing boilerplate code or manually debugging simple errors. Your time is the most valuable resource; allocate it to high-level thinking, not low-level implementation.

•
Embrace AI as Your Leverage: Claude and Cursor are your force multipliers. Trust the process: Prompt -> Generate -> Review -> Test -> Debug. The quality of your prompts will determine the quality of your output. Be specific, be clear, and provide context.

•
Speed Over Perfection: This is a hackathon, not a production deployment. We are building a demonstration of innovation, not a flawless, enterprise-grade application. A working demo with a compelling story is infinitely more valuable than a perfect but incomplete project. Do not get bogged down in minor refactoring or edge-case handling.

2. Strategic Mandates: The Path to Victory

•
Primary Objective: Win the Yellow Network Prize ($15,000). All major architectural decisions must serve this goal. The project narrative is "Session-Based, Gasless Micro-transactions." Every feature must reinforce this story. The combination of EIP-7702 and Yellow's state channels is our unique selling proposition.

•
Secondary Objective: Win the Uniswap Foundation Prize ($10,000). The "Agentic Paymaster" concept is our entry here. This is a high-impact feature that demonstrates deep technical understanding, but it is secondary. If time is short, this is the feature to simplify, not the Yellow integration.

•
Non-Negotiable Technologies: EIP-7702 and ERC-4337 (via a Paymaster) are the heart of this project. They are not optional. They are the innovation we are selling to the judges.

3. Technical Stack & Justification

This stack is chosen for speed, reliability, and alignment with modern Web3 development practices.

Component
Technology
Justification
Smart Contracts
Solidity ^0.8.20
The industry standard. We use a specific, stable version to avoid unexpected breaking changes.
Development Env
Hardhat
Provides a robust environment for compiling, testing, and deploying contracts. Superior to Truffle for this use case.
Frontend
Vite + React + TypeScript
Vite offers near-instant hot-reloading, which is critical for rapid UI development. React is the standard, and TypeScript prevents common JavaScript errors.
Styling
Tailwind CSS
Allows for building a polished, modern UI extremely quickly without writing custom CSS files. Perfect for hackathons.
Blockchain Lib
Ethers.js v6
The modern, lightweight, and widely-supported library for interacting with the Ethereum blockchain.
Paymaster Service
Pimlico
CRITICAL RULE: We will use a managed Paymaster service. Building our own is a time-wasting trap. Pimlico is reliable, has a free tier, and provides excellent developer tools. This choice saves us 2-3 days of work.
State Channels
Yellow Network SDK
This is the core of our primary prize strategy. We must use their SDK.
AI Assistants
Claude / Cursor
Our primary coding engines. They will write at least 80% of the code.
Deployment
Vercel (Frontend), Sepolia (Contracts)
Vercel offers seamless, one-click deployment from a Git repository. Sepolia is the standard, stable Ethereum testnet.




4. The Debugging Protocol

Errors are not roadblocks; they are signposts. Follow this protocol without exception.

1.
Read the Error: Read the full error message carefully. Don't just skim it.

2.
Isolate the Cause: Identify the specific line of code or user action that triggered the error.

3.
Use the Universal Debugger Prompt: Copy the full error message and the relevant code into the Universal Debugger Prompt from the PROMPT_LIBRARY.md.

4.
Feed it to Your AI: Give the prompt to Claude/Cursor.

5.
Analyze the Suggestion: The AI will explain the error and provide a fix. Read the explanation to understand the why behind the fix. This is how you learn.

6.
Implement and Test: Apply the corrected code and re-run the test. If it fails again, repeat the process, adding the new error message to the prompt.

DO NOT spend more than 15 minutes trying to manually fix a bug before escalating it to your AI assistant. Your time is too valuable.
´´´

