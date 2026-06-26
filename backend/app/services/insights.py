"""
CustomerIQ - Insights Service
Converts raw business metrics and trends into human-readable, prioritized growth insights.
"""

from typing import List, Dict, Any

class InsightsService:
    @staticmethod
    def generate_insights(analytics_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Processes computed analytics data to dynamically construct a list of business insights.
        """
        insights: List[Dict[str, Any]] = []

        customer_data = analytics_data.get("customer", {})
        product_data = analytics_data.get("product", {})
        sales_data = analytics_data.get("sales", {})
        geo_data = analytics_data.get("geo", {})
        behavior_data = analytics_data.get("behavior", {})

        # 1. Returning Customer Rate Insight
        returning_rate = customer_data.get("returning_rate", 0.0)
        total_customers = customer_data.get("total_customers", 0)
        if total_customers > 0:
            if returning_rate < 30.0:
                insights.append({
                    "title": "Low Customer Retention Rate",
                    "description": f"Only {returning_rate:.1f}% of your customers are repeat buyers. A healthy SaaS/E-commerce benchmark is typically 30% or higher.",
                    "impact": "High Risk: Acquiring new customers is 5-25x more expensive than retaining existing ones.",
                    "priority": "High"
                })
            else:
                insights.append({
                    "title": "Strong Customer Loyalty",
                    "description": f"Repeat customers represent {returning_rate:.1f}% of your base, driving stable, predictable revenue growth.",
                    "impact": "Positive: Repeat buyers generate higher average order values over time.",
                    "priority": "Low"
                })

        # 2. Age Distribution Dominance
        age_dist = customer_data.get("age_distribution", {})
        if age_dist:
            # Find dominant age group
            total_age_cnt = sum(age_dist.values())
            if total_age_cnt > 0:
                dominant_group = max(age_dist, key=age_dist.get)
                pct = (age_dist[dominant_group] / total_age_cnt) * 100
                if pct > 40.0:
                    insights.append({
                        "title": f"Demographic Concentration: {dominant_group}",
                        "description": f"The '{dominant_group}' age bracket accounts for {pct:.1f}% of your total customer base.",
                        "impact": f"High Focus: Tailor products and messaging specifically to the preferences of the {dominant_group} demographic.",
                        "priority": "Medium"
                    })

        # 3. Product Category Concentration
        cat_rankings = product_data.get("category_rankings", [])
        if cat_rankings:
            top_cat = cat_rankings[0]
            cat_name = top_cat.get("category", "Uncategorized")
            cat_share = top_cat.get("share", 0.0)
            if cat_share > 50.0:
                insights.append({
                    "title": f"Product Catalog Dependency: {cat_name}",
                    "description": f"A single category ({cat_name}) contributes {cat_share:.1f}% of total revenue, indicating product centralization.",
                    "impact": "Risk Exposure: Supply chain disruptions or demand shifts in this category will severely impact overall revenue.",
                    "priority": "High"
                })
            elif cat_share > 30.0:
                insights.append({
                    "title": f"Top Performing Category: {cat_name}",
                    "description": f"Product sales in the '{cat_name}' department generate {cat_share:.1f}% of catalog revenue.",
                    "impact": "Advantage: Core product lines are performing well. Potential to upscale catalog offerings in this area.",
                    "priority": "Medium"
                })

        # 4. Country / Market Focus
        countries = geo_data.get("countries", [])
        if countries:
            top_country = countries[0]
            c_name = top_country.get("country", "Unknown")
            c_share = top_country.get("share", 0.0)
            if c_share > 40.0:
                insights.append({
                    "title": f"Market Dominance: {c_name}",
                    "description": f"Customers based in {c_name} generate {c_share:.1f}% of overall sales volume.",
                    "impact": "Market Insight: Strong regional product-market fit. Potential expansion point for regional localized ads.",
                    "priority": "High"
                })

        # 5. Peak Hour Behavioral Insight
        peak_hour = behavior_data.get("peak_hour")
        if peak_hour is not None:
            # Convert 24h to 12h format
            h_suffix = "PM" if peak_hour >= 12 else "AM"
            h_12 = peak_hour - 12 if peak_hour > 12 else (12 if peak_hour == 0 else peak_hour)
            
            # Map description based on hour brackets
            if 18 <= peak_hour <= 22:
                insights.append({
                    "title": "Evening Buying Pattern",
                    "description": f"Peak purchase activity spikes between 8 PM and 10 PM, with {h_12} {h_suffix} generating the most orders.",
                    "impact": "Campaign Optimizer: Schedule customer newsletter blasts and social campaigns around 7:30 PM to catch peak shopping time.",
                    "priority": "Medium"
                })
            elif 8 <= peak_hour <= 12:
                insights.append({
                    "title": "Morning Purchasing Focus",
                    "description": f"Transactions peak during business hours, with {h_12} {h_suffix} being the most active hour.",
                    "impact": "Support Priority: Ensure customer support chat lines are fully staffed during peak morning hours.",
                    "priority": "Low"
                })

        # 6. Sales growth trends
        trends = sales_data.get("revenue_trends", [])
        monthly_growth = sales_data.get("monthly_growth", 0.0)
        if len(trends) >= 2:
            if monthly_growth < 0:
                insights.append({
                    "title": "Negative Sales Growth Trend",
                    "description": f"Your monthly sales revenue contracted by {abs(monthly_growth):.1f}% compared to the previous month.",
                    "impact": "Alert: Immediate intervention required. Review product listings and customer churn signals.",
                    "priority": "High"
                })
            elif monthly_growth > 15.0:
                insights.append({
                    "title": "Rapid Revenue Expansion",
                    "description": f"Congratulations! Revenue grew by {monthly_growth:.1f}% month-over-month.",
                    "impact": "Velocity: Leverage this momentum by increasing inventory budgets for top-selling items.",
                    "priority": "Medium"
                })

        # Add fallback default insights if data is too small to trigger rules
        if not insights:
            insights.append({
                "title": "Baseline Insights Generated",
                "description": "The dataset has been successfully mapped. Add more data fields like country or purchase dates to unlock advanced demographic and behavior insights.",
                "impact": "Information: Basic dashboard KPIs are ready.",
                "priority": "Low"
            })

        return insights
