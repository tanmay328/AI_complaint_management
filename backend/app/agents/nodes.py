import json
import re
from datetime import datetime
from app.agents.state import AgentState
from app.agents.llm import get_extraction_llm, get_chat_llm

FORM_FIELDS = [
    "complaint_source",
    "customer_name",
    "product_name",
    "product_strength_grade",
    "batch_lot_number",
    "manufacturing_date",
    "expiry_date",
    "quantity_affected",
    "quantity_unit",
    "complaint_type",
    "complaint_date",
    "detailed_complaint_description",
    "initial_severity",
    "priority",
]

REQUIRED_FIELDS = [
    "complaint_source",
    "customer_name",
    "product_name",
    "batch_lot_number",
    "complaint_type",
    "detailed_complaint_description",
]

EXTRACTION_SYSTEM_PROMPT = f"""You are a pharmaceutical Quality Assurance data-extraction engine embedded in a
Customer Complaint Management module (API & FDF manufacturing QMS).

Extract ONLY the following fields from the user's message / document text. Return STRICT JSON only,
no markdown, no commentary, no code fences.

Fields (use exactly these keys; use null if not present in the text — never guess):
- complaint_source: string. One of "Email", "Phone Call", "Customer Portal", "Regulatory Authority",
  "Field Representative", "Letter", or the closest match found in the text.
- customer_name: string. The name of the INDIVIDUAL PERSON who reported the complaint
  (e.g. "Dr. Mehta", "Mr. Rajesh Kumar"), if one is mentioned. Only use a company/hospital/
  distributor name if no individual person's name appears anywhere in the text. Never combine
  both — pick the person's name over the organization's name whenever a person is named.
- product_name: string. The pharmaceutical product name (API or FDF - Finished Dosage Form).
- product_strength_grade: string. e.g. "500mg", "10mg/ml", "USP Grade", "IP Grade".
- batch_lot_number: string. Batch or lot number.
- manufacturing_date: string in YYYY-MM-DD format, or null.
- expiry_date: string in YYYY-MM-DD format, or null.
- quantity_affected: number (just the numeric value), or null.
- quantity_unit: string, e.g. "kg", "units", "boxes", "vials". Default "kg" if a quantity is found but no unit stated.
- complaint_type: string. One of "Product Quality", "Packaging Defect", "Labeling Error",
  "Adverse Event", "Contamination", "Short Shipment", "Physical Damage", "Other", or closest match.
- complaint_date: string in YYYY-MM-DD format — date the complaint was raised/received, or null.
- detailed_complaint_description: string. A clear, concise 1-3 sentence summary of what went wrong,
  written in formal QA language, based on the source text.
- initial_severity: string. One of "Low", "Medium", "High", "Critical" — infer based on health/safety
  impact described (e.g. adverse events or contamination = High/Critical).
- priority: string. One of "Low", "Normal", "High", "Urgent" — infer based on severity and regulatory risk.

Return a single flat JSON object with exactly these 14 keys."""


def _safe_json_parse(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r"^```(json)?", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def extract_fields_node(state: AgentState) -> AgentState:
    llm = get_extraction_llm()
    source_text = state.get("document_text") or state.get("user_message") or ""

    messages = [
        ("system", EXTRACTION_SYSTEM_PROMPT),
        ("human", f"Source text:\n\n{source_text}"),
    ]
    response = llm.invoke(messages)
    parsed = _safe_json_parse(response.content)

    # keep only known keys, drop empty strings -> None
    cleaned = {}
    for key in FORM_FIELDS:
        val = parsed.get(key)
        if val in ("", "null", "None"):
            val = None
        cleaned[key] = val

    state["extracted_fields"] = cleaned
    return state


def merge_fields_node(state: AgentState) -> AgentState:
    current = state.get("current_fields") or {}
    extracted = state.get("extracted_fields") or {}

    merged = dict(current)
    updated = []
    for key in FORM_FIELDS:
        new_val = extracted.get(key)
        old_val = current.get(key)
        # only overwrite if AI found something new and it differs from what's there
        # (empty/None current values always get filled; non-empty values get
        # updated only if the new extraction is non-null, so re-asking doesn't blank things out)
        if new_val is not None and new_val != old_val:
            merged[key] = new_val
            updated.append(key)

    missing_required = [f for f in REQUIRED_FIELDS if not merged.get(f)]

    state["merged_fields"] = merged
    state["fields_updated"] = updated
    state["missing_required_fields"] = missing_required
    return state


def generate_reply_node(state: AgentState) -> AgentState:
    llm = get_chat_llm()
    updated = state.get("fields_updated") or []
    missing = state.get("missing_required_fields") or []
    merged = state.get("merged_fields") or {}
    user_message = state.get("user_message") or ""

    system_prompt = """You are the AI Complaint Intake Assistant for a pharmaceutical QA complaint
management system. You just ran field extraction against the user's message/document.
Reply conversationally and briefly (2-4 sentences max):
1. Confirm what you extracted/updated in the form (mention field names in plain language).
2. If required fields are still missing, ask a short, specific follow-up question to get them.
3. If everything required is filled, say the form is ready for review/save.
Do not repeat raw JSON. Be concise, professional, QA-appropriate tone."""

    human_prompt = f"""User said: {user_message}

Fields just updated: {updated}
Current form snapshot: {json.dumps(merged)}
Still-missing required fields: {missing}"""

    response = llm.invoke([("system", system_prompt), ("human", human_prompt)])
    state["assistant_reply"] = response.content.strip()
    return state


CAPA_RECOMMENDATION_PROMPT = """You are an AI Copilot generating a CAPA (Corrective and Preventive
Action) recommendation for a pharmaceutical Quality Assurance complaint (API & FDF manufacturing
QMS), based on the complaint data extracted so far.

If the complaint data is too sparse (no product name and no complaint type/description), respond
with exactly: NOT_ENOUGH_INFO

Otherwise, write a concise CAPA recommendation as 3-5 short numbered action steps in plain text
(no markdown, no JSON) covering, as relevant: immediate containment/quarantine actions, root cause
investigation approach, corrective action for the current batch, and preventive action to stop
recurrence. Ground every step in standard pharmaceutical QA/GMP practice. Keep each step to one
sentence. Do not add any preamble or closing remarks - just the numbered steps."""


def capa_recommendation_node(state: AgentState) -> AgentState:
    merged = state.get("merged_fields") or {}

    has_enough_context = bool(merged.get("product_name")) and bool(
        merged.get("detailed_complaint_description") or merged.get("complaint_type")
    )
    if not has_enough_context:
        state["capa_recommendation"] = None
        return state

    llm = get_chat_llm()
    human_prompt = f"Complaint data:\n{json.dumps(merged)}"
    response = llm.invoke([("system", CAPA_RECOMMENDATION_PROMPT), ("human", human_prompt)])
    text = response.content.strip()

    state["capa_recommendation"] = None if text == "NOT_ENOUGH_INFO" else text
    return state
