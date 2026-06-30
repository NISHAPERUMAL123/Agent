"""
Groq Service - single reusable Groq client for the whole AI agent system.
Keep your API key only in .env:
GROQ_API_KEY=gsk_your_key_here
"""
import os
from functools import lru_cache
from typing import List, Dict, Optional

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


class GroqService:
    def __init__(self, model: Optional[str] = None):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is missing. Add GROQ_API_KEY=gsk_... to your .env file."
            )
        self.client = Groq(api_key=api_key)
        self.model = model or DEFAULT_MODEL

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 700,
    ) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()


@lru_cache(maxsize=1)
def get_groq_service() -> GroqService:
    return GroqService()
