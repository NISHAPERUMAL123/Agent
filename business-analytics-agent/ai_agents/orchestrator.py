"""
Groq AI Orchestrator - coordinates SQL generation, database execution, and insight generation.
"""
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from ai_agents.sql_agent import SQLAgent
from ai_agents.insight_agent import InsightAgent


class AIOrchestrator:
    def __init__(self):
        self.sql_agent = SQLAgent()
        self.insight_agent = InsightAgent()

    def process_query(self, user_query: str, db: Session) -> Dict[str, Any]:
        business_context = self._collect_business_context(db)
        sql_result = self._run_question_sql(user_query, db)
        response = self.insight_agent.generate_insight(
            user_query=user_query,
            business_context=business_context,
            sql_result=sql_result,
        )
        return {
            "response": response,
            "query_type": "groq_agent",
            "powered_by": "Groq",
            "sql": sql_result.get("sql"),
            "data": sql_result.get("rows", []),
            "business_context": business_context,
        }

    def _run_question_sql(self, user_query: str, db: Session) -> Dict[str, Any]:
        generated = self.sql_agent.generate_sql(user_query)
        sql = generated["sql"]
        ok, message = self.sql_agent.validate_sql(sql)
        if not ok:
            return {"sql": sql, "error": message, "rows": []}

        try:
            result = db.execute(text(sql)).fetchmany(25)
            rows = [dict(row._mapping) for row in result]
            return {
                "sql": sql,
                "explanation": generated.get("explanation"),
                "rows": rows,
            }
        except Exception as e:
            return {"sql": sql, "error": str(e), "rows": []}

    def _collect_business_context(self, db: Session) -> Dict[str, Any]:
        def rows(sql: str, limit: int = 10) -> List[Dict[str, Any]]:
            result = db.execute(text(sql)).fetchmany(limit)
            return [dict(row._mapping) for row in result]

        overview = db.execute(text("""
            SELECT COUNT(*) AS total_sales,
                   COALESCE(SUM(amount), 0) AS total_revenue,
                   COALESCE(AVG(amount), 0) AS average_sale
            FROM sales
        """)).fetchone()

        return {
            "overview": dict(overview._mapping),
            "top_customers": rows("""
                SELECT c.name, c.city, c.segment,
                       COUNT(s.id) AS orders,
                       COALESCE(SUM(s.amount), 0) AS revenue
                FROM customers c
                LEFT JOIN sales s ON c.id = s.customer_id
                GROUP BY c.id, c.name, c.city, c.segment
                ORDER BY revenue DESC
                LIMIT 5
            """),
            "top_products": rows("""
                SELECT p.name, p.category,
                       COUNT(s.id) AS sales_count,
                       COALESCE(SUM(s.amount), 0) AS revenue
                FROM products p
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY p.id, p.name, p.category
                ORDER BY revenue DESC
                LIMIT 5
            """),
            "monthly_revenue": rows("""
                SELECT strftime('%Y-%m', sale_date) AS month,
                       COALESCE(SUM(amount), 0) AS revenue,
                       COUNT(*) AS sales_count
                FROM sales
                GROUP BY strftime('%Y-%m', sale_date)
                ORDER BY month
            """, limit=24),
            "category_revenue": rows("""
                SELECT COALESCE(p.category, 'General') AS category,
                       COALESCE(SUM(s.amount), 0) AS revenue
                FROM sales s
                LEFT JOIN products p ON s.product_id = p.id
                GROUP BY p.category
                ORDER BY revenue DESC
            """),
        }
