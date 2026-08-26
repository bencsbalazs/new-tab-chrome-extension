from flask import logging
from flask import Flask, request, render_template, jsonify, Response, stream_with_context
import json
from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, AIMessageChunk
from langchain_core.tools import tool
from ddgs import DDGS

app = Flask(
    __name__,
    template_folder="../",
    static_folder="../",
    static_url_path=""
)

# Initialize the LLM and the tools
llm = ChatOllama(model="qwen2.5:7b", base_url="http://localhost:11434")

import urllib.request
import urllib.parse

@tool
def duckduckgo_search_tool(query: str) -> str:
    """A search engine. Useful for when you need to answer questions about current events."""
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No good DuckDuckGo Search Result was found"
        return "\n".join([f"[{r['title']}]({r['href']})\n{r['body']}" for r in results])

@tool
def get_current_weather(location: str) -> str:
    """Gets the current weather for a specific city or location."""
    try:
        city = urllib.parse.quote(location)
        url = f"https://wttr.in/{city}?format=3"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.read().decode('utf-8').strip()
    except Exception as e:
        return f"Error fetching weather for {location}: {str(e)}"

tools = [duckduckgo_search_tool, get_current_weather]

# Create the ReAct agent
agent = create_agent(llm, tools=tools)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/prompt", methods=["POST"])
def handle_prompt():
    try:
        if request.is_json:
            data = request.get_json()
            messages_data = data.get("messages", [])
        else:
            prompt = request.form.get("prompt", "")
            logging.info(f"Received prompt: {prompt}")
            messages_data = [{"role": "user", "content": prompt}]

        # Convert simple dicts to LangChain message objects
        lc_messages = [
            SystemMessage(content="Te egy nagyon okos és segítőkész AI asszisztens vagy. Amikor a felhasználó információt kér (pl. időjárás, hírek, tények), KÖTELEZŐ használnod a megfelelő eszközt az adat lekérésére. A kapott eredményeket elemezd, és a TÉNYLEGES ADATOKAT (pl. fok, időjárás állapota, keresési eredmények tartalma) add vissza a felhasználónak magyar nyelven! SOHA ne írd azt, hogy 'ezen a linken megtalálod' vagy 'keress rá', hanem adj konkrét és pontos választ az adatok alapján.")
        ]
        for msg in messages_data:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            elif role == "system":
                lc_messages.append(SystemMessage(content=content))

        def generate():
            try:
                # Stream the agent's events using messages mode to stream tokens
                for msg_chunk, metadata in agent.stream({"messages": lc_messages}, stream_mode="messages"):
                    if metadata.get("langgraph_node") in ["agent", "model"]:
                        if isinstance(msg_chunk, AIMessageChunk):
                            if msg_chunk.content:
                                yield (json.dumps({
                                    "message": {"content": msg_chunk.content},
                                    "done": False
                                }) + "\n").encode("utf-8")
                            
                            # If tool calls are just starting in this chunk, print an indicator
                            if hasattr(msg_chunk, "tool_call_chunks") and msg_chunk.tool_call_chunks:
                                for tcc in msg_chunk.tool_call_chunks:
                                    if tcc.get("index") is not None and tcc.get("name"):
                                        # Only print when the tool call first appears (it has a name)
                                        tool_name = tcc.get("name", "tool")
                                        if tool_name == "duckduckgo_search_tool":
                                            status_text = "Webkeresés használata..."
                                            icon = "bi-globe"
                                        else:
                                            status_text = f"Eszköz használata: {tool_name}..."
                                            icon = "bi-gear-wide-connected"
                                            
                                        tool_msg = f'\n\n<div class="d-flex align-items-center my-2"><div class="badge rounded-pill shadow-sm" style="background-color: var(--panel-bg); border: 1px solid var(--accent-color); color: var(--text-color); padding: 6px 12px; font-weight: 500; font-size: 0.85rem;"><i class="bi {icon} me-2" style="color: var(--accent-color);"></i>{status_text}</div></div>\n\n'
                                        
                                        yield (json.dumps({
                                            "message": {"content": tool_msg},
                                            "done": False
                                        }) + "\n").encode("utf-8")

                # Finally, send the "done" flag
                yield (json.dumps({
                    "message": {"content": ""},
                    "done": True
                }) + "\n").encode("utf-8")

            except Exception as e:
                yield (json.dumps({
                    "error": f"Error calling agent: {str(e)}",
                    "done": True
                }) + "\n").encode("utf-8")

        return Response(stream_with_context(generate()), content_type="application/x-ndjson")

    except Exception as e:
        logging.error(f"Error initiating LLM connection: {str(e)}")
        return jsonify({
            "status": "error",
            "message": {"role": "assistant", "content": f"Error initiating LLM connection: {str(e)}"},
            "html": f"<p class='error-msg'>Error initiating LLM connection: {str(e)}</p>"
        }), 500

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

if __name__ == "__main__":
    app.run(debug=True, port=5000)
