from flask import Flask, request, jsonify, session
from flask_cors import CORS
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain import hub
from langgraph.graph import START, StateGraph
from typing import List, Dict
import os
import logging
from PyPDF2 import PdfReader
import requests
import razorpay
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pymongo import MongoClient
import re
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = "super_secret_key"  # For session management
CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO)

# Environment variables
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ORS_API_KEY = os.getenv("ORS_API_KEY")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET")
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
MONGO_URI = os.getenv("MONGO_URI")

# Set environment variables
os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# Constants
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://shimalakmald23aim:shimal007@visitorsdata.aw8yfkt.mongodb.net/")
MUSEUM_COORDINATES = {"lon": 80.2574, "lat": 13.0674}
TICKET_PRICE_INR = 50

# Initialize MongoDB client - This is lightweight
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["museum_db"]
bookings_collection = db["bookings"]

# Initialize Razorpay client - This is lightweight
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))

# Initialize LLM - This is lightweight
llm = ChatGroq(model="llama3-8b-8192")

# Lazy-loaded components
_embeddings = None
_vector_store = None
_graph = None

# Session storage
user_sessions = {}
pending_payments = {}

def load_texts(text_folder: str):
    documents = []
    for filename in os.listdir(text_folder):
        file_path = os.path.join(text_folder, filename)
        if filename.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as file:
                text = file.read()
                documents.append(Document(page_content=text, metadata={"source": filename}))
        elif filename.endswith(".pdf"):
            pdf_reader = PdfReader(file_path)
            text = "".join(page.extract_text() for page in pdf_reader.pages if page.extract_text())
            documents.append(Document(page_content=text, metadata={"source": filename}))
    return documents

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        logging.info("Initializing embeddings model...")
        # Use a smaller model to reduce memory usage
        _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embeddings

def get_vector_store():
    global _vector_store
    if _vector_store is None:
        logging.info("Initializing vector store...")
        _vector_store = Chroma(embedding_function=get_embeddings())
        
        # Load documents on demand
        text_folder = os.path.join(os.path.dirname(__file__), "data")
        docs = load_texts(text_folder)
        logging.info(f"Loaded {len(docs)} documents from {text_folder}.")
        
        # Use smaller chunks to reduce memory usage
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        all_splits = text_splitter.split_documents(docs)
        
        # Add documents in smaller batches to reduce peak memory usage
        batch_size = 10  # Adjust based on memory constraints
        for i in range(0, len(all_splits), batch_size):
            batch = all_splits[i:i+batch_size]
            _vector_store.add_documents(documents=batch)
            logging.info(f"Added batch {i//batch_size + 1}/{(len(all_splits)-1)//batch_size + 1} to vector store")
            
    return _vector_store

def get_rag_graph():
    global _graph
    if _graph is None:
        logging.info("Initializing RAG graph...")
        # Define state class
        class State(Dict):
            question: str
            context: List[Document]
            answer: str
        
        # Define retrieve function
        def retrieve(state: State):
            retrieved_docs = get_vector_store().similarity_search(state["question"])
            return {"context": retrieved_docs}
        
        # Define generate function
        def generate(state: State):
            docs_content = "\n\n".join(doc.page_content for doc in state["context"])
            # Get the RAG prompt
            prompt = hub.pull("rlm/rag-prompt")
            messages = prompt.invoke({"question": state["question"], "context": docs_content})
            response = llm.invoke(messages)
            return {"answer": response.content}
        
        # Build graph
        graph_builder = StateGraph(State).add_sequence([retrieve, generate])
        graph_builder.add_edge(START, "retrieve")
        _graph = graph_builder.compile()
    
    return _graph

# Utility functions
def send_confirmation_email(email, name, tickets, date, payment_id, amount_inr):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USERNAME
        msg["To"] = email
        msg["Subject"] = "Museum Ticket Booking Confirmation"
        body = f"""
        Dear {name},
        Thank you for your payment! Your booking is confirmed for {tickets} tickets on {date}.
        Total Amount: ₹{amount_inr}
        Payment ID: {payment_id}
        Please bring this email or the payment ID on the day of your visit.
        Regards,
        Museum Team
        """
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USERNAME, email, msg.as_string())
        logging.info(f"Confirmation email sent to {email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send confirmation email: {str(e)}")
        return False

