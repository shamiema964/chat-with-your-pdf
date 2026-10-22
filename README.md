# Chat With Your PDF (RAG Demo)

Upload a PDF and ask questions in plain English. Answers come only from your document.

**Live demo:** https://shamiemashahzad.netlify.app/#ai-demo
**Direct app:** https://mimixpanda-chat-with-your-pdf.static.hf.space

## How it works
1. **Read PDF:** text is extracted in the browser (pdf.js)
2. **Chunk:** text is split into ~1000-character chunks with 200 overlap
3. **Embed:** each chunk becomes a vector using MiniLM (`all-MiniLM-L6-v2`)
4. **Retrieve:** the question is embedded and the top 4 chunks are found by cosine similarity
5. **Generate:** the chunks and question go to an LLM (Groq, via a Cloudflare Worker proxy) which answers using only that context

Your PDF is processed inside your browser and is never uploaded or stored. Only the few relevant snippets are sent to the LLM.

## Files
- `index.html`: the web app (pdf.js + transformers.js)
- `worker.js`: Cloudflare Worker that hides the API key and calls Groq
- `RAG_Chat_With_Your_Data.ipynb`: the same pipeline in Python (LangChain + FAISS + Sentence-Transformers), runs on Google Colab

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/shamiema964/chat-with-your-pdf/blob/main/RAG_Chat_With_Your_Data.ipynb)

## Limitations
- Works best on text-based PDFs, not scanned images (no OCR)
- Answer quality depends on chunk size and the embedding model
- Single-user prototype, limited to 10 MB / 50 pages

Built by **Shamiema Shahzad**
