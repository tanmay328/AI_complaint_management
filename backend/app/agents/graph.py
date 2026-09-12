from langgraph.graph import StateGraph, END  # pyright: ignore[reportMissingImports]
from app.agents.state import AgentState
from app.agents.nodes import (
    extract_fields_node,
    merge_fields_node,
    capa_recommendation_node,
    generate_reply_node,
)


def build_extraction_graph():
    graph = StateGraph(AgentState)

    graph.add_node("extract_fields", extract_fields_node)
    graph.add_node("merge_fields", merge_fields_node)
    graph.add_node("capa_node", capa_recommendation_node)
    graph.add_node("generate_reply", generate_reply_node)

    graph.set_entry_point("extract_fields")
    graph.add_edge("extract_fields", "merge_fields")
    graph.add_edge("merge_fields", "capa_node")
    graph.add_edge("capa_node", "generate_reply")
    graph.add_edge("generate_reply", END)

    return graph.compile()


# compiled once, reused across requests
extraction_agent = build_extraction_graph()
