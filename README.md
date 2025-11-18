
# Vizag Resort Booking AI Chat

This project contains a FastAPI backend + LangGraph agent for
`https://vizagresortbooking.in` with RAG + (placeholder) SQL integration,
and a web chat widget that uses your dolphin-heart V logo.

## Quick Start

1. Put your `logo.png` into `app/static/logo.png`.
2. Copy your `chroma_store` folder (from Colab RAG notebook) into `app/chroma_store`.
3. Set environment variables:
   - `OPENAI_API_KEY`
   - optionally `DATABASE_URL` pointing to your bookings DB
4. Run locally:

```bash
pip install -r app/requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. Visit `http://localhost:8000/static/chat-widget.html` to test the widget.

For production on EC2, build with Docker:

```bash
docker-compose up -d --build
```
