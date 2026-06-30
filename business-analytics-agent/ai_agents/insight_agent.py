"""
Groq Insight Agent - turns real database results into business insights.
"""
import json
from typing import Any, Dict, List

from ai_agents.groq_service import get_groq_service


class InsightAgent:
    def generate_insight(
        self,
        user_query: str,
        business_context: Dict[str, Any],
        sql_result: Dict[str, Any] | None = None,
    ) -> str:
        prompt = f"""
You are an expert Business Analytics AI Agent.
Answer the user's question using only the real business data provided.

User question:
{user_query}

Business summary data:
{json.dumps(business_context, indent=2, default=str)}

SQL result for this question:
{json.dumps(sql_result or {}, indent=2, default=str)}

Response rules:
- Answer in 3 to 5 short sentences.
- Use exact numbers from the data.
- Mention customer/product/category names when useful.
- Give one practical recommendation.
- Do not invent data.
"""
        return get_groq_service().chat(
            [
                {"role": "system", "content": "You are a concise, data-driven business analyst."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=500,
        )

    def generate_recommendations(self, context: Dict[str, Any]) -> List[str]:
        prompt = f"""
Based on this business data, return exactly 3 actionable recommendations as JSON array of strings.
Data: {json.dumps(context, default=str)}
"""
        try:
            content = get_groq_service().chat(
                [{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=300,
            )
            return json.loads(content)
        except Exception:
            return [
                "Focus marketing on the highest revenue customer segments.",
                "Promote top-performing products through bundles or discounts.",
                "Track monthly revenue trends to identify slow-growth periods early.",
            ]
