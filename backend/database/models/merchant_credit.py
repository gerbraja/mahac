"""
Re-export de compatibilidad para MerchantCredit (definido en backend.database.models.merchant).
"""
from .merchant import MerchantCredit

__all__ = ["MerchantCredit"]
