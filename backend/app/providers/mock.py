import asyncio
import re

from app.models.ticket import Ticket
from app.providers.base import ExtractionProvider


class MockExtractionProvider(ExtractionProvider):

    def __init__(self, delay_ms: int = 500):
        self.delay_ms = delay_ms

    async def extract(
        self,
        ticket: Ticket,
        validation_error: str | None = None,
    ) -> dict:
        await asyncio.sleep(self.delay_ms / 1000)

        return self._extract(ticket, validation_error)

    def _extract(
        self,
        ticket: Ticket,
        validation_error: str | None = None,
    ) -> dict:
        raw_text = f"{ticket.subject} {ticket.body}"
        text = raw_text.lower()

        result = {
            "company": self._extract_company(raw_text),
            "product": self._extract_product(text),
            "category": self._extract_category(text),
            "severity": self._extract_severity(text),
            "requested_action": self._extract_action(text),
            "refund_amount": self._extract_refund_amount(text),
            "deadline": None,
            "escalated": self._extract_escalated(text),
        }

        # Simulate an extraction error on the first attempt only.
        # On retry, validation_error will contain a value and
        # the provider will return the normal valid category.
        if ticket.id == "tkt_0004" and validation_error is None:
            result["category"] = "not_a_real_category"

        # Simulate an extraction error that cannot be fixed by retry.
        if ticket.id == "tkt_0020":
            result["severity"] = "extremely_bad"

        return result

    def _extract_company(self, text: str) -> str:
        # Pattern 1:
        # Name | Job Title | Company
        match = re.search(
            r"\|\s*Head of Operations\s*\|\s*([^\n|]+)",
            text,
            re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

        # Pattern 2:
        # Zen Vault admin, Company
        match = re.search(
            r"\badmin,\s*([^\n]+)",
            text,
            re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

        # Pattern 3:
        # Regards
        # Name
        # Company
        match = re.search(
            r"(?:Regards|Thanks,?|Cordialement)\s*,?\s*\n[^\n]+\n([^\n]+)",
            text,
            re.IGNORECASE,
        )

        if match:
            company = match.group(1).strip()

            if "@" not in company:
                return company

        # Pattern 4:
        # CALLER: Hi, this is Dan from Castlerock Mining.
        match = re.search(
            r"CALLER:\s*Hi,\s*this is [^\n]+?\s+from\s+([A-Z][A-Za-z0-9&.-]*(?:\s+[A-Z][A-Za-z0-9&.-]*)*)\.",
            text,
        )

        if match:
            return match.group(1).strip()

        # Pattern 5:
        # VP Technology, Ferrolane Steel
        match = re.search(
            r"\b(?:VP Technology|Head of Operations),\s*([^\n]+)",
            text,
            re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

        return "Unknown Company"

    def _extract_product(self, text: str) -> str:
        products = {
            "zen orchestrator": "Zen Orchestrator",
            "zen studio": "Zen Studio",
            "zen connect": "Zen Connect",
            "zen insights": "Zen Insights",
            "zen vault": "Zen Vault",
        }

        for keyword, product in products.items():
            if keyword in text:
                return product

        return "Zen Studio"

    def _extract_category(self, text: str) -> str:
        if any(
            word in text
            for word in ["refund", "invoice", "charged", "billing", "bill"]
        ):
            return "billing"

        if any(
            word in text
            for word in ["outage", "down", "unavailable", "503", "504"]
        ):
            return "outage"

        if any(
            word in text
            for word in ["bug", "error", "broken", "fails", "failure"]
        ):
            return "bug"

        if any(
            word in text
            for word in ["feature", "support sso", "integration request"]
        ):
            return "feature_request"

        if any(
            word in text
            for word in ["cancel", "renewal", "terminate", "churn"]
        ):
            return "churn_risk"

        return "how_to"

    def _extract_action(self, text: str) -> str:
        if "refund" in text:
            return "refund"

        if "credit" in text:
            return "credit"

        if any(
            word in text
            for word in ["fix", "resolve", "repair"]
        ):
            return "fix"

        if any(
            word in text
            for word in ["call me", "call us", "callback"]
        ):
            return "callback"

        if any(
            word in text
            for word in ["what", "how", "does", "can you explain"]
        ):
            return "information"

        return "none"

    def _extract_escalated(self, text: str) -> bool:
        escalation_words = [
            "escalate",
            "escalating",
            "cfo",
            "legal",
            "terminate",
            "termination",
            "cancel",
            "renewal",
        ]

        return any(word in text for word in escalation_words)

    def _extract_severity(self, text: str) -> str:
        if any(
            word in text
            for word in ["critical", "entirely down", "all customers affected"]
        ):
            return "critical"

        if any(
            word in text
            for word in ["urgent", "production", "outage", "escalating"]
        ):
            return "high"

        if any(
            word in text
            for word in ["issue", "problem", "error", "bug"]
        ):
            return "medium"

        return "low"

    def _extract_refund_amount(self, text: str) -> float | None:
        match = re.search(r"\$([\d,]+(?:\.\d+)?)", text)

        if not match:
            return None

        return float(match.group(1).replace(",", ""))