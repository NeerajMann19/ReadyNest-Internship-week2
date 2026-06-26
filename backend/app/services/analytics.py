"""
CustomerIQ - Analytics Service
Queries and compiles business metrics, segmentations, and sales curves asynchronously from PostgreSQL.
"""

from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, case
from app.models import Customer, Product, Order

class AnalyticsService:
    @staticmethod
    async def get_customer_analytics(db: AsyncSession, dataset_id: int) -> Dict[str, Any]:
        """
        Asynchronously computes customer intelligence (CLV, age/gender distributions, returning ratios).
        """
        # 1. Total unique customers
        total_stmt = select(func.count(Customer.id)).where(Customer.dataset_id == dataset_id)
        total_res = await db.execute(total_stmt)
        total_customers = total_res.scalar() or 0

        # 2. Returning customers (customers with > 1 orders)
        returning_subq = (
            select(Order.customer_id)
            .where(Order.dataset_id == dataset_id)
            .group_by(Order.customer_id)
            .having(func.count(Order.id) > 1)
            .subquery()
        )
        ret_stmt = select(func.count(returning_subq.c.customer_id))
        ret_res = await db.execute(ret_stmt)
        returning_customers = ret_res.scalar() or 0
        new_customers = total_customers - returning_customers

        # 3. CLV (Total Revenue) and Average Order Value
        financials_stmt = select(
            func.sum(Order.total_amount).label("total_rev"),
            func.avg(Order.total_amount).label("avg_aov")
        ).where(Order.dataset_id == dataset_id)
        fin_res = await db.execute(financials_stmt)
        fin_row = fin_res.first()
        clv = float(fin_row.total_rev) if fin_row and fin_row.total_rev else 0.0
        avg_spend = float(fin_row.avg_aov) if fin_row and fin_row.avg_aov else 0.0

        # 4. Age Distribution
        age_case = case(
            (Customer.age < 25, "Under 25"),
            ((Customer.age >= 25) & (Customer.age <= 34), "25-34"),
            ((Customer.age >= 35) & (Customer.age <= 50), "35-50"),
            else_="Over 50"
        ).label("age_group")
        
        age_stmt = (
            select(age_case, func.count(Customer.id))
            .where(Customer.dataset_id == dataset_id)
            .group_by(age_case)
        )
        age_res = await db.execute(age_stmt)
        age_dist = {str(group): count for group, count in age_res.all() if group is not None}

        # 5. Gender Distribution
        gender_stmt = (
            select(Customer.gender, func.count(Customer.id))
            .where(Customer.dataset_id == dataset_id)
            .group_by(Customer.gender)
        )
        gender_res = await db.execute(gender_stmt)
        gender_dist = {str(g or "Unknown"): count for g, count in gender_res.all()}

        return {
            "total_customers": total_customers,
            "new_customers": new_customers,
            "returning_customers": returning_customers,
            "returning_rate": (returning_customers / total_customers * 100) if total_customers > 0 else 0.0,
            "clv": clv,
            "average_spend": avg_spend,
            "age_distribution": age_dist,
            "gender_distribution": gender_dist
        }

    @staticmethod
    async def get_product_analytics(db: AsyncSession, dataset_id: int) -> Dict[str, Any]:
        """
        Asynchronously computes product intelligence (top selling, lowest selling, category rankings).
        """
        # 1. Top selling products
        top_stmt = (
            select(
                Product.product_id_ref,
                Product.name,
                func.sum(Order.quantity).label("units_sold"),
                func.sum(Order.total_amount).label("revenue")
            )
            .join(Order, Order.product_id == Product.id)
            .where(Product.dataset_id == dataset_id)
            .group_by(Product.id)
            .order_by(desc("units_sold"))
            .limit(5)
        )
        top_res = await db.execute(top_stmt)
        top_products = [
            {"ref": ref, "name": name, "units": int(units), "revenue": float(rev)}
            for ref, name, units, rev in top_res.all()
        ]

        # 2. Lowest selling products
        low_stmt = (
            select(
                Product.product_id_ref,
                Product.name,
                func.sum(Order.quantity).label("units_sold"),
                func.sum(Order.total_amount).label("revenue")
            )
            .join(Order, Order.product_id == Product.id)
            .where(Product.dataset_id == dataset_id)
            .group_by(Product.id)
            .order_by(asc("units_sold"))
            .limit(5)
        )
        low_res = await db.execute(low_stmt)
        lowest_products = [
            {"ref": ref, "name": name, "units": int(units), "revenue": float(rev)}
            for ref, name, units, rev in low_res.all()
        ]

        # 3. Category rankings
        cat_stmt = (
            select(
                Product.category,
                func.sum(Order.total_amount).label("revenue"),
                func.sum(Order.quantity).label("units")
            )
            .join(Order, Order.product_id == Product.id)
            .where(Product.dataset_id == dataset_id)
            .group_by(Product.category)
            .order_by(desc("revenue"))
        )
        cat_res = await db.execute(cat_stmt)
        category_rankings = [
            {"category": cat or "Uncategorized", "revenue": float(rev), "units": int(units)}
            for cat, rev, units in cat_res.all()
        ]

        # Calculate Total Revenue for shares
        total_rev = sum(c["revenue"] for c in category_rankings)
        for cat in category_rankings:
            cat["share"] = (cat["revenue"] / total_rev * 100) if total_rev > 0 else 0.0

        return {
            "top_selling_products": top_products,
            "lowest_selling_products": lowest_products,
            "category_rankings": category_rankings,
            "total_product_revenue": total_rev
        }

    @staticmethod
    async def get_sales_analytics(db: AsyncSession, dataset_id: int) -> Dict[str, Any]:
        """
        Asynchronously computes sales intelligence (revenue trends, growth coefficients).
        """
        # 1. Revenue trends by Month (YYYY-MM)
        trend_stmt = (
            select(
                func.to_char(Order.purchase_date, 'YYYY-MM').label("month"),
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("orders_count")
            )
            .where(Order.dataset_id == dataset_id)
            .group_by("month")
            .order_by("month")
        )
        trend_res = await db.execute(trend_stmt)
        trends = [
            {"month": m, "revenue": float(rev), "orders": int(cnt)}
            for m, rev, cnt in trend_res.all() if m is not None
        ]

        # 2. Calculate Growth coefficients
        monthly_growth = 0.0
        if len(trends) >= 2:
            prev = trends[-2]["revenue"]
            curr = trends[-1]["revenue"]
            if prev > 0:
                monthly_growth = ((curr - prev) / prev) * 100

        quarterly_growth = 0.0
        if len(trends) >= 6:
            prev_q = sum(t["revenue"] for t in trends[-6:-3])
            curr_q = sum(t["revenue"] for t in trends[-3:])
            if prev_q > 0:
                quarterly_growth = ((curr_q - prev_q) / prev_q) * 100

        # 3. Seasonal analysis (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
        seasons = {"Q1 (Spring)": 0.0, "Q2 (Summer)": 0.0, "Q3 (Autumn)": 0.0, "Q4 (Winter)": 0.0}
        for t in trends:
            month_num = int(t["month"].split("-")[1])
            val = t["revenue"]
            if month_num in [1, 2, 3]:
                seasons["Q1 (Spring)"] += val
            elif month_num in [4, 5, 6]:
                seasons["Q2 (Summer)"] += val
            elif month_num in [7, 8, 9]:
                seasons["Q3 (Autumn)"] += val
            else:
                seasons["Q4 (Winter)"] += val

        return {
            "revenue_trends": trends,
            "monthly_growth": monthly_growth,
            "quarterly_growth": quarterly_growth,
            "seasonal_distribution": seasons
        }

    @staticmethod
    async def get_geographic_analytics(db: AsyncSession, dataset_id: int) -> Dict[str, Any]:
        """
        Asynchronously computes regional metrics (top countries, top regions).
        """
        # Country contribution
        country_stmt = (
            select(
                Customer.country,
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("orders")
            )
            .join(Order, Order.customer_id == Customer.id)
            .where(Customer.dataset_id == dataset_id)
            .group_by(Customer.country)
            .order_by(desc("revenue"))
        )
        c_res = await db.execute(country_stmt)
        countries = [
            {"country": c or "Unknown", "revenue": float(rev), "orders": int(ord_cnt)}
            for c, rev, ord_cnt in c_res.all()
        ]

        # Calculate percentage share
        total_geo_rev = sum(c["revenue"] for c in countries)
        for c in countries:
            c["share"] = (c["revenue"] / total_geo_rev * 100) if total_geo_rev > 0 else 0.0

        # Region contribution
        region_stmt = (
            select(
                Customer.region,
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("orders")
            )
            .join(Order, Order.customer_id == Customer.id)
            .where(Customer.dataset_id == dataset_id)
            .group_by(Customer.region)
            .order_by(desc("revenue"))
        )
        r_res = await db.execute(region_stmt)
        regions = [
            {"region": r or "Unknown", "revenue": float(rev), "orders": int(ord_cnt)}
            for r, rev, ord_cnt in r_res.all()
        ]

        for r in regions:
            r["share"] = (r["revenue"] / total_geo_rev * 100) if total_geo_rev > 0 else 0.0

        return {
            "countries": countries,
            "regions": regions,
            "total_geographic_revenue": total_geo_rev
        }

    @staticmethod
    async def get_behavioral_analytics(db: AsyncSession, dataset_id: int) -> Dict[str, Any]:
        """
        Asynchronously computes purchase behaviors (peak times).
        """
        # Peak Hour of Day
        hour_stmt = (
            select(
                func.extract('hour', Order.purchase_date).label("hour"),
                func.count(Order.id).label("orders")
            )
            .where(Order.dataset_id == dataset_id)
            .group_by("hour")
            .order_by(desc("orders"))
        )
        h_res = await db.execute(hour_stmt)
        hours_list = [{"hour": int(h), "orders": int(c)} for h, c in h_res.all() if h is not None]
        peak_hour = hours_list[0]["hour"] if hours_list else 0

        # Peak Day of Week
        day_stmt = (
            select(
                func.to_char(Order.purchase_date, 'FMDay').label("day"),
                func.count(Order.id).label("orders")
            )
            .where(Order.dataset_id == dataset_id)
            .group_by("day")
        )
        d_res = await db.execute(day_stmt)
        days = [{"day": str(d).strip(), "orders": int(c)} for d, c in d_res.all() if d is not None]
        
        # Sort days by order count descending
        sorted_days = sorted(days, key=lambda x: x["orders"], reverse=True)
        peak_day = sorted_days[0]["day"] if sorted_days else "Unknown"

        # Peak Month of Year
        month_stmt = (
            select(
                func.to_char(Order.purchase_date, 'FMMonth').label("month"),
                func.count(Order.id).label("orders")
            )
            .where(Order.dataset_id == dataset_id)
            .group_by("month")
        )
        m_res = await db.execute(month_stmt)
        months = [{"month": str(m).strip(), "orders": int(c)} for m, c in m_res.all() if m is not None]
        
        sorted_months = sorted(months, key=lambda x: x["orders"], reverse=True)
        peak_month = sorted_months[0]["month"] if sorted_months else "Unknown"

        return {
            "hours": hours_list,
            "days": days,
            "months": months,
            "peak_hour": peak_hour,
            "peak_day": peak_day,
            "peak_month": peak_month
        }

    @staticmethod
    async def get_rankings(db: AsyncSession, dataset_id: int) -> Dict[str, Any]:
        """
        Returns Duolingo-style leaderboards for customers, products, categories, and countries.
        """
        # Fetch Total Revenue for percentage calculations
        total_rev_stmt = select(func.sum(Order.total_amount)).where(Order.dataset_id == dataset_id)
        total_rev_res = await db.execute(total_rev_stmt)
        total_revenue = float(total_rev_res.scalar() or 0.0)

        # 1. Top Customers
        cust_stmt = (
            select(
                Customer.customer_id_ref,
                Customer.name,
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("orders")
            )
            .join(Order, Order.customer_id == Customer.id)
            .where(Customer.dataset_id == dataset_id)
            .group_by(Customer.id)
            .order_by(desc("revenue"))
            .limit(10)
        )
        cust_res = await db.execute(cust_stmt)
        top_customers = []
        for i, (ref, name, rev, orders) in enumerate(cust_res.all()):
            rev_val = float(rev or 0.0)
            contrib_pct = (rev_val / total_revenue * 100) if total_revenue > 0 else 0.0
            top_customers.append({
                "rank": i + 1,
                "ref": ref,
                "name": name or "Unknown",
                "revenue": rev_val,
                "orders": int(orders),
                "contribution_pct": contrib_pct
            })

        # 2. Top Products
        prod_stmt = (
            select(
                Product.product_id_ref,
                Product.name,
                func.sum(Order.total_amount).label("revenue"),
                func.sum(Order.quantity).label("units_sold")
            )
            .join(Order, Order.product_id == Product.id)
            .where(Product.dataset_id == dataset_id)
            .group_by(Product.id)
            .order_by(desc("revenue"))
            .limit(10)
        )
        prod_res = await db.execute(prod_stmt)
        top_products = [
            {
                "rank": i + 1,
                "ref": ref,
                "name": name or "Unknown",
                "revenue": float(rev or 0.0),
                "units_sold": int(units or 0)
            }
            for i, (ref, name, rev, units) in enumerate(prod_res.all())
        ]

        # 3. Top Categories
        cat_stmt = (
            select(
                Product.category,
                func.sum(Order.total_amount).label("revenue"),
                func.sum(Order.quantity).label("units")
            )
            .join(Order, Order.product_id == Product.id)
            .where(Product.dataset_id == dataset_id)
            .group_by(Product.category)
            .order_by(desc("revenue"))
            .limit(10)
        )
        cat_res = await db.execute(cat_stmt)
        top_categories = []
        for i, (cat, rev, units) in enumerate(cat_res.all()):
            rev_val = float(rev or 0.0)
            share_pct = (rev_val / total_revenue * 100) if total_revenue > 0 else 0.0
            top_categories.append({
                "rank": i + 1,
                "category": cat or "Uncategorized",
                "revenue": rev_val,
                "units": int(units or 0),
                "share": share_pct
            })

        # 4. Top Countries
        country_stmt = (
            select(
                Customer.country,
                func.sum(Order.total_amount).label("revenue")
            )
            .join(Order, Order.customer_id == Customer.id)
            .where(Customer.dataset_id == dataset_id)
            .group_by(Customer.country)
            .order_by(desc("revenue"))
            .limit(10)
        )
        country_res = await db.execute(country_stmt)
        top_countries = []
        for i, (country, rev) in enumerate(country_res.all()):
            rev_val = float(rev or 0.0)
            share_pct = (rev_val / total_revenue * 100) if total_revenue > 0 else 0.0
            top_countries.append({
                "rank": i + 1,
                "country": country or "Unknown",
                "revenue": rev_val,
                "share": share_pct
            })

        return {
            "customers": top_customers,
            "products": top_products,
            "categories": top_categories,
            "countries": top_countries
        }

