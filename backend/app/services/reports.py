"""
CustomerIQ - PDF Report Generation Service
Utilizes ReportLab to compile and generate professional business health and growth strategy reports.
"""

import io
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Dataset
from app.services.analytics import AnalyticsService
from app.services.insights import InsightsService
from app.services.recommendations import RecommendationService

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


class ReportService:
    @staticmethod
    async def generate_pdf_report(db: AsyncSession, dataset_id: int, report_type: str) -> bytes:
        """
        Asynchronously aggregates analytics and compiles a professional PDF report.
        Returns the raw PDF binary bytes.
        """
        # Fetch dataset details
        q = select(Dataset).where(Dataset.id == dataset_id)
        res = await db.execute(q)
        dataset = res.scalar_one_or_none()
        if not dataset:
            raise ValueError("Dataset not found")

        # Compile analytics and recommendations data
        customer_m = await AnalyticsService.get_customer_analytics(db, dataset_id)
        product_m = await AnalyticsService.get_product_analytics(db, dataset_id)
        sales_m = await AnalyticsService.get_sales_analytics(db, dataset_id)
        geo_m = await AnalyticsService.get_geographic_analytics(db, dataset_id)
        behavior_m = await AnalyticsService.get_behavioral_analytics(db, dataset_id)
        rankings_m = await AnalyticsService.get_rankings(db, dataset_id)

        analytics_data = {
            "customer": customer_m,
            "product": product_m,
            "sales": sales_m,
            "geo": geo_m,
            "behavior": behavior_m
        }

        advisor_data = RecommendationService.generate_recommendations_and_scores(analytics_data)
        insights_data = InsightsService.generate_insights(analytics_data)

        # Set up ReportLab Document in-memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        
        # Define clean, modern color scheme
        primary_color = colors.HexColor("#06B6D4") # Cyan
        secondary_color = colors.HexColor("#1E293B") # Slate
        text_color = colors.HexColor("#334155")
        title_color = colors.HexColor("#0F172A")

        # Define custom paragraph styles
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=title_color,
            spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            "ReportSub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=24
        )
        h1_style = ParagraphStyle(
            "ReportH1",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=primary_color,
            spaceBefore=16,
            spaceAfter=10,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=text_color,
            spaceAfter=8
        )
        bold_body = ParagraphStyle(
            "ReportBodyBold",
            parent=body_style,
            fontName="Helvetica-Bold"
        )
        callout_style = ParagraphStyle(
            "ReportCallout",
            parent=body_style,
            fontName="Helvetica-Oblique",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#0891B2"),
            backColor=colors.HexColor("#ECFEFF"),
            borderColor=colors.HexColor("#CFFAFE"),
            borderWidth=1,
            borderPadding=8,
            spaceAfter=12
        )

        story = []

        # Header section
        story.append(Paragraph(f"CustomerIQ — {report_type.upper()} REPORT", title_style))
        story.append(Paragraph(f"Dataset: {dataset.name} | Compiled on {datetime.now().strftime('%Y-%m-%d %H:%M')}", subtitle_style))
        story.append(Spacer(1, 12))

        if report_type == "health":
            # EXECUTIVE SUMMARY
            story.append(Paragraph("Executive Summary", h1_style))
            overall_score = advisor_data["opportunity_scores"]["overall_score"]
            summary_text = (
                f"This Business Health Report presents a comprehensive audit of the dataset '{dataset.name}'. "
                f"The platform assessed sales distributions, client retention variables, and category performance rankings. "
                f"Based on these metrics, CustomerIQ calculated an Overall Opportunity Score of <b>{overall_score}/100</b>, "
                f"indicating the business is operating with a solid foundation but has significant room for optimization."
            )
            story.append(Paragraph(summary_text, body_style))
            story.append(Spacer(1, 10))

            # KEY METRICS TABLE
            story.append(Paragraph("KPI Metrics Overview", h1_style))
            kpi_data = [
                [Paragraph("Metric", bold_body), Paragraph("Value", bold_body), Paragraph("Diagnostic State", bold_body)],
                [Paragraph("Total Revenue", body_style), Paragraph(f"${customer_m['clv']:,.2f}", body_style), Paragraph("Total transactional value", body_style)],
                [Paragraph("Total Customers", body_style), Paragraph(f"{customer_m['total_customers']:,}", body_style), Paragraph("Unique buyers", body_style)],
                [Paragraph("Average Order Value (AOV)", body_style), Paragraph(f"${customer_m['average_spend']:,.2f}", body_style), Paragraph("Spend per transaction", body_style)],
                [Paragraph("Repeat Customer Rate", body_style), Paragraph(f"{customer_m['returning_rate']:.1f}%", body_style), Paragraph("Loyalty factor", body_style)]
            ]
            t = Table(kpi_data, colWidths=[150, 100, 250])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
                ('BOTTOMPADDING', (0,0), (-1,0), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ('BOTTOMPADDING', (0,1), (-1,-1), 6),
            ]))
            story.append(t)
            story.append(Spacer(1, 12))

            # REVENUE & CATEGORY TRENDS
            story.append(Paragraph("Category Performance Leaderboard", h1_style))
            cat_data = [
                [Paragraph("Category", bold_body), Paragraph("Revenue", bold_body), Paragraph("Units Sold", bold_body), Paragraph("Revenue Share", bold_body)]
            ]
            for cat in rankings_m["categories"][:5]:
                cat_data.append([
                    Paragraph(cat["category"], body_style),
                    Paragraph(f"${cat['revenue']:,.2f}", body_style),
                    Paragraph(f"{cat['units']:,}", body_style),
                    Paragraph(f"{cat['share']:.1f}%", body_style)
                ])
            t_cat = Table(cat_data, colWidths=[150, 120, 100, 130])
            t_cat.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(t_cat)
            story.append(Spacer(1, 12))

            # KEY INSIGHTS LIST
            story.append(Paragraph("Key Insights & Critical Signals", h1_style))
            for ins in insights_data[:4]:
                priority_color = "#EF4444" if ins["priority"] == "High" else "#F59E0B"
                ins_title = f"<font color='{priority_color}'><b>[{ins['priority']}]</b></font> {ins['title']}"
                story.append(Paragraph(ins_title, bold_body))
                story.append(Paragraph(ins["description"], body_style))
                story.append(Paragraph(f"<i>{ins['impact']}</i>", body_style))
                story.append(Spacer(1, 8))

        else: # GROWTH STRATEGY REPORT
            # SWOT CONTEXT
            story.append(Paragraph("SWOT Playbook Context", h1_style))
            swot_text = (
                "Growth strategies are derived by mapping weaknesses (leaky retention funnels) "
                "against strengths (concentrated geo markets, purchase times). The following recommendations "
                "offer concrete actions to build capital value and accelerate customer conversion."
            )
            story.append(Paragraph(swot_text, body_style))
            story.append(Spacer(1, 10))

            # OPPORTUNITY SCORES
            story.append(Paragraph("Opportunity Scores Analysis", h1_style))
            scores = advisor_data["opportunity_scores"]
            score_data = [
                [Paragraph("Growth Domain", bold_body), Paragraph("Score", bold_body), Paragraph("Strategic Analysis", bold_body)],
                [Paragraph("Customer Growth", body_style), Paragraph(f"{scores['customer_growth']['score']}/100", body_style), Paragraph(scores['customer_growth']['explanation'], body_style)],
                [Paragraph("Product Growth", body_style), Paragraph(f"{scores['product_growth']['score']}/100", body_style), Paragraph(scores['product_growth']['explanation'], body_style)],
                [Paragraph("Geographic Expansion", body_style), Paragraph(f"{scores['geographic_growth']['score']}/100", body_style), Paragraph(scores['geographic_growth']['explanation'], body_style)],
                [Paragraph("Category Growth", body_style), Paragraph(f"{scores['category_growth']['score']}/100", body_style), Paragraph(scores['category_growth']['explanation'], body_style)]
            ]
            t_score = Table(score_data, colWidths=[120, 60, 320])
            t_score.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(t_score)
            story.append(Spacer(1, 12))

            # STRATEGIC RECOMMENDATIONS
            story.append(Paragraph("Actionable Recommendations Playbook", h1_style))
            for rec in advisor_data["recommendations"]:
                story.append(Paragraph(f"<b>[{rec['category']}] — {rec['title']}</b> ({rec['impact']} Impact)", bold_body))
                story.append(Paragraph(rec["description"], body_style))
                callout_text = f"Action: {rec['action']}"
                story.append(Paragraph(callout_text, callout_style))
                story.append(Spacer(1, 8))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
