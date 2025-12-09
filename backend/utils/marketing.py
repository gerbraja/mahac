# Country to flag emoji mapping
COUNTRY_FLAGS = {
    "Colombia": "🇨🇴",
    "México": "🇲🇽",
    "Mexico": "🇲🇽",
    "España": "🇪🇸",
    "Spain": "🇪🇸",
    "Argentina": "🇦🇷",
    "Chile": "🇨🇱",
    "Perú": "🇵🇪",
    "Peru": "🇵🇪",
    "Venezuela": "🇻🇪",
    "Ecuador": "🇪🇨",
    "Bolivia": "🇧🇴",
    "Paraguay": "🇵🇾",
    "Uruguay": "🇺🇾",
    "Brasil": "🇧🇷",
    "Brazil": "🇧🇷",
    "Estados Unidos": "🇺🇸",
    "United States": "🇺🇸",
    "USA": "🇺🇸",
    "Canadá": "🇨🇦",
    "Canada": "🇨🇦",
    "Panamá": "🇵🇦",
    "Panama": "🇵🇦",
    "Costa Rica": "🇨🇷",
    "Guatemala": "🇬🇹",
    "Honduras": "🇭🇳",
    "El Salvador": "🇸🇻",
    "Nicaragua": "🇳🇮",
    "República Dominicana": "🇩🇴",
    "Dominican Republic": "🇩🇴",
    "Puerto Rico": "🇵🇷",
    "Cuba": "🇨🇺",
}


def format_display_name(full_name: str) -> str:
    """
    Extract first name and first surname from full name.
    Examples:
        "Juan Carlos Pérez González" -> "Juan Pérez"
        "María López" -> "María López"
        "Pedro" -> "Pedro"
    """
    if not full_name:
        return "Usuario TEI"
    
    parts = full_name.strip().split()
    if len(parts) == 0:
        return "Usuario TEI"
    elif len(parts) == 1:
        return parts[0]
    elif len(parts) == 2:
        return f"{parts[0]} {parts[1]}"
    else:
        # Assume first part is first name, third part is first surname
        # (second part might be middle name)
        return f"{parts[0]} {parts[2]}" if len(parts) > 2 else f"{parts[0]} {parts[1]}"
