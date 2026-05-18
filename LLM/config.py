"""
Configuration for A2S - AI Interior Design Product Recommendation Agent.

This module centralizes all configuration: API keys, file paths, model
settings, and application defaults.

Secret resolution prefers Azure Key Vault when AZURE_KEY_VAULT_URI is set
and the runtime has a usable Azure credential (managed identity in prod,
`az login` locally). It falls back transparently to environment variables
so local development with a plain `.env` file keeps working.
"""

import logging
import os
from functools import lru_cache
from typing import Optional

_logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Secret loader (Azure Key Vault → env var fallback)
# ──────────────────────────────────────────────
_KEY_VAULT_URI = (os.environ.get("AZURE_KEY_VAULT_URI") or "").strip(" '\"")
_kv_client = None
_kv_client_init_attempted = False


def _get_kv_client():
    """Lazily build the Azure Key Vault client. Returns None on any failure."""
    global _kv_client, _kv_client_init_attempted
    if _kv_client is not None or _kv_client_init_attempted:
        return _kv_client
    _kv_client_init_attempted = True
    if not _KEY_VAULT_URI:
        return None
    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient
        _kv_client = SecretClient(
            vault_url=_KEY_VAULT_URI,
            credential=DefaultAzureCredential(exclude_interactive_browser_credential=True),
        )
        _logger.info("Key Vault client initialised: %s", _KEY_VAULT_URI)
        return _kv_client
    except Exception as exc:
        _logger.warning("Key Vault client init failed (%s); falling back to env vars", exc)
        return None


@lru_cache(maxsize=64)
def get_secret(name: str, default: str = "") -> str:
    """
    Resolve a secret by canonical (UPPER_SNAKE) name.

    Priority:
      1. Azure Key Vault if AZURE_KEY_VAULT_URI is set and reachable.
         The KV secret name is the lower-kebab form of `name`
         (e.g. NVIDIA_NIM_API_KEY → nvidia-nim-api-key).
      2. Environment variable `name`.
      3. `default`.

    Returns a stripped string. Empty result is returned as the empty string
    (not None) so callers can use truthy checks.
    """
    client = _get_kv_client()
    if client is not None:
        kv_name = name.lower().replace("_", "-")
        try:
            secret = client.get_secret(kv_name)
            value = (secret.value or "").strip(" '\"")
            if value:
                return value
        except Exception as exc:
            _logger.debug("Key Vault lookup miss for %s: %s", kv_name, exc)

    env_value = (os.environ.get(name) or "").strip(" '\"")
    return env_value or default


# ──────────────────────────────────────────────
# Google Gemini API
# ──────────────────────────────────────────────
GEMINI_API_KEY = get_secret("GEMINI_API_KEY") or get_secret("Gemini_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

# ──────────────────────────────────────────────
# Groq API
# ──────────────────────────────────────────────
GROQ_API_KEY = get_secret("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

# ──────────────────────────────────────────────
# NVIDIA NIM (Vastu vision direction inference)
# ──────────────────────────────────────────────
NVIDIA_NIM_API_KEY = get_secret("NVIDIA_NIM_API_KEY")
NVIDIA_NIM_URL = os.environ.get("NVIDIA_NIM_URL", "https://integrate.api.nvidia.com/v1/chat/completions")
NVIDIA_NIM_MODEL = os.environ.get("NVIDIA_NIM_MODEL", "meta/llama-3.2-90b-vision-instruct")

# ──────────────────────────────────────────────
# Data - Managed via Azure SQL (DB source of truth)
# ──────────────────────────────────────────────
# Legacy Excel paths removed.

# ──────────────────────────────────────────────
# Product Catalog Settings
# ──────────────────────────────────────────────
# Columns to keep after merging (canonical names)
CANONICAL_COLUMNS = [
    "design_id",
    "room_type",
    "style",
    "budget_min",
    "budget_max",
    "color_palette",
    "image_url",
    "product_id",
    "product_type",
    "product_name",
    "brand",
    "price_currency",
    "price_value",
    "dimensions",
    "width_cm",
    "depth_cm",
    "height_cm",
    "affiliate_url",
    "paint_brand",
    "paint_code",
    "decor_type",
    "quantity_in_design",
    "role_in_design",
    "source_url",
    "source",          # amazon.in / flipkart.com / ikea.com
    "scraped_date",    # when data was scraped
    "color",           # from IKEA
    "material",        # from IKEA
    "rating",          # from Amazon/Flipkart
]

# ──────────────────────────────────────────────
# Agent Defaults
# ──────────────────────────────────────────────
MAX_RESULTS_PER_QUERY = 5           # Products to show per response
MAX_CONTEXT_MESSAGES = 50           # Max messages kept in context window
TEMPERATURE = 0.7                   # Gemini temperature
TOP_P = 0.95                        # Gemini top-p

# ──────────────────────────────────────────────
# Known domain values (used for entity matching)
# ──────────────────────────────────────────────
ROOM_TYPES = ["bedroom", "living_room", "drawing_room", "dining_room", "kids_room", "study", "balcony", "pooja_room", "kitchen", "bathroom"]
STYLES = ["classic", "contemporary", "ethnic", "functional", "minimal", "modern"]
COLOR_PALETTES = ["cool", "dark wood", "light wood", "neutral", "red and beige", "warm", "white", "wood tones"]
PRODUCT_TYPES = ["sofa", "bed", "lighting", "table", "storage", "decor", "chair", "textile", "appliance", "kitchen_accessory", "outdoor", "misc"]
PAINT_BRANDS = ["Asian Paints", "Berger", "Nerolac"]
DECOR_TYPES = ["clock", "curtain", "lamp", "mirror", "vase", "wall art"]
ROLES = ["ambient lighting", "centerpiece", "dining", "floor decor", "main bed", "main seating", "storage"]

# ──────────────────────────────────────────────
# Streamlit UI Settings
# ──────────────────────────────────────────────
APP_TITLE = "A2S – AI Interior Design Assistant"
APP_ICON = "🏠"
APP_DESCRIPTION = "Your smart interior design product advisor. Ask me about furniture, lighting, decor — I'll find the perfect products for your room, budget, and style."
