from flask import Flask, render_template, request, jsonify, send_from_directory
from pymongo import MongoClient
from langchain_core.messages import HumanMessage, BaseMessage, AIMessage
from langchain.chat_models import init_chat_model
from datetime import datetime
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from typing import Sequence
from typing_extensions import Annotated, TypedDict
import os
from flask_cors import CORS

# ----- Flask setup -----
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

# ----- MongoDB Setup -----
client = MongoClient('mongodb://localhost:27017/')
db = client['GerChatBot']
chat_collection = db['Chats']

# ----- LangGraph initialization -----
os.environ["GROQ_API_KEY"] = "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"

model = init_chat_model("llama3-8b-8192", model_provider="groq")
prompt_template = ChatPromptTemplate.from_messages([
    ("system",
     "Du bist ein hilfreicher KI-Assistent und antwortest immer nur auf Deutsch Der Benutzer kann die Frage in jeder Sprache stellen, aber Sie werden immer auf Deutsch antworten. Und wenn Sie etwas in Punkten beantworten, achten Sie darauf, dass jeder Punkt in einer neuen Zeile steht."),
    MessagesPlaceholder(variable_name="messages")
])

class State(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

workflow = StateGraph(state_schema=State)

def call_model(state: State):
    prompt = prompt_template.invoke({"messages": state["messages"]})
    response = model.invoke(prompt)
    return {"messages": [response]}

workflow.add_node("model", call_model)
workflow.add_edge(START, "model")
memory = MemorySaver()
langgraph_app = workflow.compile(checkpointer=memory)

# ----- MongoDB helper functions -----
def save_message(session_id, message, sender):
    chat_collection.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": {"sender": sender, "content": message, "timestamp": datetime.utcnow()}},
            "$set": {"last_updated": datetime.utcnow()}
        },
        upsert=True
    )

def get_sessions():
    sessions = chat_collection.find({}, {"session_id": 1, "last_updated": 1, "_id": 0}).sort("last_updated", -1)
    return [{"session_id": doc['session_id'], "last_updated": doc['last_updated'].strftime("%Y-%m-%d %H:%M:%S")} for doc in sessions]

def get_messages_for_session(session_id):
    chat = chat_collection.find_one({"session_id": session_id}, {"_id": 0, "messages": 1})
    return chat.get("messages", []) if chat else []

def generate_bot_response(session_id, user_input):
    # Get previous messages
    previous_messages = get_messages_for_session(session_id)
    
    # Convert to LangChain message format
    history = []
    for msg in previous_messages:
        content = msg.get('content') or msg.get('messages')
        if content:
            if msg['sender'] == 'user':
                history.append(HumanMessage(content=content))
            else:
                history.append(AIMessage(content=content))
    
    # Add current message
    history.append(HumanMessage(content=user_input))
    
    # Generate response
    state = {'messages': history}
    response = langgraph_app.invoke(
        state,
        config={"configurable": {"thread_id": session_id}}
    )
    answer = response['messages'][-1].content if response['messages'] else "No response"
    formatted_answer = answer.replace("\u2022", "\n•")
    
    return formatted_answer

# ----- Flask routes -----

# Serve the React app
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

# Serve static files (JS, CSS, etc.)
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

# API route to get all sessions
@app.route("/api/sessions", methods=['GET'])
def get_all_sessions():
    sessions = get_sessions()
    return jsonify(sessions)

# API route to create a new session
@app.route("/api/sessions", methods=['POST'])
def create_session():
    data = request.json
    session_id = data.get('session_id', f"{datetime.utcnow()}")
    
    # Create an empty session
    chat_collection.insert_one({
        "session_id": session_id,
        "messages": [],
        "last_updated": datetime.utcnow()
    })
    
    return jsonify({"session_id": session_id, "status": "created"})

# API route to get messages for a session
@app.route("/api/sessions/<session_id>/messages", methods=['GET'])
def get_session_messages(session_id):
    messages = get_messages_for_session(session_id)
    return jsonify(messages)

# API route to send a message and get a response
@app.route("/api/sessions/<session_id>/messages", methods=['POST'])
def send_message(session_id):
    data = request.json
    user_input = data.get('message')
    
    if not user_input:
        return jsonify({'error': 'No message provided'}), 400
    
    # Save user message
    save_message(session_id, user_input, 'user')
    
    # Generate bot response
    bot_response = generate_bot_response(session_id, user_input)
    
    # Save bot response
    save_message(session_id, bot_response, 'bot')
    
    return jsonify({
        'user_message': user_input,
        'bot_response': bot_response
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
