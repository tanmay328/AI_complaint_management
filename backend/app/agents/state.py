from typing import TypedDict, Optional, List, Dict, Any


class AgentState(TypedDict, total=False):
    # inputs
    user_message: str
    document_text: Optional[str]  # text pulled from an uploaded PDF/DOCX/TXT/EML
    current_fields: Dict[str, Any]  # what's already on the form (from frontend)

    # working memory
    extracted_fields: Dict[str, Any]
    merged_fields: Dict[str, Any]
    fields_updated: List[str]
    missing_required_fields: List[str]
    capa_recommendation: Optional[str]

    # output
    assistant_reply: str
