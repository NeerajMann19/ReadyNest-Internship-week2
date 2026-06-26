"""
CustomerIQ - Analytics & Insights Router
Exposes endpoints for fetching calculated business metrics and auto-generated insights.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import User, Dataset
from app.auth import get_current_user
from app.services.analytics import AnalyticsService
from app.services.insights import InsightsService
from app.services.recommendations import RecommendationService
from app.services.reports import ReportService

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

async def _get_user_dataset(dataset_id: int, db: AsyncSession, current_user: User) -> Dataset:
    """Helper to retrieve a dataset and assert ownership."""
    query = select(Dataset).where(Dataset.id == dataset_id, Dataset.uploaded_by == current_user.id)
    result = await db.execute(query)
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or access denied."
        )
    return dataset

@router.get("/{dataset_id}")
async def get_dataset_analytics(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Asynchronously aggregates customer, product, sales, geographic, and behavioral metrics
    for the specified dataset.
    """
    await _get_user_dataset(dataset_id, db, current_user)

    # Compile analytics asynchronously
    customer_metrics = await AnalyticsService.get_customer_analytics(db, dataset_id)
    product_metrics = await AnalyticsService.get_product_analytics(db, dataset_id)
    sales_metrics = await AnalyticsService.get_sales_analytics(db, dataset_id)
    geo_metrics = await AnalyticsService.get_geographic_analytics(db, dataset_id)
    behavior_metrics = await AnalyticsService.get_behavioral_analytics(db, dataset_id)

    return {
        "customer": customer_metrics,
        "product": product_metrics,
        "sales": sales_metrics,
        "geo": geo_metrics,
        "behavior": behavior_metrics
    }

@router.get("/{dataset_id}/insights")
async def get_dataset_insights(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculates analytics metrics and processes them through the Insights engine to generate
    human-readable, prioritized opportunity callouts.
    """
    await _get_user_dataset(dataset_id, db, current_user)

    # 1. Compile raw metrics
    customer_metrics = await AnalyticsService.get_customer_analytics(db, dataset_id)
    product_metrics = await AnalyticsService.get_product_analytics(db, dataset_id)
    sales_metrics = await AnalyticsService.get_sales_analytics(db, dataset_id)
    geo_metrics = await AnalyticsService.get_geographic_analytics(db, dataset_id)
    behavior_metrics = await AnalyticsService.get_behavioral_analytics(db, dataset_id)

    analytics_data = {
        "customer": customer_metrics,
        "product": product_metrics,
        "sales": sales_metrics,
        "geo": geo_metrics,
        "behavior": behavior_metrics
    }

    # 2. Run insights compiler
    insights = InsightsService.generate_insights(analytics_data)
    return insights

@router.get("/{dataset_id}/rankings")
async def get_dataset_rankings(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns leaderboards for customers, products, categories, and countries.
    """
    await _get_user_dataset(dataset_id, db, current_user)
    rankings = await AnalyticsService.get_rankings(db, dataset_id)
    return rankings

@router.get("/{dataset_id}/recommendations")
async def get_dataset_recommendations(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns AI growth recommendations and opportunity scores.
    """
    await _get_user_dataset(dataset_id, db, current_user)

    # 1. Compile raw metrics
    customer_metrics = await AnalyticsService.get_customer_analytics(db, dataset_id)
    product_metrics = await AnalyticsService.get_product_analytics(db, dataset_id)
    sales_metrics = await AnalyticsService.get_sales_analytics(db, dataset_id)
    geo_metrics = await AnalyticsService.get_geographic_analytics(db, dataset_id)
    behavior_metrics = await AnalyticsService.get_behavioral_analytics(db, dataset_id)

    analytics_data = {
        "customer": customer_metrics,
        "product": product_metrics,
        "sales": sales_metrics,
        "geo": geo_metrics,
        "behavior": behavior_metrics
    }

    # 2. Run recommendations compiler
    results = RecommendationService.generate_recommendations_and_scores(analytics_data)
    return results

@router.get("/{dataset_id}/reports/download")
async def download_dataset_report(
    dataset_id: int,
    type: str = "health",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates and streams a PDF Business Health or Growth Strategy report.
    """
    await _get_user_dataset(dataset_id, db, current_user)
    
    if type not in ["health", "growth"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report type. Only 'health' and 'growth' are supported."
        )
        
    try:
        pdf_bytes = await ReportService.generate_pdf_report(db, dataset_id, type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report PDF: {str(e)}"
        )
        
    filename = f"CustomerIQ_{type}_Report_{dataset_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )



