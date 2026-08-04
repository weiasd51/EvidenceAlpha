import json
from dataclasses import dataclass
from typing import Any

import httpx

from backend.config import get_settings


ROLE_PROMPTS = {
    "bull": "你是看多研究员。只能使用给定证据构建最强正向假设，不得补充外部事实。",
    "bear": "你是看空研究员。只能使用给定证据寻找反例、下行风险和已经被定价的可能性。",
    "critic": "你是审计员。检查观点是否被证据支持、是否过度自信、是否存在时点泄漏。",
    "judge": "你是投研裁决员。综合正反观点，输出可验证、带失效条件的研究假设，不构成投资建议。",
}


@dataclass
class LLMCall:
    data: dict[str, Any]
    total_tokens: int


class OpenAICompatibleLLM:
    """Small provider adapter; the system remains runnable when no key is set."""

    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def enabled(self) -> bool:
        return bool(self.settings.llm_api_key.strip())

    def ask(self, role: str, payload: dict[str, Any]) -> LLMCall:
        if role not in ROLE_PROMPTS:
            raise ValueError(f"unknown role: {role}")
        endpoint = f"{self.settings.llm_base_url.rstrip('/')}/chat/completions"
        response = httpx.post(
            endpoint,
            headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
            json={
                "model": self.settings.llm_model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "system",
                        "content": ROLE_PROMPTS[role]
                        + " 输出严格 JSON，字段为 summary、signal、confidence、evidence_ids、risks。",
                    },
                    {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
                ],
            },
            timeout=45.0,
        )
        response.raise_for_status()
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        data = json.loads(content)
        if not isinstance(data, dict):
            raise ValueError("model output must be a JSON object")
        return LLMCall(data=data, total_tokens=int(body.get("usage", {}).get("total_tokens", 0)))


def evidence_payload(evidences: list[Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": item.external_id,
            "title": item.title,
            "summary": item.summary,
            "source": item.source,
            "published_at": item.published_at.isoformat(),
            "stance_hint": item.stance,
        }
        for item in evidences
    ]

