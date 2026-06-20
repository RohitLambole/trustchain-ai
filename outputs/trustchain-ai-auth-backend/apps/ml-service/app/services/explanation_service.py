from app.schemas.prediction import InsiderRiskRequest, LoginRiskRequest, RecoveryRiskRequest


class ExplanationService:
    def login(self, payload: LoginRiskRequest) -> list[str]:
        reasons: list[str] = []
        if payload.device_age_days <= 3:
            reasons.append("new_device")
        if payload.failed_attempts >= 5:
            reasons.append("multiple_failed_logins")
        if payload.device_changes_30d >= 3:
            reasons.append("frequent_device_changes")
        if payload.geo_change == 1:
            reasons.append("geo_change")
        if payload.trust_score < 40:
            reasons.append("low_trust_score")
        if payload.login_hour <= 5:
            reasons.append("unusual_login_hour")
        return reasons or ["behavior_deviation"]

    def recovery(self, payload: RecoveryRiskRequest) -> list[str]:
        reasons: list[str] = []
        if payload.failed_recovery_attempts_7d >= 3:
            reasons.append("multiple_recovery_attempts")
        if payload.contact_change_24h == 1:
            reasons.append("recent_contact_change")
        if payload.new_device == 1:
            reasons.append("new_device")
        if payload.geo_change == 1:
            reasons.append("geo_change")
        if payload.trust_score < 45:
            reasons.append("low_trust_score")
        if payload.account_age_days < 30:
            reasons.append("new_account")
        return reasons or ["recovery_behavior_deviation"]

    def insider(self, payload: InsiderRiskRequest) -> list[str]:
        reasons: list[str] = []
        if payload.after_hours_access == 1:
            reasons.append("after_hours_access")
        if payload.records_accessed_1h >= 500:
            reasons.append("bulk_record_access")
        if payload.privileged_action_count_24h >= 20:
            reasons.append("privileged_action_spike")
        if payload.peer_deviation_score >= 70:
            reasons.append("peer_group_deviation")
        if payload.failed_admin_actions_24h >= 5:
            reasons.append("failed_admin_actions")
        if payload.sensitive_case_access == 1:
            reasons.append("sensitive_case_access")
        return reasons or ["insider_behavior_deviation"]
