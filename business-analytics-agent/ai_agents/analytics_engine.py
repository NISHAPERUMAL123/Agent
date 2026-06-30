"""
Analytics Engine - Calculates business metrics and KPIs
"""
from datetime import datetime, timedelta

class AnalyticsEngine:
    def __init__(self):
        pass
    
    def calculate_revenue_growth(self, current_revenue, previous_revenue):
        """Calculate revenue growth percentage"""
        if previous_revenue == 0:
            return 0
        growth = ((current_revenue - previous_revenue) / previous_revenue) * 100
        return round(growth, 2)
    
    def calculate_profit_margin(self, revenue, cost):
        """Calculate profit margin percentage"""
        if revenue == 0:
            return 0
        profit = revenue - cost
        margin = (profit / revenue) * 100
        return round(margin, 2)
    
    def customer_retention_rate(self, returning_customers, total_customers):
        """Calculate customer retention rate"""
        if total_customers == 0:
            return 0
        retention = (returning_customers / total_customers) * 100
        return round(retention, 2)
    
    def analyze_trends(self, data_points):
        """
        Analyze trend direction (increasing, decreasing, stable)
        data_points: list of numbers [oldest -> newest]
        """
        if len(data_points) < 2:
            return "insufficient_data"
        
        # Calculate average of first half vs second half
        mid = len(data_points) // 2
        first_half_avg = sum(data_points[:mid]) / mid
        second_half_avg = sum(data_points[mid:]) / len(data_points[mid:])
        
        change = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        
        if change > 5:
            return "increasing"
        elif change < -5:
            return "decreasing"
        else:
            return "stable"
    
    def top_performers(self, items, metric='revenue', limit=5):
        """
        Find top performing items
        items: list of dicts with metrics
        """
        sorted_items = sorted(items, key=lambda x: x.get(metric, 0), reverse=True)
        return sorted_items[:limit]
    
    def segment_customers(self, revenue):
        """Segment customers based on revenue contribution"""
        if revenue > 50000:
            return "High Value"
        elif revenue > 10000:
            return "Medium Value"
        else:
            return "Low Value"


# Test it
if __name__ == "__main__":
    engine = AnalyticsEngine()
    
    # Test growth calculation
    print("Revenue Growth:", engine.calculate_revenue_growth(120000, 100000), "%")
    
    # Test profit margin
    print("Profit Margin:", engine.calculate_profit_margin(100000, 60000), "%")
    
    # Test trend analysis
    sales_data = [45000, 48000, 52000, 55000, 58000, 62000]
    print("Trend:", engine.analyze_trends(sales_data))
    
    # Test customer segmentation
    print("Customer Segment:", engine.segment_customers(75000))