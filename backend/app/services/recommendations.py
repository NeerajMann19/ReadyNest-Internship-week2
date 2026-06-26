"""
CustomerIQ - Recommendation & Opportunity Score Service
Evaluates computed analytics metrics against business thresholds to generate custom strategic advice and scores.
"""

from typing import Dict, Any, List

class RecommendationService:
    @staticmethod
    def generate_recommendations_and_scores(analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes compiled analytics data, runs business rule validations,
        and generates growth recommendations alongside opportunity scores.
        """
        customer_data = analytics_data.get("customer", {})
        product_data = analytics_data.get("product", {})
        sales_data = analytics_data.get("sales", {})
        geo_data = analytics_data.get("geo", {})
        behavior_data = analytics_data.get("behavior", {})

        recommendations: List[Dict[str, Any]] = []

        # 1. Customer Retention Rule
        returning_rate = customer_data.get("returning_rate", 0.0)
        if returning_rate < 30.0:
            recommendations.append({
                "category": "Customer Retention",
                "title": "Launch Automated Loyalty Program",
                "description": f"Your returning customer rate is currently {returning_rate:.1f}%. Introducing a post-purchase coupon or points-based loyalty tier will incentivize one-time buyers to purchase again.",
                "action": "Configure re-engagement campaign",
                "impact": "High"
            })
            cust_score = int(40 + (returning_rate * 1.5))
            cust_expl = "A low returning customer rate indicates a leaky marketing funnel. Focus on customer retention."
        else:
            recommendations.append({
                "category": "Customer Retention",
                "title": "Establish VIP Referral Scheme",
                "description": f"With a solid repeat buyer rate of {returning_rate:.1f}%, your loyal customer base is primed to refer friends. Create a referral discount scheme to amplify organic acquisition.",
                "action": "Set up referral loop",
                "impact": "Medium"
            })
            cust_score = int(min(100, 70 + (returning_rate * 0.5)))
            cust_expl = "Your repeat buyer rate is healthy, providing stable recurring margins to fund acquisition campaigns."

        # 2. Category Diversification Rule
        cat_rankings = product_data.get("category_rankings", [])
        if cat_rankings:
            top_cat = cat_rankings[0]
            cat_name = top_cat.get("category", "Uncategorized")
            cat_share = top_cat.get("share", 0.0)

            if cat_share > 60.0:
                recommendations.append({
                    "category": "Category Growth",
                    "title": "Catalog Diversification Strategy",
                    "description": f"Over {cat_share:.1f}% of your revenue is concentrated in '{cat_name}'. Expanding adjacent product departments will mitigate market dependency and balance risk.",
                    "action": "Research category catalog",
                    "impact": "High"
                })
                cat_score = int(max(10, 100 - cat_share))
                cat_expl = f"High product centralization in '{cat_name}' exposes you to supply chain risks. Introduce new product categories."
            else:
                recommendations.append({
                    "category": "Category Growth",
                    "title": "Cross-Department Product Bundling",
                    "description": f"Catalog revenue is well-distributed. Create cross-category bundle packs (e.g. pairing '{cat_name}' with secondary categories) to boost average cart values.",
                    "action": "Create bundle discounts",
                    "impact": "Medium"
                })
                cat_score = int(min(100, 50 + (100 - cat_share)))
                cat_expl = "Healthy catalog distribution. Focus on cross-selling between departments."
        else:
            cat_score = 70
            cat_expl = "No category data available to analyze catalog diversification."

        # 3. Geographic Expansion Rule
        countries = geo_data.get("countries", [])
        if countries:
            top_country = countries[0]
            c_name = top_country.get("country", "Unknown")
            c_share = top_country.get("share", 0.0)

            if c_share > 50.0:
                recommendations.append({
                    "category": "Geographic Growth",
                    "title": "International Expansion Campaign",
                    "description": f"Your sales are heavily concentrated in {c_name} ({c_share:.1f}% share). Setting up localized warehousing or regional shipping rates in secondary countries will unlock untapped growth.",
                    "action": "Review localization options",
                    "impact": "High"
                })
                geo_score = int(max(20, 110 - c_share))
                geo_expl = f"High market concentration in {c_name} leaves international markets open. Expand advertising to other regions."
            else:
                recommendations.append({
                    "category": "Geographic Growth",
                    "title": "Local Store Localization",
                    "description": f"Your geographical revenue is distributed. Implement localized ad copy targeting the top 3 countries (e.g. {c_name}) to increase regional conversion ratios.",
                    "action": "Optimize ad targets",
                    "impact": "Medium"
                })
                geo_score = int(min(100, 60 + c_share))
                geo_expl = "Geographic risk is low. Maintain localized marketing campaigns in top markets."
        else:
            geo_score = 65
            geo_expl = "Geographic details are missing. Add country tags to identify regional opportunities."

        # 4. Marketing Schedule Optimization Rule
        hours = behavior_data.get("hours", [])
        peak_hour = behavior_data.get("peak_hour", 12)
        
        # Calculate evening purchases ratio (17:00 to 23:00)
        total_orders = sum(h["orders"] for h in hours)
        evening_orders = sum(h["orders"] for h in hours if 17 <= h["hour"] <= 23)
        evening_ratio = (evening_orders / total_orders * 100) if total_orders > 0 else 0.0

        if evening_ratio > 40.0:
            recommendations.append({
                "category": "Marketing Timing",
                "title": "Schedule Evening Campaign Blasts",
                "description": f"Over {evening_ratio:.1f}% of orders occur in the evening. Scheduling email blasts and discount alerts to launch at 5:30 PM will capture shoppers during peak buying hours.",
                "action": "Schedule push triggers",
                "impact": "High"
            })
            mkt_score = int(min(100, 50 + evening_ratio))
            mkt_expl = "Evening buying intent is extremely strong. Tailor campaign delivery around evening slots."
        else:
            h_suffix = "PM" if peak_hour >= 12 else "AM"
            h_12 = peak_hour - 12 if peak_hour > 12 else (12 if peak_hour == 0 else peak_hour)
            recommendations.append({
                "category": "Marketing Timing",
                "title": "Pre-Peak Time Ad Delivery",
                "description": f"Transactions peak around {h_12} {h_suffix}. Optimize ad deliveries to trigger 30-45 minutes before this window to capture maximum audience awareness.",
                "action": "Align ad scheduler",
                "impact": "Medium"
            })
            mkt_score = 70
            mkt_expl = f"Transactions are distributed throughout the day, peaking at {h_12} {h_suffix}. Optimize campaigns around this hour."

        # Product growth score
        top_prods = product_data.get("top_selling_products", [])
        if top_prods:
            top_prod_rev = top_prods[0]["revenue"]
            total_prod_rev = product_data.get("total_product_revenue", 1.0)
            concentration = (top_prod_rev / total_prod_rev * 100) if total_prod_rev > 0 else 0.0
            prod_score = int(max(10, 100 - concentration))
            prod_expl = f"Your best seller represents {concentration:.1f}% of catalog sales. Mitigate listing concentration by highlighting other products."
        else:
            prod_score = 75
            prod_expl = "Product metrics are missing. Upload catalog item data to identify stock opportunities."

        # Overall calculation
        overall_score = int((cust_score + cat_score + geo_score + mkt_score + prod_score) / 5)

        return {
            "recommendations": recommendations,
            "opportunity_scores": {
                "customer_growth": {
                    "score": cust_score,
                    "explanation": cust_expl
                },
                "product_growth": {
                    "score": prod_score,
                    "explanation": prod_expl
                },
                "geographic_growth": {
                    "score": geo_score,
                    "explanation": geo_expl
                },
                "category_growth": {
                    "score": cat_score,
                    "explanation": cat_expl
                },
                "overall_score": overall_score
            }
        }