def geocode_location(location, api_key):
    url = f"https://api.openrouteservice.org/geocode/search?api_key={api_key}&text={location}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data['features']:
            coordinates = data['features'][0]['geometry']['coordinates']  # [lon, lat]
            return coordinates
    return None

def calculate_distance(start_lon, start_lat, end_lon, end_lat, api_key):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {"Authorization": api_key}
    body = {
        "coordinates": [[start_lon, start_lat], [end_lon, end_lat]],
        "units": "km"
    }
    response = requests.post(url, json=body, headers=headers)
    if response.status_code == 200:
        data = response.json()
        distance = data['routes'][0]['summary']['distance']  # Distance in kilometers
        return distance
    return None

# Routes
@app.route('/')
def home():
    return "Welcome to the Museum Ticket Booking Chatbot!"

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        if not data or "question" not in data:
            return jsonify({"error": "Invalid request. Missing 'question' parameter."}), 400
        
        question = data["question"].strip().lower()
        session_id = request.remote_addr
        
        # Check if this is a location/distance query
        location = None
        if "i'm near " in question or "im near " in question or "i am near " in question:
            for prefix in ["i'm near ", "im near ", "i am near "]:
                if prefix in question:
                    location = question.split(prefix)[1].strip().split("?")[0].split(".")[0].strip()
                    break
        elif "coming from " in question:
            location = question.split("coming from ")[1].strip().split("?")[0].split(".")[0].strip()
        
        if location:
            start_coords = geocode_location(location, ORS_API_KEY)
            if start_coords:
                start_lon, start_lat = start_coords
                end_lon, end_lat = MUSEUM_COORDINATES["lon"], MUSEUM_COORDINATES["lat"]
                distance = calculate_distance(start_lon, start_lat, end_lon, end_lat, ORS_API_KEY)
                if distance:
                    return jsonify({
                        "answer": f"The driving distance from {location.title()} to the museum is approximately {distance:.2f} km."
                    })
                else:
                    return jsonify({"answer": "Sorry, I couldn't calculate the distance."})
            else:
                return jsonify({"answer": f"Could not find the location '{location}'. Please provide a valid place."})
        
        distance_keywords = ["distance", "how far", "far is", "near", "close", "nearby"]
        is_distance_query = any(keyword in question for keyword in distance_keywords)
        
        if is_distance_query:
            return jsonify({
                "answer": "To calculate the distance to the museum, please provide your location like this: 'I'm near Central Park' or 'I'm coming from Brooklyn'."
            })
        
        # Check if this is a ticket booking query
        if "book ticket" in question:
            user_sessions[session_id] = {"step": "collect_details"}
            return jsonify({"answer": f"Provide Name, Email, Phone Number, Tickets, and Date (YYYY-MM-DD), separated by commas (e.g., Sanjay, sanjay@example.com, +919876543210, 4, 2025-03-01). Ticket price is ₹{TICKET_PRICE_INR} per ticket."})

        # Handle ongoing booking session
        if session_id in user_sessions:
            session = user_sessions[session_id]

            if session.get("step") == "collect_details":
                details = question.split(",")
                if len(details) != 5:
                    return jsonify({"answer": "Invalid format. Provide: Name, Email, Phone Number, Tickets, Date (YYYY-MM-DD)."})
                name, email, phone_number, tickets, date = map(str.strip, details)

                phone_pattern = re.compile(r"^\+91\d{10}$")
                if not phone_pattern.match(phone_number):
                    return jsonify({"answer": "Invalid phone number format. Please provide a valid phone number starting with +91 followed by 10 digits (e.g., +919876543210)."})

                # Validate email format
                email_pattern = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
                if not email_pattern.match(email):
                    return jsonify({"answer": "Invalid email format. Please provide a valid email address."})

                # Validate tickets (must be a positive integer)
                if not tickets.isdigit() or int(tickets) <= 0:
                    return jsonify({"answer": "Invalid number of tickets. Please provide a positive integer."})

                # Validate date format (YYYY-MM-DD)
                date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
                if not date_pattern.match(date):
                    return jsonify({"answer": "Invalid date format. Please provide the date in YYYY-MM-DD format (e.g., 2025-03-01)."})

                # Calculate amount in INR
                amount_inr = int(tickets) * TICKET_PRICE_INR  # Amount in INR
                amount_paise = amount_inr * 100  # Convert to paise for Razorpay

                session.update({
                    "name": name,
                    "email": email,
                    "phone_number": phone_number,
                    "tickets": tickets,
                    "date": date,
                    "amount_inr": amount_inr,  # Store amount in INR
                    "amount_paise": amount_paise,  # Store amount in paise for Razorpay
                    "step": "confirm"
                })
                return jsonify({"answer": f"Confirm {tickets} tickets on {date} for {name} ({email}, {phone_number})? Total amount: ₹{amount_inr}. Type 'yes' to proceed."})

            elif session.get("step") == "confirm" and question == "yes":
                payment_link = client.payment_link.create({
                    "amount": session["amount_paise"],  # Pass amount in paise to Razorpay
                    "currency": "INR",
                    "accept_partial": False,
                    "description": "Museum Ticket Booking",
                    "customer": {
                        "name": session["name"],
                        "email": session["email"],
                        "contact": session["phone_number"]
                    },
                    "notify": {"sms": True, "email": True},
                    "reminder_enable": True,
                    "callback_url": request.url_root + "payment-callback",
                    "callback_method": "get"
                })
                payment_id = payment_link['id']
                payment_url = payment_link['short_url']
                pending_payments[payment_id] = {
                    "name": session["name"],
                    "email": session["email"],
                    "phone_number": session["phone_number"],
                    "tickets": session["tickets"],
                    "date": session["date"],
                    "amount_inr": session["amount_inr"],  # Store amount in INR
                    "amount_paise": session["amount_paise"],  # Store amount in paise for reference
                    "status": "pending"
                }
                del user_sessions[session_id]
                return jsonify({
                    "answer": f"Please complete your payment of ₹{session['amount_inr']} by clicking <a href='{payment_url}' target='_blank'>here</a>. You will receive a confirmation email once payment is successful."
                })

        # Use RAG for general questions - Only initialize components when needed
        response = get_rag_graph().invoke({"question": question})
        return jsonify({"answer": response["answer"]})

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Payment Callback Endpoint
@app.route('/payment-callback', methods=['GET', 'POST'])
def payment_callback():
    try:
        payment_id = request.args.get('razorpay_payment_link_id')
        payment_status = request.args.get('razorpay_payment_link_status')
        
        if payment_status == 'paid' and payment_id in pending_payments:
            booking = pending_payments[payment_id]
            
            # Send confirmation email
            send_confirmation_email(
                booking["email"],
                booking["name"],
                booking["tickets"],
                booking["date"],
                payment_id,
                booking["amount_inr"]  # Pass amount in INR for the email
            )
            
            # Store booking details in MongoDB
            booking_data = {
                "payment_id": payment_id,
                "name": booking["name"],
                "email": booking["email"],
                "phone_number": booking["phone_number"],
                "tickets": int(booking["tickets"]),
                "date": booking["date"],
                "amount": booking["amount_inr"],  # Store amount in INR
                "status": "completed",
                "payment_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # Store actual timestamp
            }
            bookings_collection.insert_one(booking_data)
            logging.info(f"Booking stored in MongoDB for {booking['email']}")
            
            # Update payment status
            pending_payments[payment_id]["status"] = "completed"
            
            return """
            <html>
                <head><title>Payment Successful</title></head>
                <body style="text-align: center; padding: 50px;">
                    <h1>Payment Successful!</h1>
                    <p>Your booking is confirmed. A confirmation email has been sent to your email address.</p>
                    <p>Thank you for booking with us!</p>
                    <a href="/">Return to Home</a>
                </body>
            </html>
            """
        
        return """
        <html>
            <head><title>Payment Status</title></head>
            <body style="text-align: center; padding: 50px;">
                <h1>Payment Not Completed</h1>
                <p>We couldn't verify your payment. Please try again or contact support.</p>
                <a href="/">Return to Home</a>
            </body>
        </html>
        """
        
    except Exception as e:
        logging.error(f"Payment callback error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Define correct port for Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
