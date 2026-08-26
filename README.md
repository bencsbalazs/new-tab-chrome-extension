# AI-Powered Bookmark New Tab Extension

## Overview

This project is a modern, AI-enhanced Chrome extension that replaces your default "New Tab" page. It provides a beautiful, organized view of your bookmarks (with automatic categorization and nested folder support) and features an integrated local AI assistant.

The AI assistant runs entirely locally using **Ollama** and a **Flask backend**. It is equipped with real-time tools, allowing it to search the web (via DuckDuckGo) and fetch current weather data, providing direct, factual answers right in your browser tab.

## Features

- **Custom New Tab Page**: Replaces the default Chrome new tab page with a sleek, customizable UI.
- **Smart Bookmark Organization**: Automatically categorizes bookmarks with appropriate icons based on keyword matching.
- **Tab Groups**: Quickly open predefined sets of links (like Messengers or Learning platforms) into organized Chrome Tab Groups.
- **Local AI Assistant (Qwen)**: Chat with a powerful local LLM right from your new tab. The UI supports streaming responses and markdown rendering.
- **Tool Calling**: The AI can autonomously perform web searches and check the weather using real-time APIs to give you up-to-date factual answers. Tool usage is displayed natively in the chat UI. 
  > **Note:** The weather and search tools serve as a foundational example of what the AI can do. This is a highly extensible platform, and more tools and exciting developments are coming soon!
- **Themes**: Switch instantly between Light, Dark, Chrome, and Glass themes.

## Architecture

The project consists of two main parts:
1. **Chrome Extension (Frontend)**: Vanilla HTML/JS/CSS extension that interacts with Chrome APIs (`bookmarks`, `tabs`, `tabGroups`).
2. **Local Python Backend (LLM)**: A Flask server (`llm/app.py`) that acts as a bridge between the extension and the local Ollama instance. It uses LangChain's ReAct agent framework to orchestrate tool usage.

## Prerequisites

- [Google Chrome](https://www.google.com/chrome/)
- [Python 3.10+](https://www.python.org/downloads/)
- [Ollama](https://ollama.com/)

## Installation & Setup

### 1. Set up the Local LLM (Ollama)

First, make sure Ollama is installed and running on your system.
Pull the required model (the app uses `qwen2.5:7b` by default):
```bash
ollama run qwen2.5:7b
```
*(You can leave it running, or just let the Ollama daemon run in the background).*

### 2. Set up the Python Backend

Navigate to the `llm` directory and install the required Python packages:

```bash
cd llm
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

Start the Flask server:
```bash
python app.py
```
The server will start running on `http://localhost:5000`. Leave this terminal open.

### 3. Install the Chrome Extension

1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click on **Load unpacked**.
4. Select the root folder of this project (`bookmarks_chrome_extension` - the folder containing `manifest.json`).

## Usage

1. Open a new tab in Chrome. You will see your new AI-powered start page.
2. Your Chrome bookmarks will be automatically loaded and categorized in the center of the screen.
3. To talk to the AI, click the **AI Asszisztens** button in the top right (or expand the sidebar).
4. Try asking complex questions that require real-time data, for example:
   - *"Tell me the current weather in Tallinn"* (The AI will use the `get_current_weather` tool)
   - *"Mi a legfrissebb hír a technológia világában?"* (The AI will use the `duckduckgo_search_tool` tool)

## Customization & Configuration

If you want to use a different Ollama model or point to a remote server, you can change the API settings directly in the extension:
1. Open the Chat sidebar.
2. Click on the model name dropdown at the top (e.g., `Qwen 2.5 (7B)`).
3. Select **Beállítások...** (Settings).
4. Update the Prompt API URL (default is `http://localhost:5000/prompt`) and Model Name as needed.
